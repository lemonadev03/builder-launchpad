---
date: 2026-03-28
ticket: "2.1 Profile Schema & Data Model"
affected: [db/schema, lib/auth, lib/validations]
---

# Profile & Tag Data Architecture

## Context
Profiles are the atomic unit of the directory. Tags (max 3 per profile) are selected from a platform-managed predefined list that will grow over time and be managed by Platform Admin (Phase 15).

## Decision
- **Tags**: Separate `tag` table + `profile_tag` join table (not JSON array on profile). Tags have id, slug, label, color. The join table uses composite PK.
- **Social links**: jsonb column on profile (not a separate table). Fixed set of 6 platforms.
- **Profile auto-creation**: Better Auth `databaseHooks.user.create.after` inserts a profile row with auto-generated username on every signup (email/password and magic link).
- **Onboarding tracking**: `onboardingCompletedAt` nullable timestamp on profile. Null = needs onboarding.

## Alternatives Considered
- **Tags as JSON array**: Simpler but no referential integrity, can't query/manage tags independently, harder to evolve.
- **Social links as separate table**: Over-normalized for a fixed small set. jsonb is simpler and performant.
- **Profile creation via middleware/API**: Race conditions with concurrent requests. The DB hook fires atomically after user creation.

## Consequences
- Tag management requires querying the `tag` table. Profile updates must sync `profile_tag` rows.
- Username uniqueness enforced by DB constraint + app-level check. Username changes need uniqueness validation.
- All profile fields except displayName and username are optional — supports incremental onboarding.
