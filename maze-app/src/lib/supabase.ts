import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const isConfigured =
  supabaseUrl.length > 0 &&
  !supabaseUrl.includes("placeholder") &&
  supabaseAnonKey.length > 0 &&
  !supabaseAnonKey.includes("placeholder");

// Client-side Supabase client (browser)
export const supabase: SupabaseClient | null = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Server-side Supabase client (with service role for ingestion)
export function createServiceClient(): SupabaseClient | null {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (
    !isConfigured ||
    serviceKey.length === 0 ||
    serviceKey.includes("placeholder")
  ) {
    return null;
  }
  return createClient(supabaseUrl, serviceKey);
}
