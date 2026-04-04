import { streamJokes } from "@/lib/ai";

export async function POST(request: Request) {
  const { topic, style } = await request.json();

  if (!topic) {
    return new Response(JSON.stringify({ error: "Topic is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const result = streamJokes(topic, style);
  return result.toTextStreamResponse();
}
