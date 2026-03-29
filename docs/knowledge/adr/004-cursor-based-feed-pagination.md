---
date: 2026-03-29
ticket: 9.1
affected: [feed, pagination]
---

# Cursor-Based Pagination for Feed

## Context
The personal feed aggregates posts across all of a user's communities into a chronological stream. Offset-based pagination (used for post listings) has a drift problem in feeds — new posts push items down, causing duplicates or skips when paginating.

## Decision
Compound cursor `(publishedAt, id)` for feed pagination. The cursor encodes the last seen item's timestamp and ID. Next page fetches posts where `(publishedAt < cursor.publishedAt) OR (publishedAt = cursor.publishedAt AND id < cursor.id)`.

Serialized as `publishedAt|id` in the API query param for simplicity.

## Alternatives Considered
- **Offset-based** (existing pattern): Simpler but causes page drift in chronological feeds. Acceptable for community post listings (relatively static) but not for a cross-community aggregated feed.
- **Keyset on publishedAt only**: Simpler cursor but breaks on timestamp collisions (two posts published at the same millisecond would skip one).

## Consequences
- Feed endpoints use cursor-based pagination; listing endpoints keep offset-based
- `limit + 1` fetch pattern determines `hasMore` without a count query
- Future feed-like features (notifications, activity streams) should follow this cursor pattern
