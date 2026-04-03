import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { DEMO_JOKES } from "@/lib/demo-data";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const limit = 20;

  const supabase = createServiceClient();

  // Demo mode: return demo jokes when Supabase isn't connected
  if (!supabase) {
    let items = DEMO_JOKES;
    if (category && category !== "all") {
      items = items.filter((j) => j.category === category);
    }
    return NextResponse.json({
      items,
      nextCursor: null,
      hasMore: false,
    });
  }

  const cursor = searchParams.get("cursor");
  const sessionId = searchParams.get("session_id");

  // Build query
  let query = supabase
    .from("content")
    .select("*")
    .eq("is_active", true)
    .order("score", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit + 1);

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
