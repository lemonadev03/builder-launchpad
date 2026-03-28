---
date: 2026-03-28
ticket: 5.3
affected: [membership, membership-inheritance, invite, join-request, members-api]
---

# Membership inheritance integrated at all join points

## Context
Upward auto-join (child join → parent join) and downward cascade (parent leave → descendant removal) needed to be wired into every code path that creates or removes memberships.

## Decision
Created `membership-inheritance.ts` with `joinAncestors` and `cascadeLeaveDescendants`. Called these from every join/leave touchpoint:
- `redeemInvite` (invite.ts)
- `approveJoinRequest` (join-request.ts)
- `POST /api/communities/[slug]/members` (open join)
- `leaveCommunity` (membership.ts)
- `removeMember` (membership.ts)

## Alternatives Considered
- **Database trigger:** Would be more reliable but harder to debug and maintain. Drizzle ORM doesn't have built-in trigger support.
- **Event system:** Publish join/leave events and handle inheritance in subscribers. Overengineered for current scale.

## Consequences
- Every new join path MUST call `joinAncestors`. If a new join method is added without this call, inheritance breaks silently.
- Cascade leave uses a batch delete (single query for all descendants) for performance.
- Archived communities are filtered out of cascade operations.
- Max 4 iterations on ancestor walk prevents runaway in case of circular references.
