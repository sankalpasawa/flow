"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ContentItem } from "@/lib/types";
import { getSessionId } from "@/lib/session";

const categoryColors: Record<string, string> = {
  dad_jokes: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  dark_humor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  memes: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  one_liners: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  programming: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  general: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
  pun: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  indian: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  misc: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
};

const categoryLabels: Record<string, string> = {
  dad_jokes: "Dad Joke",
  dark_humor: "Dark",
  memes: "Meme",
  one_liners: "One Liner",
  programming: "Programming",
  general: "General",
  pun: "Pun",
  indian: "Indian",
  misc: "Misc",
};

interface JokeCardProps {
  item: ContentItem;
  onReaction?: (contentId: string, action: "like" | "dislike") => void;
}

export function JokeCard({ item, onReaction }: JokeCardProps) {
  const [reaction, setReaction] = useState<"like" | "dislike" | null>(null);
  const [shared, setShared] = useState(false);

  async function handleReaction(action: "like" | "dislike") {
    const newReaction = reaction === action ? null : action;
    const previousReaction = reaction;
    setReaction(newReaction);

    const sessionId = getSessionId();

    if (newReaction) {
      // Toggling ON — send like or dislike
      await fetch("/api/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          content_id: item.id,
          action,
        }),
      });
      onReaction?.(item.id, action);
    } else if (previousReaction) {
      // Toggling OFF — send unreact with the type being removed
      await fetch("/api/react", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-unreact-type": previousReaction,
        },
        body: JSON.stringify({
          session_id: sessionId,
          content_id: item.id,
          action: "unreact",
        }),
      });
    }
  }

  async function handleShare() {
    const shareUrl = `${window.location.origin}/j/${item.id}`;
    const shareText = item.title
      ? `${item.title}\n\n${item.body}`
      : item.body;

    // Track the share
    const sessionId = getSessionId();
    fetch("/api/react", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        content_id: item.id,
        action: "share",
      }),
    });

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Maze — Check this out 😂",
          text: shareText,
          url: shareUrl,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch {
        // User cancelled share
      }
    } else {
      // Fallback: WhatsApp deep link
      const waUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
      window.open(waUrl, "_blank");
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-border">
      <CardContent className="p-5">
        {/* Category badge */}
        <div className="flex items-center justify-between mb-3">
          <Badge
            variant="outline"
            className={`text-xs ${categoryColors[item.category] || categoryColors.misc}`}
          >
            {categoryLabels[item.category] || item.category}
          </Badge>
          {item.source === "ai_generated" && (
            <Badge
              variant="outline"
              className="text-xs bg-violet-500/20 text-violet-300 border-violet-500/30"
            >
              AI
            </Badge>
          )}
        </div>

        {/* Joke content */}
        {item.title && (
          <p className="text-base font-medium text-foreground mb-2">
            {item.title}
          </p>
        )}
        <p className="text-base text-foreground/90 leading-relaxed">
          {item.body}
        </p>

        {/* Image (for memes) */}
        {item.image_url && (
          <div className="mt-3 rounded-lg overflow-hidden">
            <img
              src={item.image_url}
              alt="Meme"
              className="w-full h-auto rounded-lg"
              loading="lazy"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 mt-4 pt-3 border-t border-border/30">
          <button
            onClick={() => handleReaction("like")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
              reaction === "like"
                ? "bg-emerald-500/20 text-emerald-300"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <span>{reaction === "like" ? "😂" : "👍"}</span>
            <span>{item.like_count + (reaction === "like" ? 1 : 0)}</span>
          </button>

          <button
            onClick={() => handleReaction("dislike")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
              reaction === "dislike"
                ? "bg-red-500/20 text-red-300"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <span>👎</span>
            <span>
              {item.dislike_count + (reaction === "dislike" ? 1 : 0)}
            </span>
          </button>

          <div className="flex-1" />

          <button
            onClick={handleShare}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
              shared
                ? "bg-green-500/20 text-green-300"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <span>{shared ? "✓" : "📤"}</span>
            <span>{shared ? "Shared!" : "Share"}</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
