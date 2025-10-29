# Triple Captain

Fantasy Premier League companion built with Next.js App Router. Managers can enter an FPL entry ID to fetch a server-rendered dashboard featuring profile details, totals, latest gameweek metrics, and a pitch-style card that visualises the most recent XI alongside bench points and captain badges.

## Current Features

- Manager lookup with persisted recent selections and dark/light theme toggle.
- Summary dashboard with profile/totals cards, live-aware gameweek metrics, and deadline countdown.
- Gameweek Pitch Card with player images, live match indicators, captain badges, and professional fallback icons.
- League standings view with rank-sorted display, rank labels, and pagination support.
- Local analytics hooks (Vercel Analytics) plus accessibility-conscious UI primitives.

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

To surface FPL API logs while developing, prefix commands with `FPL_DEBUG_LOGS=true pnpm dev`.

## Deployment

Deployments will target Vercel once milestone M5 is reached. Refer to `docs/plan_md_fpl_next.md` for the detailed deployment checklist.
