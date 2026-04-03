import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const cursor = searchParams.get("cursor");
  const sessionId = searchParams.get("session_id");
  const limit = 20;

  const supabase = createServiceClient();

  // Build query
  let query = supabase
    .from("content")
    .select("*")
    .eq("is_active", true)
    .order("score", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit + 1); // fetch one extra to check hasMore

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  // If session exists, exclude already-seen content
  if (sessionId) {
    const { data: viewedIds } = await supabase
      .from("interactions")
      .select("content_id")
      .eq("session_id", sessionId)
      .eq("action", "view")
      .order("created_at", { ascending: false })
      .limit(200);

    if (viewedIds && viewedIds.length > 0) {
      const ids = viewedIds.map((v) => v.content_id);
      query = query.not("id", "in", `(${ids.join(",")})`);
    }
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = data || [];
  const hasMore = items.length > limit;
  const returnItems = hasMore ? items.slice(0, limit) : items;
  const nextCursor =
    hasMore && returnItems.length > 0
      ? returnItems[returnItems.length - 1].created_at
      : null;

  return NextResponse.json({
    items: returnItems,
    nextCursor,
    hasMore,
  });
}
