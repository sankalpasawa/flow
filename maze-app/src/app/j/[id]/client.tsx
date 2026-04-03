"use client";

import Link from "next/link";
import { JokeCard } from "@/components/joke-card";
import { ContentItem } from "@/lib/types";
import { Button } from "@/components/ui/button";

export function JokePageClient({ joke }: { joke: ContentItem }) {
  return (
    <main className="flex-1 px-4 py-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Maze</h1>
          <p className="text-sm text-muted-foreground">
            A never-ending humor feed
          </p>
        </div>

        {/* The shared joke */}
        <JokeCard item={joke} />

        {/* CTA to enter the feed */}
        <div className="mt-6 text-center">
          <Link href="/">
            <Button size="lg" className="w-full text-base">
              Keep laughing →
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground mt-2">
            Discover more jokes, memes, and humor
          </p>
        </div>
      </div>
    </main>
  );
}
