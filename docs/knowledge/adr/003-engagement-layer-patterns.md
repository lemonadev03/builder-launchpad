---
date: 2026-03-29
ticket: Phase 7 (7.1-7.4)
affected: [comments, reactions, bookmarks, post page]
---

# Engagement Layer Architecture Patterns

## Context
Phase 7 introduced comments, reactions, and bookmarks — the first interactive features requiring client-side mutations on server-rendered pages.

## Decision
Server-side enrichment pipeline + client components with `router.refresh()`:

1. **Server page** fetches base data (comments, posts) then enriches with batch queries (reaction counts, user reactions, author roles) via `Promise.all`
2. **Serialization boundary**: Dates converted to ISO strings before passing to client components
3. **Client mutations** call API routes directly, then `router.refresh()` to re-fetch server data — no client-side cache to sync
4. **Optimistic UI** via React 19 `useOptimistic` for reactions/bookmarks (instant feedback, auto-corrects on navigation)

## Alternatives Considered
- **Client-side data fetching (SWR/TanStack Query)**: More complex, requires hydration, duplicates server queries. Rejected — `router.refresh()` is simpler and SSR-native.
- **Server Actions**: Could replace API routes for mutations. Deferred — API routes are already established and work for both server and client consumers.

## Consequences
- New interactive features should follow this pattern: server fetches + enriches, client mutates + refreshes
- Batch query helpers (`getReactionCountsBatch`, `getCommentCountsBatch`, `getAuthorRolesBatch`) exist and should be reused for any listing page that needs engagement metrics
- Polymorphic reaction table (`target_type + target_id`) extends to new target types by adding enum values
