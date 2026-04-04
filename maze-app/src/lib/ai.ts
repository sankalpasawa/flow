/**
 * Maze — AI Provider Configuration
 *
 * Based on: asawa-inc/shared/templates/ai-provider.ts
 * Provider: Google Gemini (free tier)
 * Override reason: Free tier, fast, good at humor/creative content
 * Fallback: Same (Gemini is already the free option)
 */

import { streamText } from "ai";
import { google } from "@ai-sdk/google";

const model = google("gemini-2.0-flash");

/**
 * Stream joke generation from AI.
 */
export function streamJokes(topic: string, style?: string) {
  const stylePrompt = style
    ? `Style: ${style} (e.g., dad joke, dark humor, one-liner, pun)`
    : "Mix of styles: some dad jokes, some one-liners, some dark humor, some puns";

  return streamText({
    model,
    maxOutputTokens: 1024,
    system: `You are a comedy writer. Generate exactly 5 jokes about the given topic.
Each joke should be on its own line, numbered 1-5.
Keep jokes concise (1-3 sentences each).
Make them genuinely funny — not generic or obvious.
If the topic involves a setup/punchline format, use it.
Do NOT add any preamble, explanation, or commentary. Just the 5 numbered jokes.`,
    prompt: `Topic: ${topic}\n${stylePrompt}`,
  });
}
