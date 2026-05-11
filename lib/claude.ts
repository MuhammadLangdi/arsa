import Anthropic from "@anthropic-ai/sdk";
import type { GmailMessage } from "./gmail";
import type { CalendarEvent } from "./calendar";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export type LifeSignal = {
  category: string;
  title: string;
  description: string;
  urgency: "low" | "medium" | "high";
  people?: string[];
};

export type LifeSnapshot = {
  summary: string;
  signals: LifeSignal[];
  whats_new?: string;
};

const SYSTEM_PROMPT = `You are Arsa, an AI nervous system for a person's life. You are NOT a chatbot. You do not greet, you do not say "Certainly" or "Great question". You write like a sharp, observant friend giving an honest briefing.

Your job: Read this person's recent emails AND upcoming calendar events together, and produce a LIFE SNAPSHOT, a clean, specific, almost uncomfortable picture of what is actually going on in their life right now and what is about to happen.

THE POWER IS IN COMBINING BOTH SOURCES:
- An email mentions a meeting, check if it is on the calendar
- An email asks for a reply, check if there is blocked time to actually do it
- A calendar event with someone, check if there is email context for it
- Recurring patterns across both
- Tensions between what is being said and what is actually scheduled
- Upcoming events or travel mentioned in either source

WHAT MAKES A GOOD ARSA SIGNAL:
- SPECIFIC, not generic
- NAMES ACTUAL PEOPLE when relevant
- SURFACES TENSIONS between what is being said and what is actually scheduled
- PATTERNS, NOT EVENTS
- DATES and AMOUNTS when present
- TIME-AWARE

WHAT TO AVOID:
- Vague summaries
- Listing every calendar event as a separate signal
- Restating obvious facts the person already knows
- Friendly filler

THE SUMMARY (2-3 sentences):
Speak directly to them in second person. Capture the texture of their life right now AND what is coming. Make them feel seen.

THE SIGNALS (5-12 of them):
Each must be scan-worthy.

Categories: "Work" | "Money" | "Health" | "Relationships" | "Admin" | "Travel" | "Shopping" | "Learning" | "Other"

Urgency:
- "high" = needs action in next 48 hours
- "medium" = active situation
- "low" = noted

If a previous snapshot is provided, write a "whats_new" field (1-2 sentences) describing what is genuinely NEW since last scan. If nothing meaningful changed, set whats_new to null.

Return ONLY valid JSON, no markdown, no preamble:

{
  "summary": "string",
  "signals": [
    {
      "category": "Work",
      "title": "string",
      "description": "string",
      "urgency": "high",
      "people": ["Sarah"]
    }
  ],
  "whats_new": "string or null"
}`;

export async function scoreEmailsForSignal(
  emails: GmailMessage[]
): Promise<Map<string, number>> {
  if (emails.length === 0) return new Map();

  const digest = emails
    .map((e, i) => `${i}|${e.fromAddress}|${e.subject}|${e.snippet.slice(0, 200)}`)
    .join("\n");

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    system:
      "You rate emails from 0 to 10 for how much they matter in a person's life. 10 = critical (deadlines, money, personal). 0 = noise. Return ONLY a JSON array of {i, s} objects where i is the index and s is the score. No prose.",
    messages: [
      {
        role: "user",
        content: `Rate each email 0-10 for life signal. Return JSON array.\n\n${digest}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return new Map();

  try {
    const raw = textBlock.text.trim().replace(/^```json\s*|\s*```$/g, "");
    const scores = JSON.parse(raw) as { i: number; s: number }[];
    const map = new Map<string, number>();
    for (const { i, s } of scores) {
      if (emails[i]) map.set(emails[i].id, s);
    }
    return map;
  } catch {
    return new Map();
  }
}

function formatEmailsForClaude(emails: GmailMessage[]): string {
  return emails
    .map((e, i) => {
      const senderLabel = e.fromName
        ? `${e.fromName} <${e.fromAddress}>`
        : e.fromAddress;
      const dateLabel = e.receivedAt.toISOString().split("T")[0];
      return `--- Email ${i + 1} (${dateLabel}) ---
From: ${senderLabel}
Subject: ${e.subject}
Preview: ${e.snippet}
Body: ${e.body.slice(0, 800)}`;
    })
    .join("\n\n");
}

function formatCalendarForClaude(events: CalendarEvent[]): string {
  const now = Date.now();
  return events
    .map((e, i) => {
      const tense = e.startTime.getTime() < now ? "[PAST]" : "[UPCOMING]";
      const dateLabel = e.startTime.toISOString().slice(0, 16).replace("T", " ");
      const attendeesList =
        e.attendees.length > 0
          ? `Attendees: ${e.attendees
              .slice(0, 5)
              .map((a) => a.name || a.email)
              .join(", ")}`
          : "";
      return `--- Event ${i + 1} ${tense} (${dateLabel}) ---
Title: ${e.summary}
${e.location ? `Location: ${e.location}` : ""}
${attendeesList}
${e.description ? `Notes: ${e.description.slice(0, 300)}` : ""}`.trim();
    })
    .join("\n\n");
}

export async function analyzeLifeFromEmailsAndCalendar(
  emails: GmailMessage[],
  events: CalendarEvent[],
  previousSnapshot?: { summary: string; signals: LifeSignal[] } | null
): Promise<LifeSnapshot> {
  const emailDigest = formatEmailsForClaude(emails);
  const calendarDigest = formatCalendarForClaude(events);

  let userMessage = `Today is ${new Date().toDateString()}.

=== EMAILS (${emails.length} signal-worthy, last 30 days) ===

${emailDigest}

=== CALENDAR (${events.length} events, last 7 days through next 30 days) ===

${calendarDigest}`;

  if (previousSnapshot) {
    userMessage += `\n\n=== PREVIOUS SNAPSHOT (for whats_new comparison) ===
Summary: ${previousSnapshot.summary}
Signals: ${previousSnapshot.signals
      .map((s) => `${s.title} (${s.category}/${s.urgency})`)
      .join("; ")}`;
  }

  userMessage += `\n\nReason across BOTH sources. Spot tensions, patterns, missing pieces. Return the life snapshot JSON now.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  const raw = textBlock.text.trim().replace(/^```json\s*|\s*```$/g, "");

  try {
    const parsed = JSON.parse(raw);
    if (!parsed.summary || !Array.isArray(parsed.signals)) {
      throw new Error("Invalid JSON shape");
    }
    return parsed as LifeSnapshot;
  } catch (err) {
    console.error("Failed to parse Claude response:", raw);
    throw new Error("Claude returned invalid JSON");
  }
}