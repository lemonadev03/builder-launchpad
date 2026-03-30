---
date: 2026-03-30
ticket: 15.3
affected: [auth, session, api-auth, platform-user]
---

# Platform user blocking is enforced in auth hooks and session wrappers, not proxy

## Context
Ticket 15.3 adds platform-wide suspension and soft-delete for users. Those states must:
- block new sign-ins
- stop existing sessions from continuing to use protected product surfaces
- show an appeal path to the user

The repo already uses `src/proxy.ts` only for lightweight cookie-based auth redirects, and ADR 005 established that authoritative platform checks should stay out of proxy logic.

## Decision
- Use Better Auth `databaseHooks.session.create.before` to block session creation for suspended or deleted users across sign-in flows.
- Add a Better Auth pre-request hook for email-based auth entrypoints so blocked users get a clear error before a magic link is sent.
- Keep `src/proxy.ts` lightweight.
- Enforce existing-session blocking in `src/lib/session.ts` and `src/lib/api-auth.ts`, redirecting browser requests to `/blocked` and returning a 403 JSON error for APIs.
- Make the appeal contact config-driven through `PLATFORM_APPEAL_EMAIL`.

## Alternatives Considered
- **Check blocked status inside `proxy.ts`:** rejected because it would add database-backed authorization to request proxy handling and duplicate auth-layer logic.
- **Only block in page layouts:** rejected because APIs and auth entrypoints would remain inconsistent.
- **Only block in Better Auth session creation:** rejected because already-issued sessions would continue working until expiry.

## Consequences
- New and existing sessions are both covered without adding DB work to proxy.
- The blocked-user path is consistent across UI and APIs.
- Future platform-wide account controls can extend the same auth/session boundary instead of scattering checks through route code.
