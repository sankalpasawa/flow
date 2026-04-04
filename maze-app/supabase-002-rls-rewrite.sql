-- Migration 002: RLS Policy Rewrite
-- Date: 2026-04-04
-- Reason: Original policies were fully open (using(true) on all tables).
--         Anyone with anon key could INSERT/UPDATE/DELETE on any table.
-- Applied via: Supabase MCP SQL execution (ad-hoc), now captured as migration file.

-- Drop old permissive policies
DROP POLICY IF EXISTS "Allow all on content" ON content;
DROP POLICY IF EXISTS "Content is publicly readable" ON content;
DROP POLICY IF EXISTS "Service role manages content" ON content;
DROP POLICY IF EXISTS "Sessions are public" ON sessions;
DROP POLICY IF EXISTS "Interactions are public" ON interactions;
DROP POLICY IF EXISTS "Ingestion log is public" ON ingestion_log;

-- CONTENT: public read, service-role-only write
CREATE POLICY "content_select" ON content FOR SELECT USING (true);
CREATE POLICY "content_insert" ON content FOR INSERT WITH CHECK (
  (current_setting('role') = 'service_role')
);
CREATE POLICY "content_update" ON content FOR UPDATE USING (
  (current_setting('role') = 'service_role')
);
CREATE POLICY "content_delete" ON content FOR DELETE USING (
  (current_setting('role') = 'service_role')
);

-- SESSIONS: anyone can create, read/update (anonymous users need this)
CREATE POLICY "sessions_select" ON sessions FOR SELECT USING (true);
CREATE POLICY "sessions_insert" ON sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "sessions_update" ON sessions FOR UPDATE USING (true);

-- INTERACTIONS: anyone can insert/read/delete (reactions)
CREATE POLICY "interactions_select" ON interactions FOR SELECT USING (true);
CREATE POLICY "interactions_insert" ON interactions FOR INSERT WITH CHECK (true);
CREATE POLICY "interactions_delete" ON interactions FOR DELETE USING (true);

-- INGESTION_LOG: service role only
CREATE POLICY "ingestion_log_select" ON ingestion_log FOR SELECT USING (
  (current_setting('role') = 'service_role')
);
CREATE POLICY "ingestion_log_insert" ON ingestion_log FOR INSERT WITH CHECK (
  (current_setting('role') = 'service_role')
);
