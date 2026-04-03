import { ImageResponse } from "next/og";
import { createServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const categoryEmojis: Record<string, string> = {
  dad_jokes: "👨",
  dark_humor: "🌑",
  memes: "😎",
  one_liners: "⚡",
  programming: "💻",
  general: "😂",
  pun: "🤣",
  indian: "🇮🇳",
  misc: "🎭",
};

export default async function OGImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServiceClient();
  const { data: joke } = await supabase
    .from("content")
    .select("*")
    .eq("id", id)
    .single();

  if (!joke) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            background: "#18181b",
            color: "#fafafa",
            fontSize: 48,
            fontWeight: 700,
          }}
        >
          Maze — Never Stop Laughing
        </div>
      ),
      { ...size },
    );
  }

  const emoji = categoryEmojis[joke.category] || "😂";
  const jokeText = joke.title
    ? `${joke.title}\n\n${joke.body}`
    : joke.body;

  // Truncate if too long
  const displayText =
    jokeText.length > 200 ? jokeText.slice(0, 197) + "..." : jokeText;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #18181b 0%, #27272a 100%)",
          padding: "60px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "40px",
          }}
        >
          <span style={{ fontSize: 40 }}>{emoji}</span>
          <span
            style={{
              color: "#a1a1aa",
              fontSize: 24,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            {joke.category.replace("_", " ")}
          </span>
        </div>

        {/* Joke text */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
          }}
        >
          <p
            style={{
              color: "#fafafa",
              fontSize: jokeText.length > 120 ? 32 : 40,
              fontWeight: 600,
              lineHeight: 1.4,
              whiteSpace: "pre-wrap",
            }}
          >
            {displayText}
          </p>
        </div>

        {/* Bottom branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              color: "#fafafa",
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "-0.5px",
            }}
          >
            Maze
          </span>
          <span style={{ color: "#71717a", fontSize: 20 }}>
            Never stop laughing
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
