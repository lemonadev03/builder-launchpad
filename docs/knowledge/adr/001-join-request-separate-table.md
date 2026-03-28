---
date: 2026-03-28
ticket: 4.3
affected: [membership, join-request]
---

# Separate join_request table instead of reusing membership pending status

## Context
The membership table already had a `pending` status enum. The question was whether to use membership rows with `status=pending` for join requests, or create a separate `join_request` table.

## Decision
Separate `join_request` table with its own status (pending/approved/rejected), `resolved_at`, and `resolved_by` fields.

## Alternatives Considered
- **Reuse membership with pending status:** Simpler (one table), but rejected join requests would leave orphaned membership rows. No way to track who resolved the request or when. Re-requesting after rejection would require deleting the old row, losing history.

## Consequences
- Join request history is preserved (including rejections)
- The `pending` status on membership is currently unused — could be removed or repurposed for future flows (e.g., invited but not yet accepted)
- `getPendingRequestCount` in membership.ts is now unused (replaced by `getPendingJoinRequestCount` from join-request.ts)
