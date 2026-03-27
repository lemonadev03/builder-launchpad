@AGENTS.md

# Builder Launchpad

Community platform for tech builder communities — member management, content, talent discovery.

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack, React 19)
- **Styling:** Tailwind CSS v4 + shadcn/ui (dark blue theme, Linear-inspired)
- **ORM:** Drizzle ORM with postgres.js driver
- **Database:** PostgreSQL on Railway
- **Auth:** Better Auth + Resend (ticket 1.2)
- **Language:** TypeScript (strict)

## Project Structure

```
src/
├── app/           # Next.js App Router pages and layouts
├── components/    # React components
│   └── ui/        # shadcn/ui primitives
├── db/            # Drizzle schema, connection, migrations
│   ├── index.ts   # DB client export
│   └── schema.ts  # Drizzle table definitions
└── lib/           # Shared utilities
```

## Conventions

- **Next.js 16:** All request APIs are async — `await params`, `await searchParams`, `await cookies()`, `await headers()`
- **Components:** shadcn/ui as the base. Add via `npx shadcn@latest add <component>`
- **Database:** Schema in `src/db/schema.ts`. Use `npm run db:push` for dev, `npm run db:generate` + `npm run db:migrate` for production migrations
- **Naming:** kebab-case files, PascalCase components, camelCase functions/variables
- **Imports:** Use `@/` alias (maps to `src/`)
- **Theme:** Dark blue primary (`oklch(0.40 0.12 255)`), light mode first, 0.5rem base radius
- **Design:** Linear-inspired — clean, minimal, precise. No unnecessary decoration

## Scripts

```
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm run db:generate  # Generate Drizzle migrations
npm run db:migrate   # Run migrations
npm run db:push      # Push schema directly (dev only)
npm run db:studio    # Open Drizzle Studio
```

## Product Context

Builder Launchpad is the discovery layer for builder communities. See the Product Bible in Notion for full context. Key entities: Community → Chapter → Committee → Member. Content: blogs, forums, listings. Global directory connects everyone.
