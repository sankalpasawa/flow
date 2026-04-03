# DayFlow — Security, Infrastructure & Database Best Practices

Last updated: 2026-04-02

---

## 1. Security

### 1.1 Authentication

**Current state (development):**
- Auth is bypassed entirely in dev mode. `authStore.ts` checks `EXPO_PUBLIC_DEV_MODE=true` or a `placeholder` URL and auto-logs in as `dev-user-001` (Sankalp) or `demo-user-001`.
- Demo account (`demo@dayflow.app` / `demo1234`) is hardcoded — no Supabase auth involved.
- The edge function (`command/index.ts`) accepts `user_id` as a raw POST body parameter. It trusts whatever the client sends. There is zero server-side auth verification.

**What must change for production:**
1. **Remove dev bypass entirely.** The `IS_DEV` constant and all `localStorage`-based sign-out tracking must be stripped or gated behind `__DEV__` (React Native's built-in flag) which is `false` in production builds.
2. **Edge function must validate JWT.** Currently the edge function creates a Supabase client with `SUPABASE_SERVICE_ROLE_KEY` but never verifies the caller's identity. It must:
   - Extract the `Authorization: Bearer <jwt>` header from the request.
   - Verify the JWT using `supabase.auth.getUser(token)`.
   - Use the authenticated user's ID instead of trusting `user_id` from the request body.
   - Reject requests with no valid session (401).
3. **Remove hardcoded demo credentials.** Use Supabase auth for demo accounts or a proper test-account flow.
4. **Enforce email verification.** Enable Supabase Auth email confirmation before allowing access.
5. **Add password strength requirements.** Supabase defaults to 6 characters minimum; consider 8+ with complexity rules.
6. **Implement session refresh.** `autoRefreshToken: true` is already set in `supabase.ts` — verify it works on native (AsyncStorage) with long background periods.
7. **Add biometric unlock.** Use `expo-local-authentication` for Face ID / Touch ID on app resume.

### 1.2 Row Level Security (RLS)

**Current state:** RLS is enabled on all Supabase tables. Policies use `auth.uid() = user_id` pattern.

| Table | RLS Enabled | Policy | Gap |
|-------|-------------|--------|-----|
| `users` | Yes | `auth.uid() = id` for ALL | Good. |
| `categories` | Yes | Read: system OR own. Write/Update/Delete: own only. | Good. System categories (NULL `user_id`) are readable by all — intentional. |
| `activities` | Yes | `auth.uid() = user_id` for ALL | Good. |
| `experience_logs` | Yes | `auth.uid() = user_id` for ALL | Good. |
| `ai_usage` | Yes | `auth.uid() = user_id` for ALL | **Gap:** The edge function uses `SERVICE_ROLE_KEY` which bypasses RLS. This is intentional for upsert, but means a compromised edge function can access any user's data. |
| `goals` | **Not in migration** | N/A | **Gap:** `goals` table exists in local SQLite schema but has no Supabase migration. When added, RLS must be enabled. |

**Recommendations:**
- Add a Supabase migration for the `goals` table with RLS.
- Add a `sync_queue` equivalent in Supabase if needed, or keep it client-only.
- Audit RLS policies quarterly. Use Supabase's `pg_policies` view to verify.
- Consider `SECURITY DEFINER` functions for edge-function writes instead of `SERVICE_ROLE_KEY` to limit blast radius.

### 1.3 API Key Management

**Currently exposed (client-side, in `.env` and JS bundle):**
| Key | Location | Risk |
|-----|----------|------|
| `EXPO_PUBLIC_SUPABASE_URL` | `.env`, JS bundle | Low — public by design. |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `.env`, JS bundle | Low — anon key is designed to be public. RLS protects data. |
| `EXPO_PUBLIC_DEV_MODE` | `.env`, JS bundle | **Medium** — if `true` in production, auth is bypassed. Must be `false` or removed. |
| `EXPO_PUBLIC_AI_ENABLED` | `.env`, JS bundle | Low — feature flag only. |

**Server-side (edge function environment, NOT in bundle):**
| Key | Location | Risk if leaked |
|-----|----------|----------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase edge function env | **Critical** — full database access, bypasses RLS. |
| `GEMINI_API_KEY` | Supabase edge function env | **High** — billing exposure, API abuse. |
| `ANTHROPIC_API_KEY` | Supabase edge function env | **High** — billing exposure, API abuse. |
| `SUPABASE_URL` | Supabase edge function env | Low — same as public URL. |

**Recommendations:**
1. **Never prefix secrets with `EXPO_PUBLIC_`.** Expo inlines any `EXPO_PUBLIC_*` variable into the JS bundle. This is correct for the anon key but must never be done for service role keys or LLM API keys.
2. **Add `.env` to `.gitignore`.** Verify it is not committed to the repository. The current `.env` contains a real Supabase anon key.
3. **Use `expo-secure-store` for tokens.** Supabase auth tokens are currently stored via `AsyncStorage` on native. `AsyncStorage` is unencrypted. Migrate to `expo-secure-store` which uses iOS Keychain / Android Keystore.
4. **Rotate the anon key** if it has ever been committed to git history (it is currently in `.env` which may be tracked).
5. **Use Supabase Vault** (available on Pro plan) for storing third-party API keys instead of raw environment variables.

### 1.4 Input Sanitization

**Current state:** `ai.ts` has a `sanitizeInput()` function:
```typescript
function sanitizeInput(text: string): string {
  return text.replace(/[\x00-\x1F\x7F]/g, '').slice(0, 200).trim();
}
```

**Assessment: Insufficient for production.**

| Concern | Status | Recommendation |
|---------|--------|----------------|
| Control character stripping | Done | Good. |
| Length limit (200 chars) | Done | Adequate for titles; the `command` edge function receives full `context` strings that are NOT sanitized and can be arbitrarily large. |
| SQL injection | N/A (parameterized queries via Supabase client) | Supabase SDK uses parameterized queries. Low risk. But the custom `db.web.ts` SQL parser must be audited for injection if it ever accepts user input directly. |
| XSS via HTML | **Gap** | The `play` mode returns raw HTML from the LLM and renders it in a WebView. An attacker who manipulates the LLM prompt could inject malicious HTML. Strip `<script>`, `<iframe>`, `on*` event handlers. Use a sanitization library like DOMPurify. |
| Prompt injection | **Gap** | The `context` field sent to the edge function is user-controlled data mixed with the system prompt. An adversarial user could craft input to override system instructions. Mitigation: use structured prompt formatting, input/output guardrails, and content filtering. |
| Unicode normalization | **Gap** | Homoglyph attacks and zero-width characters are not stripped. Add Unicode NFC normalization. |
| `context` parameter size | **Gap** | The `context` string sent to the edge function is unbounded. Add a server-side size limit (e.g., 10,000 chars). |

**Recommendations:**
1. Add server-side input validation in the edge function (do not rely solely on client-side sanitization).
2. Sanitize LLM HTML output before rendering: strip `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, `on*` attributes.
3. Add a max request body size check in the edge function.
4. Consider a content safety filter on LLM outputs (Gemini has built-in safety settings; enable them).

### 1.5 Rate Limiting

**Current state:**
- 20 AI calls per user per day, tracked in `ai_usage` table.
- No rate limiting on authentication attempts.
- No rate limiting on general API calls (Supabase has built-in rate limits on the free tier but they are project-wide, not per-user).

**Production strategy:**
| Layer | Mechanism | Target |
|-------|-----------|--------|
| Auth attempts | Supabase built-in (configurable in Auth settings) | 5 attempts per minute per IP |
| AI calls | Current `ai_usage` table | FREE: 10/day, PRO: 50/day (adjust based on cost) |
| Edge function invocations | Supabase edge function rate limits (Deno Deploy) | 100 requests/minute per user |
| API calls | Supabase project rate limits | Monitor via dashboard; upgrade plan if needed |
| Abuse detection | Log and alert on anomalies | Flag users with >3x average usage |

**Recommendations:**
1. Differentiate limits by subscription tier (`FREE` vs `PRO`).
2. Add exponential backoff on the client side for 429 responses.
3. Implement a sliding window rate limiter (not just daily count) to prevent burst abuse.
4. Add rate limiting to auth endpoints (Supabase Auth config > Rate Limits).

### 1.6 OWASP Mobile Top 10 Checklist

| # | Risk | DayFlow Status | Action Required |
|---|------|----------------|-----------------|
| M1 | Improper Credential Usage | **At risk.** Anon key in bundle (acceptable). Service role key server-side only (good). But auth tokens in unencrypted AsyncStorage. | Migrate to `expo-secure-store`. |
| M2 | Inadequate Supply Chain Security | **Unknown.** No dependency audit configured. | Add `npm audit` to CI. Pin dependency versions. Use `expo-doctor` to check compatibility. |
| M3 | Insecure Authentication/Authorization | **At risk.** Dev bypass exists. Edge function trusts client-supplied `user_id`. | Remove dev bypass from production builds. Validate JWT server-side. |
| M4 | Insufficient Input/Output Validation | **At risk.** Client sanitizes input (200 chars) but server does not validate. LLM HTML output is rendered unsanitized. | Add server-side validation. Sanitize HTML output. |
| M5 | Insecure Communication | **Acceptable.** All Supabase communication is HTTPS. No certificate pinning. | Add certificate pinning for production. |
| M6 | Inadequate Privacy Controls | **Gap.** No data export feature. No deletion mechanism. No consent tracking. | Implement GDPR features (Section 4). |
| M7 | Insufficient Binary Protections | **Default.** Expo/React Native bundles are JavaScript (easily decompiled). | Use Hermes engine (compiled bytecode). Enable ProGuard for Android. Consider code obfuscation for sensitive logic. |
| M8 | Security Misconfiguration | **At risk.** `EXPO_PUBLIC_DEV_MODE=true` could ship in production. CORS is `*` in edge function. | Remove dev flags. Restrict CORS to app origin. |
| M9 | Insecure Data Storage | **At risk.** SQLite database is unencrypted on device. Auth tokens in AsyncStorage (unencrypted). | Use SQLCipher for SQLite encryption. Migrate tokens to secure storage. |
| M10 | Insufficient Cryptography | **N/A currently.** App does not implement custom crypto. Supabase handles auth token signing. | No immediate action. If adding E2E encryption for sensitive fields, use well-tested libraries. |

### 1.7 Expo-Specific Security

| Concern | Status | Action |
|---------|--------|--------|
| JS bundle contains secrets | `EXPO_PUBLIC_*` vars are inlined. Only anon key and feature flags are exposed. | Audit all `EXPO_PUBLIC_*` vars before each release. |
| Secure storage for tokens | Using `AsyncStorage` (unencrypted). | Replace with `expo-secure-store` for auth tokens. |
| OTA update integrity | Expo EAS Update signs updates. | Enable update signing verification. Pin update server certificate. |
| Deep linking | Not currently implemented. | When added, validate all deep link parameters. Prevent open redirect attacks. |
| Debug mode in production | `__DEV__` is `false` in production builds. But `EXPO_PUBLIC_DEV_MODE` is a custom flag that could leak. | Use `__DEV__` only. Remove `EXPO_PUBLIC_DEV_MODE` from production `.env`. |
| Expo Go vs production build | Expo Go has broader permissions. | Production builds via EAS Build with minimal permissions. |
| Hermes bytecode | Not confirmed if enabled. | Enable Hermes in `app.json` for performance + basic code protection. |

### 1.8 Network Security

| Measure | Status | Action |
|---------|--------|--------|
| HTTPS only | Yes (Supabase enforces HTTPS). | Verify no HTTP fallbacks exist in app code. |
| Certificate pinning | Not implemented. | Add via `expo-certificate-pinning` or a custom fetch wrapper for Supabase endpoints. Pins must be rotated before cert expiry. |
| CORS | Edge function returns `Access-Control-Allow-Origin: *`. | Restrict to the app's Supabase URL in production. For mobile apps, CORS is less relevant (no browser) but the edge function is also callable from browsers. |
| Request/response logging | None on client. Edge function logs errors to console. | Do not log sensitive data (tokens, passwords, PII). Implement structured logging. |
| DNS rebinding | Supabase-managed. | No action needed. |
| WebSocket security | Supabase Realtime uses WSS. | If using Realtime subscriptions, verify token refresh works over long connections. |

### 1.9 Data Encryption at Rest

| Layer | Status | Details |
|-------|--------|---------|
| Supabase (PostgreSQL) | **Encrypted.** Supabase encrypts data at rest using AES-256. Managed by the platform. | No action needed. Verify on Supabase dashboard > Project Settings > Database. |
| Local SQLite | **Not encrypted.** Standard SQLite on device. | For sensitive data (reflections, personal activities), consider SQLCipher. Note: adds ~2MB to app size and requires a native module. |
| Supabase backups | **Encrypted.** Supabase encrypts backups at rest. | No action needed. |
| File storage | Not used currently. | When adding file uploads (profile photos, attachments), use Supabase Storage with private buckets + RLS. |

---

## 2. Infrastructure

### 2.1 CI/CD Pipeline

**Recommended GitHub Actions setup:**

```
.github/workflows/
  ci.yml          # Lint, typecheck, test on every PR
  build-ios.yml   # EAS Build for iOS (on tag/release)
  build-android.yml  # EAS Build for Android (future)
  deploy-edge.yml # Deploy Supabase edge functions
  migration.yml   # Run Supabase migrations on staging/prod
```

**CI pipeline (`ci.yml`):**
1. `npm ci` (install dependencies)
2. `npx expo-doctor` (check Expo compatibility)
3. `npx tsc --noEmit` (TypeScript typecheck)
4. `npx eslint .` (linting)
5. `npm test` (Jest unit tests)
6. `npm audit --audit-level=high` (dependency security audit)

**Build pipeline (`build-ios.yml`):**
1. Trigger: tag push (`v*`) or manual dispatch.
2. `eas build --platform ios --profile production --non-interactive`.
3. Upload to TestFlight automatically (requires ASC API key in GitHub Secrets).

**Edge function deployment (`deploy-edge.yml`):**
1. Trigger: push to `main` that changes `supabase/functions/**`.
2. `supabase functions deploy command --project-ref <ref>`.
3. Set secrets: `supabase secrets set GEMINI_API_KEY=xxx --project-ref <ref>`.

### 2.2 Error Tracking

**Sentry for React Native (recommended setup):**
1. Install: `npx expo install @sentry/react-native`.
2. Add Sentry plugin to `app.json`:
   ```json
   ["@sentry/react-native/expo", {
     "organization": "dayflow",
     "project": "dayflow-mobile"
   }]
   ```
3. Initialize in `App.tsx`:
   ```typescript
   Sentry.init({
     dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
     tracesSampleRate: 0.2,
     enableAutoSessionTracking: true,
     environment: __DEV__ ? 'development' : 'production',
   });
   ```
4. **Critical:** Add source map uploads to EAS Build so stack traces are readable.
5. Set up alerts for: crash rate > 1%, new unhandled exceptions, edge function 5xx spike.

**Edge function error tracking:**
- Supabase edge function logs are available in the Supabase dashboard (Logs > Edge Functions).
- For production, forward logs to an external service (Sentry, Datadog, or Axiom) via a log drain.
- Add structured error logging: `console.error(JSON.stringify({ function: 'command', error: err.message, user_id, timestamp: new Date().toISOString() }))`.

### 2.3 Monitoring

| What | Tool | Setup |
|------|------|-------|
| Supabase database health | Supabase Dashboard > Reports | Monitor active connections, query performance, disk usage. |
| Edge function performance | Supabase Dashboard > Logs > Edge Functions | Track invocation count, latency p50/p95/p99, error rate. |
| API response times | Supabase Dashboard > API | Monitor REST and Auth endpoints. |
| App crash rate | Sentry | Target: <0.5% crash-free session rate. |
| JS thread performance | React Native Performance Monitor | Track JS frame drops, bridge traffic. |
| User engagement | PostHog or Mixpanel (add later) | Track: DAU, session length, AI command usage, feature adoption. |
| Uptime | Supabase status page + external ping (UptimeRobot) | Alert if Supabase project is unreachable. |

### 2.4 Performance Monitoring

**React Native specific:**
- Enable Hermes for faster JS execution and lower memory.
- Use `react-native-performance` to track screen load times.
- Monitor JS thread frame rate; target 60fps (16ms frame budget).
- Profile with Flipper (development) or React DevTools.
- Avoid: large re-renders in FlatList/ScrollView, synchronous SQLite calls on JS thread, unoptimized images.

**Supabase specific:**
- Use `pg_stat_statements` to identify slow queries.
- Monitor connection pool utilization (Supabase uses PgBouncer).
- Set up query alerts for queries exceeding 500ms.

### 2.5 App Distribution

| Phase | Channel | Tool |
|-------|---------|------|
| Development | Expo Go on device | `npx expo start` with QR code |
| Internal testing | TestFlight (iOS) | EAS Build > submit to TestFlight |
| Beta testing | TestFlight external group | Add up to 10,000 external testers |
| Production | App Store | EAS Submit > App Store Connect |
| Android (future) | Google Play internal track | EAS Build for Android |

**EAS Build profiles (`eas.json`):**
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": { "simulator": false }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_DEV_MODE": "false",
        "EXPO_PUBLIC_AI_ENABLED": "true"
      }
    }
  }
}
```

### 2.6 OTA Updates

**Expo EAS Update:**
- Push JS bundle updates without going through App Store review.
- Use for: bug fixes, content changes, minor UI tweaks.
- Do NOT use for: native module changes, permission changes, new Expo SDK versions.
- Configure update channels: `production`, `staging`, `preview`.
- Set `runtimeVersion` policy in `app.json` to prevent mismatched native/JS versions:
  ```json
  "runtimeVersion": { "policy": "appVersion" }
  ```
- Roll out updates gradually: 10% > 50% > 100%.
- Always test updates on a preview channel before pushing to production.

### 2.7 Environment Management

| Environment | Supabase Project | Edge Functions | App Build | Purpose |
|-------------|-----------------|----------------|-----------|---------|
| `development` | Local (supabase start) or dev project | Local (supabase functions serve) | Expo Go | Day-to-day dev |
| `staging` | Separate Supabase project | Deployed to staging project | EAS Build (preview) | Pre-release testing |
| `production` | Production Supabase project | Deployed to production project | EAS Build (production) | Live users |

**Environment files:**
```
mobile/.env.development   # Local dev (EXPO_PUBLIC_DEV_MODE=true)
mobile/.env.staging       # Staging Supabase project URL + anon key
mobile/.env.production    # Production Supabase project URL + anon key
```

Use `eas.json` env overrides or `app.config.ts` to select the right `.env` per build profile.

### 2.8 Secrets Management

| Secret | Where to Store | Never Store In |
|--------|---------------|----------------|
| Supabase anon key | `.env` / `eas.json` env (OK — public by design) | — |
| Supabase service role key | Supabase edge function env only | `.env`, JS bundle, git |
| Gemini API key | Supabase edge function env (`supabase secrets set`) | `.env`, JS bundle, git |
| Anthropic API key | Supabase edge function env | `.env`, JS bundle, git |
| Sentry DSN | `.env` as `EXPO_PUBLIC_SENTRY_DSN` (OK — public by design) | — |
| Apple ASC API key | GitHub Secrets (for CI) | git, `.env` |
| EAS token | GitHub Secrets (`EXPO_TOKEN`) | git, `.env` |
| Signing certificates | EAS managed or GitHub Secrets | git |

**Key rotation schedule:**
- Supabase keys: rotate if compromised (Supabase Dashboard > Settings > API).
- LLM API keys: rotate every 90 days or on team member departure.
- Apple certificates: managed by EAS Build (auto-renewal).

---

## 3. Database

### 3.1 Current Schema

**Supabase (PostgreSQL) tables** (from `001_initial_schema.sql`):

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `users` | User profiles, extends `auth.users` | `id` (UUID, FK to auth.users), `email`, `subscription_tier`, `settings` (JSONB) |
| `categories` | Activity categories (system + user-created) | `id`, `user_id` (NULL = system), `name`, `color`, `icon`, `is_system` |
| `activities` | Time blocks and tasks | `id`, `user_id`, `title`, `start_time`, `duration_minutes`, `category_id`, `recurrence_type`, `status`, `priority` |
| `experience_logs` | Post-activity reflections | `id`, `activity_id`, `user_id`, `mood`, `energy`, `completion_pct`, `reflection` |
| `ai_usage` | Daily AI call tracking | `user_id`, `date`, `call_count`, `queued_calls` |

**Local SQLite tables** (from `schema.ts`):

Same tables as above plus:
| Table | Purpose | Notes |
|-------|---------|-------|
| `goals` | Long-term goals with progress tracking | **Missing from Supabase migration.** |
| `sync_queue` | Pending operations to sync to Supabase | Client-only table for offline-first architecture. |

**Schema drift:** The local SQLite schema has diverged from the Supabase schema:
- SQLite `activities` has: `activity_type`, `description`, `assigned_date`, `is_scheduled`, `recurrence_days`, `subtasks`, `deleted`, `synced` — these are missing from the Supabase migration.
- SQLite `experience_logs` has `deleted`, `synced` columns not in Supabase.
- The `goals` table has no Supabase migration at all.

### 3.2 Migration Strategy

**Using Supabase CLI migrations:**
1. Create migrations: `supabase migration new <description>`.
2. Write SQL in `supabase/migrations/<timestamp>_<description>.sql`.
3. Test locally: `supabase db reset` (applies all migrations from scratch).
4. Deploy to staging: `supabase db push --linked` (staging project).
5. Deploy to production: `supabase db push --linked` (production project).

**Rules:**
- Never modify existing migrations. Always create new ones.
- Every migration must be idempotent where possible (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`).
- Test both fresh install (`db reset`) and upgrade path (incremental migration) before deploying.
- Use transactions for multi-statement migrations.
- Always include rollback instructions as SQL comments.

**Immediate migrations needed:**
```sql
-- 002_add_missing_columns.sql
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS activity_type TEXT NOT NULL DEFAULT 'TIME_BLOCK';
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS assigned_date DATE;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS is_scheduled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS recurrence_days TEXT;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS subtasks JSONB;
ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS activities_duration_minutes_check;
ALTER TABLE public.activities ADD CONSTRAINT activities_duration_minutes_check CHECK (duration_minutes >= 0);

-- 003_create_goals.sql
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  metric_type TEXT NOT NULL DEFAULT 'TIME',
  target_value INTEGER NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'DAILY',
  category_id UUID NOT NULL REFERENCES public.categories(id),
  specific_days TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "goals_own" ON public.goals FOR ALL USING (auth.uid() = user_id);
```

### 3.3 Backup Strategy

| Mechanism | Availability | RPO | Notes |
|-----------|-------------|-----|-------|
| Supabase daily backups | Free plan: 7 days retention. Pro plan: 14 days. | 24 hours | Automatic. Restore from Dashboard > Database > Backups. |
| Point-in-time recovery (PITR) | Pro plan only | 2 minutes (WAL-based) | Allows restore to any point in the retention window. |
| Manual pg_dump | Any plan | On demand | Run via `supabase db dump` or direct connection. Store in encrypted S3 bucket. |
| Local SQLite | On-device | N/A | User's local data. Lost if app is uninstalled. Sync to Supabase is the backup. |

**Recommendations:**
1. Upgrade to Supabase Pro for PITR before launching to production.
2. Schedule weekly manual `pg_dump` exports to a separate storage provider (redundancy).
3. Test backup restoration quarterly.
4. Implement sync from SQLite to Supabase so local data is backed up server-side.

### 3.4 Indexing

**Existing indexes:**
- `idx_activities_user_start` on `activities(user_id, start_time)` — good for date-range queries.
- `idx_logs_activity` on `experience_logs(activity_id)` — good for loading logs per activity.
- `idx_logs_user_date` on `experience_logs(user_id, logged_at)` — good for user timeline queries.
- `idx_goals_user` on `goals(user_id, is_active)` — good for active goals list.

**Recommended additional indexes:**
```sql
-- Activities by date (for daily view queries)
CREATE INDEX IF NOT EXISTS idx_activities_user_date
  ON activities(user_id, assigned_date);

-- Activities by status (for filtering incomplete tasks)
CREATE INDEX IF NOT EXISTS idx_activities_user_status
  ON activities(user_id, status) WHERE status != 'COMPLETED';

-- AI usage lookup (unique constraint already creates implicit index)
-- No additional index needed.

-- Categories by user (for category list)
CREATE INDEX IF NOT EXISTS idx_categories_user
  ON categories(user_id, sort_order);
```

**Index monitoring:**
- Use `pg_stat_user_indexes` to check index usage.
- Remove unused indexes (they slow writes).
- Review with `EXPLAIN ANALYZE` on slow queries.

### 3.5 Connection Pooling

**Supabase uses PgBouncer in transaction mode by default.**

| Setting | Default | Recommendation |
|---------|---------|----------------|
| Pool mode | Transaction | Keep transaction mode. Session mode only if using prepared statements. |
| Pool size | Free: 15, Pro: 50 | Monitor active connections. Scale up via Supabase dashboard if needed. |
| Connection string | `postgresql://...` (port 5432 = direct, port 6543 = pooled) | Always use port 6543 (pooled) from edge functions and app. Use port 5432 only for migrations. |
| Idle timeout | 30s | Adequate for mobile app usage patterns. |

**Edge function considerations:**
- Each edge function invocation creates a new Supabase client. This is fine because PgBouncer pools the underlying connections.
- Do NOT create persistent database connections in edge functions (they are stateless workers).

### 3.6 Offline Sync Strategy

**Current architecture:**
- **Local:** SQLite on native (via `expo-sqlite`), custom in-memory DB with localStorage on web.
- **Remote:** Supabase PostgreSQL.
- **Sync mechanism:** `sync_queue` table tracks pending operations, but the actual sync logic is not yet implemented.

**Recommended sync approach:**

1. **Conflict resolution: Last Write Wins (LWW).**
   - Each record has `updated_at` (local) and `synced_at` (server timestamp).
   - On conflict, the record with the latest `updated_at` wins.
   - For activities: LWW is acceptable (single-user app, no collaboration).

2. **Sync flow:**
   ```
   App starts → Pull remote changes since last sync → Apply to local SQLite
   User makes change → Write to local SQLite + enqueue in sync_queue
   Network available → Process sync_queue (POST to Supabase) → Mark as synced
   ```

3. **Soft deletes:** Already implemented (`deleted` column in SQLite). Sync deletes as `deleted=true` rather than hard DELETE, so other devices can process the deletion.

4. **Future consideration: Supabase Realtime.**
   - Subscribe to changes via WebSocket for near-instant sync.
   - Use Supabase Realtime `postgres_changes` channel filtered by `user_id`.
   - This replaces polling but requires active network connection.

5. **PowerSync (alternative):**
   - Supabase has an official integration with PowerSync for offline-first sync.
   - Handles conflict resolution, partial sync, and background sync.
   - Worth evaluating as a drop-in replacement for the custom sync_queue approach.

---

## 4. Compliance

### 4.1 GDPR (EU General Data Protection Regulation)

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Lawful basis for processing | **Not documented.** | Add Terms of Service and Privacy Policy. Basis: consent (user creates account) + legitimate interest (app functionality). |
| Data export (Article 15) | **Not implemented.** | Build a "Download My Data" feature in Settings. Export all user data as JSON/CSV. Supabase SQL: `SELECT * FROM activities WHERE user_id = $1`. |
| Right to deletion (Article 17) | **Not implemented.** | Build a "Delete My Account" feature. Must cascade-delete: `users` (ON DELETE CASCADE handles `activities`, `experience_logs`, `ai_usage`, `goals`). Also clear Supabase Auth user. |
| Consent tracking | **Not implemented.** | Add a `consents` table: `user_id`, `consent_type` (privacy_policy, analytics, ai_processing), `consented_at`, `revoked_at`. |
| Data Processing Agreement | **Not needed yet.** | Supabase provides a DPA. Sign it when processing EU user data. |
| Privacy Policy | **Not created.** | Required before App Store submission. Must cover: what data is collected, how AI processes it, third-party services (Supabase, Gemini/Anthropic), data retention, user rights. |
| Cookie consent | **N/A for mobile app.** | Only needed if adding a web version. |

### 4.2 CCPA (California Consumer Privacy Act)

| Requirement | Implementation |
|-------------|----------------|
| Right to know | Same as GDPR data export. |
| Right to delete | Same as GDPR deletion. |
| Right to opt-out of sale | DayFlow does not sell data. Add a statement to Privacy Policy. |
| Non-discrimination | Do not degrade service for users who exercise privacy rights. |
| Notice at collection | Privacy Policy accessible before sign-up. |

### 4.3 App Store Guidelines (iOS)

| Guideline | Requirement | DayFlow Status |
|-----------|-------------|----------------|
| 1.1 Objectionable content | AI-generated content must be filtered. | Add content safety filters on LLM output. |
| 2.1 Performance | App must be complete, not a beta/demo. | Remove dev mode, demo accounts for production. |
| 2.3 Accurate metadata | Screenshots, description must match app. | Prepare accurate App Store listing. |
| 3.1.1 In-App Purchase | If PRO tier is paid, must use Apple IAP. | Integrate `expo-in-app-purchases` or RevenueCat. |
| 4.0 Design | Must follow HIG, support Dynamic Type, Dark Mode. | Audit against Human Interface Guidelines. |
| 5.1.1 Data Collection | Must have a Privacy Policy URL. | Create and host privacy policy. |
| 5.1.1(v) Account deletion | Must provide account deletion within the app. | Implement delete account feature. |
| 5.1.2 Data Use and Sharing | Disclose all third-party analytics/AI. | App Privacy Nutrition Label must list Gemini/Anthropic. |
| 5.6.1 App Tracking | If tracking, must use ATT framework. | If adding analytics, use `expo-tracking-transparency`. |

### 4.4 Google Play Compliance (Future)

| Requirement | Notes |
|-------------|-------|
| Data Safety section | Equivalent to Apple's nutrition labels. Disclose all data collected. |
| Families Policy | If targeting under-13, additional requirements. DayFlow targets adults. |
| User Data policy | Encryption in transit (HTTPS — done), clear privacy policy. |
| AI-generated content | Disclose that content is AI-generated. |
| Account deletion | Must be available within 30 days of request. |

### 4.5 Data Retention Policy

| Data Type | Retention | Rationale |
|-----------|-----------|-----------|
| Activities | Indefinite (user-owned data) | Core app data. User can delete manually. |
| Experience logs | Indefinite | Needed for insights/analytics features. |
| Goals | Indefinite | Core app data. |
| AI usage logs | 90 days | Only needed for rate limiting and abuse detection. |
| Edge function logs | 7 days (Supabase default) | Increase to 30 days for debugging on Pro plan. |
| Auth sessions | 7 days (Supabase default) | Configurable in Supabase Auth settings. |
| Deleted account data | 30 days (soft delete), then hard purge | Grace period for account recovery. Implement a scheduled function to purge. |
| Sync queue | Until synced, then 7 days | Cleared after successful sync. |

---

## 5. Production Readiness Checklist

### P0 — Blockers (must fix before any user sees the app)

- [ ] 1. **Remove dev mode bypass from production builds.** Strip `EXPO_PUBLIC_DEV_MODE` from production `.env`. Ensure `IS_DEV` is `false` in all production code paths.
- [ ] 2. **Edge function: validate JWT and extract user_id server-side.** Do NOT trust client-supplied `user_id`. Use `supabase.auth.getUser(token)` in the edge function.
- [ ] 3. **Restrict CORS in edge function.** Replace `Access-Control-Allow-Origin: *` with the specific Supabase project URL, or remove CORS headers entirely (mobile apps do not need them).
- [ ] 4. **Add Supabase migration for `goals` table** with RLS policy.
- [ ] 5. **Reconcile SQLite schema with Supabase schema.** Add missing columns (`activity_type`, `description`, `assigned_date`, `subtasks`, etc.) to the Supabase migration.
- [ ] 6. **Create and host a Privacy Policy** (required by App Store and GDPR).
- [ ] 7. **Implement account deletion** (required by App Store since June 2022).
- [ ] 8. **Sanitize LLM HTML output** before rendering in WebView (play mode). Strip scripts, iframes, event handlers.
- [ ] 9. **Add server-side input validation** in the edge function (max text length, max context length, type checking).
- [ ] 10. **Migrate auth token storage from AsyncStorage to `expo-secure-store`.**
- [ ] 11. **Configure production Supabase project** (separate from development). Different URL, keys, and edge function deployments.
- [ ] 12. **Set `EXPO_PUBLIC_DEV_MODE=false`** (or remove entirely) in production environment.
- [ ] 13. **Remove hardcoded demo credentials** from production build, or gate behind `__DEV__`.
- [ ] 14. **Verify `.env` is in `.gitignore`** and that no secrets exist in git history. If they do, rotate all keys.
- [ ] 15. **App Store submission requirements:** App icon (1024x1024), screenshots (6.7" and 6.1" iPhones minimum), description, keywords, age rating, support URL.

### P1 — Important (should fix before public launch)

- [ ] 16. **Set up CI/CD pipeline.** GitHub Actions for lint, typecheck, test on every PR.
- [ ] 17. **Integrate Sentry** for crash reporting and error tracking.
- [ ] 18. **Configure EAS Build profiles** (development, preview, production) in `eas.json`.
- [ ] 19. **Implement offline-to-Supabase sync** (process `sync_queue`, handle conflicts).
- [ ] 20. **Add rate limiting differentiation by tier** (FREE: 10 AI calls/day, PRO: 50/day).
- [ ] 21. **Implement data export feature** (Settings > Download My Data).
- [ ] 22. **Add consent tracking** (privacy policy acceptance, AI data processing opt-in).
- [ ] 23. **Configure Supabase Auth rate limits** (prevent brute force on login).
- [ ] 24. **Add email verification** for new sign-ups.
- [ ] 25. **Create App Store Privacy Nutrition Labels** (declare all data types collected and their purposes).
- [ ] 26. **Enable Hermes** JavaScript engine for performance and basic code protection.
- [ ] 27. **Add `npm audit` to CI** pipeline for dependency vulnerability scanning.
- [ ] 28. **Test backup and restore** procedure with Supabase.
- [ ] 29. **Set up uptime monitoring** (external ping to Supabase project URL).
- [ ] 30. **Add proper error boundaries** in React Native to catch and report UI crashes gracefully.
- [ ] 31. **Configure EAS Update** for OTA JS bundle updates with channel management.
- [ ] 32. **Add `runtimeVersion` policy** to `app.json` to prevent native/JS version mismatches.
- [ ] 33. **Implement in-app purchases** if PRO tier is paid (Apple IAP required, RevenueCat recommended).

### P2 — Nice to Have (post-launch improvements)

- [ ] 34. **Certificate pinning** for Supabase API endpoints.
- [ ] 35. **SQLCipher** for local database encryption.
- [ ] 36. **Biometric unlock** (Face ID / Touch ID) using `expo-local-authentication`.
- [ ] 37. **Analytics integration** (PostHog or Mixpanel) for feature usage tracking.
- [ ] 38. **Supabase Realtime** for instant cross-device sync.
- [ ] 39. **Content safety filtering** on LLM outputs (beyond HTML sanitization).
- [ ] 40. **Prompt injection defenses** (structured prompt formatting, input guardrails).
- [ ] 41. **Unicode normalization** on all text inputs (NFC form).
- [ ] 42. **PowerSync evaluation** as a replacement for custom sync_queue.
- [ ] 43. **Scheduled function for data retention** (purge soft-deleted accounts after 30 days).
- [ ] 44. **Pro plan upgrade for Supabase** (PITR, larger connection pool, longer log retention).
- [ ] 45. **ProGuard/R8** configuration for Android builds (future).
- [ ] 46. **Penetration testing** before scaling beyond early adopters.
- [ ] 47. **SOC 2 Type I** readiness assessment (if targeting enterprise users — unlikely for consumer app, but good hygiene).
- [ ] 48. **App Tracking Transparency** framework integration if adding any analytics that track across apps.
- [ ] 49. **Sliding window rate limiter** to replace daily count (prevents burst abuse).
- [ ] 50. **Structured logging** in edge functions with log drain to external service.

---

## Appendix A: Threat Model Summary

| Threat | Likelihood | Impact | Mitigation |
|--------|-----------|--------|------------|
| Attacker calls edge function with forged `user_id` | High (no auth check) | High (access any user's data) | P0 #2: Validate JWT server-side |
| Dev mode ships in production build | Medium | Critical (auth bypass) | P0 #1, #12: Remove dev flags |
| LLM prompt injection via user input | Medium | Medium (data exfiltration, wrong actions) | P2 #40: Prompt guardrails |
| XSS via LLM HTML output in WebView | Medium | Medium (session theft, phishing) | P0 #8: Sanitize HTML |
| Supabase anon key abuse (mass signups) | Low | Low (RLS protects data; rate limits protect cost) | P1 #23: Auth rate limits |
| SQLite data extraction from jailbroken device | Low | Medium (personal data exposed) | P2 #35: SQLCipher encryption |
| Supply chain attack via npm dependency | Low | High | P1 #27: `npm audit` in CI |
| Supabase service role key leak | Very low (server-only) | Critical | Secrets management best practices |

## Appendix B: Key File Paths

| File | Relevance |
|------|-----------|
| `mobile/.env` | Environment variables — anon key, dev flags |
| `mobile/src/lib/supabase.ts` | Supabase client initialization |
| `mobile/src/lib/ai.ts` | AI call layer — sanitization, edge function calls |
| `mobile/src/store/authStore.ts` | Authentication — dev bypass, demo accounts |
| `mobile/src/lib/db/schema.ts` | Local SQLite schema (source of truth for local) |
| `supabase/migrations/001_initial_schema.sql` | Supabase PostgreSQL schema + RLS policies |
| `supabase/functions/command/index.ts` | AI edge function — rate limiting, LLM calls |
| `mobile/app.json` | Expo configuration — bundle ID, plugins, permissions |
