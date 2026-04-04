import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

export async function POST(request: Request) {
  const { topic, style } = await request.json();

  if (!topic) {
    return new Response(JSON.stringify({ error: "Topic is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stylePrompt = style
    ? `Style: ${style} (e.g., dad joke, dark humor, one-liner, pun)`
    : "Mix of styles: some dad jokes, some one-liners, some dark humor, some puns";

  const result = streamText({
    model: anthropic("claude-haiku-4.5"),
    maxOutputTokens: 1024,
    system: `You are a comedy writer. Generate exactly 5 jokes about the given topic.
Each joke should be on its own line, numbered 1-5.
Keep jokes concise (1-3 sentences each).
Make them genuinely funny — not generic or obvious.
If the topic involves a setup/punchline format, use it.
Do NOT add any preamble, explanation, or commentary. Just the 5 numbered jokes.`,
    prompt: `Topic: ${topic}\n${stylePrompt}`,
  });

  return result.toTextStreamResponse();
}
