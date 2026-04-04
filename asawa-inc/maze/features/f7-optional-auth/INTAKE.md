# INTAKE: F7 Optional Auth

## Problem Statement

Maze currently identifies users via anonymous browser sessions (UUID in localStorage). This means:
- Clear browser data → preferences gone
- Switch device → new session, fresh start
- No way to contact users (no email, no push notifications)
- Retention metrics track browsers, not people
- Personalization is tied to a cookie, not an identity

Optional auth adds the ability to sign in WITHOUT requiring it. The app works fully anonymously. Auth is an upgrade that persists preferences across devices and enables re-engagement.

## Who Requested

CPO (Product) — identified in HOD meeting as next major feature after launch blockers.
CEO — selected as the Sutra stress test feature (touches all 11 departments).

## Why Now

1. Core bet is retention. Can't measure real retention (person returning) without identity.
2. Without auth, every cleared cookie is a "lost user" — metrics are misleading.
3. Auth is prerequisite for: push notifications, saved favorites, cross-device sync, email re-engagement.
4. This is the most architecturally complex feature remaining — tests whether the OS works for real.

## Department Routing Map (Horizontal Feature)

| Department | Role | What They Own |
|------------|------|--------------|
| **Product (CPO)** | Owner | What auth enables, flow design, when to prompt |
| **Design (CDO)** | UI/UX | Login screen, signed-in state, auth prompts |
| **Engineering (CTO)** | Build | Supabase Auth, session migration, API changes |
| **Security (CISO)** | Review | RLS policy updates (user-scoped), token handling |
| **Legal (CLO)** | Compliance | Privacy policy update (now collecting email = PII) |
| **Data (CDaO)** | Measurement | User-level retention (not session-level), cohort analysis |
| **Growth (CGO)** | Distribution | Email re-engagement, push notification path |
| **Quality (CQO)** | Testing | Auth flow QA, edge cases, session migration testing |
| **Content (CCO)** | Impact | Personalization tied to user identity, not session |
| **Ops (COO)** | Infrastructure | Supabase Auth config, magic link email delivery |
| **Finance (CFO)** | Cost | Supabase Auth free tier (50K MAU), email sending costs |

## Success Criteria

1. User can use Maze fully without signing in (anonymous mode works as before)
2. User can sign in via magic link (email, no password)
3. Anonymous session preferences merge into authenticated account
4. Authenticated user's preferences persist across devices/browsers
5. Privacy policy updated to reflect email collection
6. RLS policies updated to scope data by authenticated user where applicable
7. Data team can distinguish "person returned" from "browser returned"
8. No existing functionality breaks (feed, reactions, sharing, AI generation)

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Session migration loses preferences | HIGH | Test migration thoroughly. Keep old session as fallback. |
| Auth flow interrupts the humor experience | MEDIUM | Auth is never required. Prompt is subtle, dismissible. |
| Magic link emails go to spam | MEDIUM | Use Supabase's email templates. Test with Gmail, Outlook. |
| RLS changes break existing anonymous flows | HIGH | Keep anonymous RLS working. Add user-scoped policies alongside. |
| Supabase Auth free tier exceeded | LOW | 50K MAU free. We're at 0. Not a concern for months. |

## Complexity Classification

- **Departments**: 11 (all)
- **Files**: 10+ (new pages, API changes, DB changes, UI components)
- **Approaches**: Multiple (magic link vs password vs OAuth vs passkey)
- **Reversibility**: Low (schema change, RLS rewrite, data migration)
- **Foundational**: Yes (identity model shapes everything downstream)

**Tier: HORIZONTAL** — maximum process depth required.
