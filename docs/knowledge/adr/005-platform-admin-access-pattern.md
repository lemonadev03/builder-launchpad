---
date: 2026-03-30
ticket: 15.1
affected: [platform-admin, auth, routing]
---

# Platform admin access uses invite allowlist + route-level authorization

## Context
Platform admin access is invite-only, but the ticket required two different flows:
- existing users should be promoted immediately
- invited emails without accounts should gain access automatically after signup

The ticket also called for non-admins to receive a 403 on `/platform`, while the repo already uses `src/proxy.ts` only for coarse auth redirects.

## Decision
- Use a dedicated `platform_admin_invite` table as an allowlist for invited emails.
- When a new user is created, Better Auth's `databaseHooks.user.create.after` checks the allowlist and promotes matching emails to `is_platform_admin=true`, then marks the invite as accepted.
- Gate `/platform` in the route layout with Next.js `forbidden()` and `app/forbidden.tsx`, instead of doing a database-backed role lookup inside `proxy.ts`.

## Alternatives Considered
- **Only update existing users:** rejected because it does not satisfy the invite-first flow for not-yet-registered admins.
- **Embed pending admin emails in config or env:** rejected because it is not auditable and requires deploy-time changes.
- **Check platform-admin status inside `proxy.ts`:** rejected because it would require database I/O in request proxy logic for every `/platform` request, while Next.js 16 guidance favors keeping proxy checks lightweight and using route-level auth for definitive authorization.

## Consequences
- Platform-admin invites are now durable data and can be surfaced in UI.
- Existing-user grants and new-user invites share one mechanism instead of branching logic spread across routes.
- `/platform` authorization is definitive at render time and returns a real 403 UI through Next.js auth interrupts.
