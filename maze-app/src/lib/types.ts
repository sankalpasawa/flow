export type ContentType =
  | "text_joke"
  | "image_meme"
  | "dad_joke"
  | "dark_joke"
  | "one_liner"
  | "ai_generated";

export type Category =
  | "dad_jokes"
  | "dark_humor"
  | "memes"
  | "one_liners"
  | "indian"
  | "programming"
  | "general"
  | "pun"
  | "misc";

export type ActionType = "like" | "dislike" | "share" | "view";

export interface ContentItem {
  id: string;
  type: ContentType;
  category: Category;
  title: string | null;
  body: string;
  image_url: string | null;
  source: string;
  source_id: string | null;
  score: number;
  like_count: number;
  dislike_count: number;
  share_count: number;
  view_count: number;
  is_active: boolean;
  created_at: string;
}

export interface FeedResponse {
  items: ContentItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface Session {
  id: string;
  preferences: {
    liked_categories?: Record<string, number>;
    disliked_categories?: Record<string, number>;
  };
}
