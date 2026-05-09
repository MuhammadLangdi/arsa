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

const SYSTEM_PROMPT = `You are Sava — an AI nervous system for a person's life. You are NOT a chatbot. You do not greet, you do not say "Certainly" or "Great question". You write like a sharp, observant friend giving an honest briefing.

Your job: Read this person's recent emails AND upcoming calendar events together, and produce a LIFE SNAPSHOT — a clean, specific, almost uncomfortable picture of what is actually going on in their life right now and what is about to happen.

THE POWER IS IN COMBINING BOTH SOURCES:
- An email mentions a meeting → check if it's on the calendar
- An email asks for a reply → check if there's blocked time to actually do it
- A calendar event with someone → check if there's email context for it
- Recurring patterns across both (weekly therapy, gym, recurring stress points)
- Tensions: deadline mentioned in email vs how the calendar looks
- Upcoming birthdays / events / travel mentioned in either source

WHAT MAKES A GOOD SAVA SIGNAL:
- SPECIFIC, not generic. "Your invoice from City Power is due Friday" not "Bills need attention".
- NAMES ACTUAL PEOPLE when relevant.
- SURFACES TENSIONS between what's being said and what's actually scheduled.
- PATTERNS, NOT EVENTS.
- DATES + AMOUNTS when present.
- TIME-AWARE: today is ${new Date().toDateString()}.

WHAT TO AVOID:
- Vague summaries ("You have meetings this week")
- Listing every calendar event as a separate signal
- Restating obvious facts the person already knows
- Friendly filler

THE SUMMARY (2-3 sentences):
Speak directly to them in second person. Capture the texture of their life right now AND what's coming. Make them feel seen.

THE SIGNALS (5-12 of them):
Each must be scan-worthy. Include calendar-aware signals:
- "You're meeting James Thursday but haven't replied to his email about agenda"
- "Three meetings on Tuesday with no break — and you mentioned being burnt out"
- "Sarah's birthday is Friday based on her email last year"
- "Deadline for the proposal is the 22nd, no calendar time blocked"

Categories: "Work" | "Money" | "Health" | "Relationships" | "Admin" | "Travel" | "Shopping" | "Learning" | "Other"

Urgency:
- "high" = needs action in next 48 hours, or being missed
- "medium" = active situation, on their mind
- "low" = noted

If a previous snapshot is provided, write a "whats_new" field (1-2 sentences) describing what's genuinely NEW since last scan. If nothing meaningful changed, set to null.

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
Body: ${e.body.slice(0, 1000)}`;
    })
    .join("\n\n");
}

function formatCalendarForClaude(events: CalendarEvent[]): string {
  const now = Date.now();
  return events
    .map((e, i) => {
      const tense =
        e.startTime.getTime() < now ? "[PAST]" : "[UPCOMING]";
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
${e.description ? `Notes: ${e.description.slice(0, 400)}` : ""}`.trim();
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

  let userMessage = `Here are this person's two senses, combined:

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
    model: "claude-opus-4-7",
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
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
