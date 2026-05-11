import Anthropic from "@anthropic-ai/sdk";
import type { LifeSignal } from "./claude";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export type DailyBriefContent = {
  subject: string;
  preview: string;
  headline: string;
  body_paragraph: string;
  top_signals: LifeSignal[];
  closing_question: string;
};

const BRIEF_PROMPT = `You are Arsa, an AI nervous system writing a person's morning brief. They will read this in 60 seconds over coffee.

You are NOT a chatbot. No greetings. No "Good morning". No filler.

Write like a sharp, observant friend texting them the one or two things they need to know to start the day right.

You will be given the user's latest life snapshot (summary + signals + what is new). Your job is to compress it into a daily brief.

Return ONLY valid JSON, no markdown:

{
  "subject": "string. Max 60 chars. Should make them open the email. NOT generic like 'Your daily brief'. Make it specific to TODAY. Examples: 'Sarah is still waiting on you', 'Three deadlines this week, none scheduled', 'A quiet day, except for the Eskom bill'",
  "preview": "string. Max 90 chars. The email preview text below the subject. One sharp sentence summarizing the day.",
  "headline": "string. The big opening line of the brief. 1 sentence. The most important thing they should know today.",
  "body_paragraph": "string. 2-3 sentences. The texture of their day. What is on their plate, what is tense, what they might be missing. Conversational but precise.",
  "top_signals": [
    { "category": "Work", "title": "string", "description": "string", "urgency": "high", "people": ["Sarah"] }
  ],
  "closing_question": "string. ONE question Arsa wants to ask them. Provokes thought. Examples: 'Have you actually blocked time for the proposal?', 'When was the last time you replied to Mom?', 'What is the one thing that would make today feel productive?'"
}

Pick only 3 to 5 top_signals (the most urgent or interesting ones). Skip noise.`;

export async function writeDailyBrief(snapshot: {
  summary: string;
  signals: LifeSignal[];
  whats_new?: string | null;
}): Promise<DailyBriefContent> {
  const signalsText = snapshot.signals
    .map(
      (s, i) =>
        `${i + 1}. [${s.category}/${s.urgency}] ${s.title}: ${s.description}${s.people ? ` (people: ${s.people.join(", ")})` : ""}`
    )
    .join("\n");

  const userMessage = `Today is ${new Date().toDateString()}.

CURRENT LIFE SNAPSHOT:
Summary: ${snapshot.summary}

Signals:
${signalsText}

${snapshot.whats_new ? `What changed since yesterday: ${snapshot.whats_new}` : ""}

Write the daily brief JSON now.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    system: [
      {
        type: "text",
        text: BRIEF_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude for daily brief");
  }

  const raw = textBlock.text.trim().replace(/^```json\s*|\s*```$/g, "");
  const parsed = JSON.parse(raw);

  if (!parsed.subject || !parsed.headline) {
    throw new Error("Invalid daily brief JSON shape");
  }

  return parsed as DailyBriefContent;
}