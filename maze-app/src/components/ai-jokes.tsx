"use client";

import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STYLE_OPTIONS = [
  { value: "", label: "Mix it up" },
  { value: "dad joke", label: "Dad Jokes" },
  { value: "dark humor", label: "Dark" },
  { value: "one-liner", label: "One Liners" },
  { value: "pun", label: "Puns" },
  { value: "programming", label: "Programming" },
];

export function AIJokes() {
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState("");
  const [jokes, setJokes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  async function generateJokes() {
    if (!topic.trim()) return;

    setLoading(true);
    setJokes("");
    setError("");

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), style }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to generate jokes");
        setLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setError("Streaming not supported");
        setLoading(false);
        return;
      }

      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setJokes(text);
      }
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        // User cancelled
      } else {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto mt-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-bold">AI Joke Generator</h2>
        <Badge
          variant="outline"
          className="bg-violet-500/20 text-violet-300 border-violet-500/30"
        >
          AI
        </Badge>
      </div>

      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-5">
          {/* Topic input */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Enter a topic... (e.g., doctors, coffee, marriage)"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) generateJokes();
              }}
              className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Style chips */}
          <div className="flex gap-2 flex-wrap mb-4">
            {STYLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStyle(opt.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  style === opt.value
                    ? "bg-violet-500/30 text-violet-200 border border-violet-500/50"
                    : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 border border-transparent"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Generate button */}
          <Button
            onClick={generateJokes}
            disabled={loading || !topic.trim()}
            className="w-full"
          >
            {loading ? "Generating..." : "Generate 5 Jokes ✨"}
          </Button>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Generated jokes */}
          {jokes && (
            <div className="mt-4 p-4 rounded-lg bg-background/50 border border-border/30">
              <pre className="whitespace-pre-wrap text-sm text-foreground/90 font-sans leading-relaxed">
                {jokes}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
