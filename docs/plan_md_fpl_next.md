# Plan & Task Breakdown

## Objectives & Success Metrics

- Ship an FPL entry companion that renders profile, totals, latest gameweek, and league standings with sub-second perceived load.
- Keep API error rate under 1% by validating and normalizing all upstream responses.
- Maintain DX velocity via automated lint, test, and deploy workflows running under 5 minutes.

## Milestones

### M0 — Project Bootstrap (0.5 day, blocker for all other milestones)

- [x] Spin up Next.js App Router project with TypeScript + pnpm workspace hygiene (`pnpm dlx create-next-app@latest`).
- [x] Install core tooling (Tailwind, shadcn/ui optional, Zod, Vitest, Testing Library, Playwright, ESLint, Prettier).
- [x] Establish project scaffolding: `app/`, `lib/`, `components/`, `styles/`, plus base layout, fonts, and global styles.
- [x] Configure linting + formatting scripts inside `package.json` and wire to `pnpm lint` / `pnpm format`.

### M1 — Entry Flow & Summary (1–1.5 days, depends on M0)

- **Deliverables:** Single entry flow with summary cards served via RSC.
- [x] Implement `EntryIdForm` client component with validation and optimistic navigation to `/[entryId]`.
- [x] Build `lib/fpl/schemas.ts` Zod contracts covering: entry profile, entry history, event live data, default classic league snippet.
- [x] Create `lib/fpl/client.ts` server-only fetch wrappers with centralized error normalization & caching knobs.
- [x] Implement route handlers under `/api/fpl`:
  - [x] `GET /api/fpl/profile?entryId=` returning `ProfileDTO`.
  - [x] `GET /api/fpl/latest-gw?entryId=` deriving current GW and live points.
  - [x] `GET /api/fpl/summary?entryId=` composing profile + totals + latest GW snapshot.
- [x] Add DTO mappers in `lib/fpl/mappers.ts`, with unit fixtures for golden data.
- [x] Build `/[entryId]/page.tsx` (RSC) rendering ProfileCard, TotalsCard, LatestGwCard with streaming-friendly loading states and inline error banner.

### M2 — League Rankings (0.5–1 day, requires M1 data layer)

- **Deliverables:** Paginated classic league standings for an entry.
- [x] Decide default league strategy (auto fetch first classic league vs. manual leagueId input) and codify in UX copy.
- [x] Implement `GET /api/fpl/leagues?type=classic|h2h&leagueId=` with reusable cache keys + guards against pagination loops.
- [x] Build `/[entryId]/leagues/page.tsx` RSC + `LeagueTable` component, handling >50-entry pagination and empty states.
- [x] Wire navigation between summary and leagues pages; ensure consistent breadcrumbs/tab UI.

### M3 — Polish & UX (0.5–0.75 day)

- **Deliverables:** Production-ready look and feel.
- [ ] Introduce skeleton UIs for all major cards and table rows, respecting streaming boundaries.
- [ ] Finalize responsive layout (mobile-first) and implement dark mode toggle with CSS variables.
- [ ] Run accessibility pass (labels, ARIA roles, focus states, reduced motion) and capture follow-ups.
- [ ] Instrument basic analytics (page view + entry submission) with chosen provider (e.g., Vercel Analytics).

### M4 — Testing & CI (0.5 day, parallelizable after M1)

- **Deliverables:** Automated safety net for core flows.
- [ ] Author Vitest unit suites for schemas, mappers, and route handler happy/error paths using mocked fetch.
- [ ] Create Playwright specs for: happy entry, invalid entry, league rendering with pagination.
- [ ] Configure GitHub Actions CI: `pnpm lint`, `pnpm test`, `pnpm test:e2e` (Playwright headed off) with caching for pnpm.
- [ ] Document runbooks for common failures (schema mismatch, rate limiting).

### M5 — Deploy & Observability (0.5 day)

- **Deliverables:** Stable Vercel deployment with sensible defaults.
- [ ] Provision Vercel project, configure envs (none required yet) and branch previews.
- [ ] Set `fetch` caching and `revalidate` per endpoint; add stale-while-revalidate hints where valuable.
- [ ] Add security headers (CSP, cache) via `next.config.mjs` / middleware.
- [ ] Hook up lightweight logging/metrics (console structured logs + optional Sentry toggle) with docs on how to enable.

## Detailed TODOs

### Data Layer

- [ ] `getBootstrap()` with 1h cache + warm-up script to avoid cold starts.
- [ ] `getEntryProfile(entryId)` / `getEntryHistory(entryId)` cached 5–30m with GW-aware overrides.
- [ ] `getCurrentGw()` derived from bootstrap and memoized in-memory per request.
- [ ] `getLatestGwPoints(entryId, gw)` composing `event/{gw}/live` + picks with guard rails for missing player stats.
- [ ] `getClassicLeagueStandings(leagueId)` with pagination cursor support.
- [ ] Zod schemas for each endpoint (strict, `.passthrough(false)`), including legacy field fallback behaviour.
- [ ] DTO mappers → ProfileDTO, TotalsDTO, LatestGwDTO, LeagueStandingDTO with type tests.

### Pages & Components

- [ ] `/` Landing with EntryIdForm (client) and friendly invalid ID copy.
- [ ] `/[entryId]` Summary page (RSC) rendering ProfileCard, TotalsCard, LatestGwCard, plus GW metadata chip.
- [ ] `/[entryId]/leagues` League page (RSC) with LeagueTable, pagination controls, empty placeholders.
- [ ] Shared UI: Card, Table, Skeleton, ErrorBanner, Tabs/Navigation, Analytics boundary component.

### Caching & Performance

- [ ] Align `next: { revalidate }` strategy per endpoint (see Architecture) and document in `lib/cache.ts`.
- [ ] Add active-GW short revalidate toggle (e.g., env-driven) to avoid over-fetching when off-season.
- [ ] Stream server components and ensure suspense boundaries wrap network-heavy sections.
- [ ] Precompute static assets (fonts, icons) and leverage Next Image for player crests (future).

### Error & Edge Cases

- [ ] Invalid entryId (non-numeric, 404) with actionable UI message.
- [ ] GW with incomplete live data → show last confirmed totals + "Live data updating" banner.
- [ ] League pagination >50 entries and private league access errors.
- [ ] Network timeouts → retry with exponential backoff (server-only) and fallback telemetry.
- [ ] FPL maintenance windows → global downtime notice surfaced from health check.

### Testing

- [ ] Unit: schemas reject shape mismatch; ensure helpful error messages.
- [ ] Unit: mappers convert representative fixtures including edge cases (bench boost, triple captain).
- [ ] Route handler tests with mocked fetch/error permutations and cache behaviour assertions.
- [ ] E2E flows (Playwright) covering mobile + desktop snapshots and accessibility checks.
- [ ] Smoke deploy validation script hitting `/api/fpl/*` endpoints before promotion.

## Definition of Done

- [ ] User can enter FPL entry ID and see: profile, total points, overall rank
- [ ] Latest gameweek points shown for the current/most recent GW
- [ ] League table visible for at least one classic league
- [ ] All data fetched server-side with caching and friendly errors
- [ ] CI green; deploy on Vercel
- [ ] Observability hooks (logging + analytics) enabled or documented with toggles

## Risks & Mitigations

- **FPL API shape changes** → Zod validation + mapper layer isolates breaking changes
- **Rate limiting / heavy load** → server caching, revalidate windows, incremental rendering
- **Live GW volatility** → conservative UI (show last completed GW if needed), banner when live data is incomplete
- **Limited test data** → curate anonymized fixtures in `tests/fixtures` to cover captain chips, blanks, and double GWs

## Dependencies & Coordination

- Confirm design tokens/brand guidelines if collaboration with design is planned.
- Align with infra owner on deploying logging/analytics (Sentry, PostHog) before M5.
- Coordinate Playwright CI resources (browser binaries cache) to keep pipeline under 6 minutes.
