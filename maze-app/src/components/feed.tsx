"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ContentItem, FeedResponse } from "@/lib/types";
import { getSessionId } from "@/lib/session";
import { JokeCard } from "./joke-card";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "dad_jokes", label: "Dad Jokes" },
  { value: "dark_humor", label: "Dark" },
  { value: "programming", label: "Programming" },
  { value: "pun", label: "Puns" },
  { value: "one_liners", label: "One Liners" },
  { value: "general", label: "General" },
];

export function Feed() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [category, setCategory] = useState("all");
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchFeed = useCallback(
    async (reset = false) => {
      const isInitial = reset || items.length === 0;
      if (isInitial) setLoading(true);
      else setLoadingMore(true);

      const sessionId = getSessionId();
      const params = new URLSearchParams({
        category,
        session_id: sessionId,
      });
      if (!reset && cursor) {
        params.set("cursor", cursor);
      }

      try {
        const res = await fetch(`/api/feed?${params}`);
        const data: FeedResponse = await res.json();

        if (reset) {
          setItems(data.items);
        } else {
          setItems((prev) => [...prev, ...data.items]);
        }
        setCursor(data.nextCursor);
        setHasMore(data.hasMore);
      } catch (err) {
        console.error("Feed fetch error:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [category, cursor, items.length],
  );

  // Initial load + category change
  useEffect(() => {
    setCursor(null);
    setHasMore(true);
    fetchFeed(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchFeed(false);
        }
      },
      { rootMargin: "400px" },
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasMore, loading, loadingMore, fetchFeed]);

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Category filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-4 px-1 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              category === cat.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Feed items */}
      <div className="flex flex-col gap-4">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border/50 p-5">
                <Skeleton className="h-4 w-20 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))
          : items.map((item) => <JokeCard key={item.id} item={item} />)}

        {loadingMore &&
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={`loading-${i}`}
              className="rounded-xl border border-border/50 p-5"
            >
              <Skeleton className="h-4 w-20 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}

        {!loading && items.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">No jokes yet!</p>
            <p className="text-sm mt-1">
              Content is being loaded. Check back soon.
            </p>
          </div>
        )}

        {/* Infinite scroll sentinel */}
        {hasMore && <div ref={sentinelRef} className="h-4" />}

        {!hasMore && items.length > 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            You've reached the end. Come back later for more laughs!
          </div>
        )}
      </div>
    </div>
  );
}
