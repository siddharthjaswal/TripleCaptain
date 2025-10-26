# Triple Captain

Fantasy Premier League companion built with Next.js App Router. The goal is to provide a fast, server-rendered dashboard where managers can enter their FPL entry ID and immediately see profile details, latest gameweek performance, and league standings.

## Tech Stack

```bash
Next.js 16 · React 19 · TypeScript · Tailwind CSS
Zod · Vitest · Testing Library · Playwright
```

Additional planning and architecture context lives in `docs/`:

| Document                           | Summary                                                           |
| ---------------------------------- | ----------------------------------------------------------------- |
| `docs/plan_md_fpl_next.md`         | Delivery roadmap and milestone breakdown.                         |
| `docs/architecture_md_fpl_next.md` | System architecture covering routing, caching, and observability. |

## Getting Started

```bash
# install dependencies
pnpm install

# start the dev server
pnpm dev

# lint, type-check, format
pnpm lint
pnpm typecheck
pnpm format

# run Vitest unit suites
pnpm test

# run Playwright e2e tests (install browsers on first run)
pnpm exec playwright install
pnpm test:e2e
```

The landing page currently provides a project hero while the core flows are under construction. Be sure to keep the README in sync as milestones progress.

## Deployment

Deployments will target Vercel once milestone M5 is reached. Refer to `docs/plan_md_fpl_next.md` for the detailed deployment checklist.
