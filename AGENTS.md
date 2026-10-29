# Repository Guidelines

## Project Structure & Module Organization

AutoVerse uses Next.js App Router, React, TypeScript, Tailwind CSS, and Prisma/PostgreSQL.

- `app/`: customer, profile, and admin routes; `app/actions/` contains server mutations, and `app/api/chat/route.ts` handles VeroChat.
- `components/`: reusable UI; `components/admin/` contains admin-specific components.
- `lib/`: Prisma singleton, Clerk user synchronization, email, and order lifecycle helpers.
- `types/`, `constants/`, and `utils/`: shared types, reference data, and utilities.
- `prisma/`: database schema, versioned migrations, and seed data.
- `public/`: static images and SVG assets. Global styles live in `app/globals.css`.

## Build, Test, and Development Commands

- `npm ci`: install dependencies from the committed `package-lock.json`.
- `npm run dev`: start local development at `http://localhost:3000`.
- `npm run build`: generate Prisma Client and build the production application.
- `npm start`: serve an existing production build.
- `npx tsc --noEmit`: check TypeScript types.

`npm run lint` currently invokes `next lint`, which the installed Next.js 16 CLI does not support. No ESLint or Prettier configuration is present; do not report this script as a passing check.

## Coding Style & Naming Conventions

Follow existing two-space indentation, double quotes, and semicolons. TypeScript strict mode is enabled. Use PascalCase component filenames (`CarCard.tsx`), camelCase functions and variables, and Next.js route filenames such as `page.tsx`, `layout.tsx`, and `route.ts`. Follow existing import aliases, including `@/lib/prisma` and `@components`.

Keep database access in server code and add `"use client"` where interactivity requires it. Reuse `lib/prisma.ts`. Convert Prisma Decimal values to numbers and dates to strings when preparing client-facing data. Preserve server-side authentication, ownership, and admin checks on mutations.

## Testing Guidelines

No automated test framework, test script, or coverage threshold is configured. Run type checking and a production build for code changes. Manually verify affected booking, filtering, profile, admin, or chat flows; check mobile layouts and both themes for UI changes. Record checks and limitations in the PR.

## Commit & Pull Request Guidelines

History uses informal summaries such as `UI tweaks`; no enforced commit format is evident. Prefer concise, specific descriptions. PRs should explain the change, link relevant issues, list verification performed, and include screenshots for UI changes. Include migrations and configuration requirements when applicable.

## Security & Configuration

Keep credentials in ignored environment files. Configure database URLs and Clerk keys locally; email and chat use `RESEND_API_KEY` and `GEMINI_API_KEY`. Never commit secrets or expose server keys through `NEXT_PUBLIC_` variables. Review migrations against a development database before applying them elsewhere.
