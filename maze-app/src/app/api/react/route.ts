import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const { session_id, content_id, action } = await request.json();

  if (!session_id || !content_id || !action) {
    return NextResponse.json(
      { error: "Missing session_id, content_id, or action" },
      { status: 400 },
    );
  }

  if (!["like", "dislike", "share", "view"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Demo mode: no-op when Supabase isn't connected
  if (!supabase) {
    return NextResponse.json({ success: true, demo: true });
  }

  // Ensure session exists (insert if new, update if exists)
  const { data: existingSession } = await supabase
    .from("sessions")
    .select("id")
    .eq("id", session_id)
    .single();

  if (existingSession) {
    await supabase
      .from("sessions")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", session_id);
  } else {
    await supabase.from("sessions").insert({
      id: session_id,
      last_seen_at: new Date().toISOString(),
    });
  }

  // For like/dislike, remove opposite reaction first
  if (action === "like" || action === "dislike") {
    const opposite = action === "like" ? "dislike" : "like";
    await supabase
      .from("interactions")
      .delete()
      .eq("session_id", session_id)
      .eq("content_id", content_id)
      .eq("action", opposite);
  }

  // Insert interaction (catch duplicate for like/dislike)
  const { error } = await supabase.from("interactions").insert({
    session_id,
    content_id,
    action,
  });

  if (error && error.code !== "23505") {
    // 23505 = unique constraint violation (duplicate reaction) — ignore
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update content score
  if (action === "like") {
    await supabase.rpc("increment_content_score", {
      cid: content_id,
      col: "like_count",
    });
  } else if (action === "dislike") {
    await supabase.rpc("increment_content_score", {
      cid: content_id,
      col: "dislike_count",
    });
  } else if (action === "share") {
    await supabase.rpc("increment_content_score", {
      cid: content_id,
      col: "share_count",
    });
  }

  // Update session preferences for personalization
  if (action === "like" || action === "dislike") {
    const { data: content } = await supabase
      .from("content")
      .select("category")
      .eq("id", content_id)
      .single();

    if (content) {
      const { data: session } = await supabase
        .from("sessions")
        .select("preferences")
        .eq("id", session_id)
        .single();

      const prefs = session?.preferences || {};
      const key =
        action === "like" ? "liked_categories" : "disliked_categories";
      const cats = prefs[key] || {};
      cats[content.category] = (cats[content.category] || 0) + 1;
      prefs[key] = cats;

      await supabase
        .from("sessions")
        .update({ preferences: prefs })
        .eq("id", session_id);
    }
  }

  return NextResponse.json({ success: true });
}
