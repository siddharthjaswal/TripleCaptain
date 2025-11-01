# Architecture

## Overview

A lightweight Fantasy Premier League (FPL) companion built with **Next.js (App Router)** and **TypeScript** that fetches a user's FPL data by ID and displays:

- Profile (team name, player name)
- Total points and overall rank
- Latest gameweek score with interactive pitch visualization
- Dedicated gameweek browser with Previous/Next navigation
- League standings with smart filtering and interactive race chart for top 5 managers
- Premier League fixtures with player performance tracking

No user authentication is required initially—users paste their FPL **entry ID**. All data is fetched from the public FPL API via server-side route handlers with caching.

## Goals

- Fast, cache-friendly UI using **Server Components** where possible.
- Stable data layer that isolates FPL API specifics behind our own typed client.
- Clear separation of concerns (fetching, mapping, rendering, UI components).
- Easy deploy to Vercel.

## Tech Stack

- **Next.js 16 (App Router)**, **React 19**, **TypeScript**
- **Route Handlers** for API proxy and server-only data fetching
- **React Server Components (RSC)** + **Client Components** where interactivity is needed
- **Tailwind CSS** for styling with CSS custom properties for theming
- **Recharts** for interactive data visualization
- **Zod** for runtime validation of FPL responses
- **Vitest** + **Testing Library**; **Playwright** for E2E
- **ESLint** + **Prettier**

## Data Sources (Public FPL API)

We consume only read endpoints:

- `GET https://fantasy.premierleague.com/api/bootstrap-static/` (game + players + teams meta)
- `GET https://fantasy.premierleague.com/api/entry/{entryId}/` (profile)
- `GET https://fantasy.premierleague.com/api/entry/{entryId}/history/` (past + current totals)
- `GET https://fantasy.premierleague.com/api/entry/{entryId}/event/{gw}/picks/` (team picks for gw)
- `GET https://fantasy.premierleague.com/api/event/{gw}/live/` (points breakdown in gw)
- `GET https://fantasy.premierleague.com/api/fixtures/?event={gw}` (Premier League fixtures for gw)
- `GET https://fantasy.premierleague.com/api/leagues-classic/{leagueId}/standings/` (classic league)
- `GET https://fantasy.premierleague.com/api/leagues-h2h/{leagueId}/standings/` (H2H league)

> Note: Endpoints may have informal rate limits. We aggressively cache responses and avoid thundering herds.

## High-Level Architecture

```text
Browser
  │
  │ 1) User enters FPL Entry ID
  ▼
Next.js UI (App Router)
  ├─ RSC pages fetch via server-only FPL client
  ├─ Client components for forms & interactions
  ▼
Route Handlers (/api/fpl/*)
  ├─ Validate input (Zod)
  ├─ Call FPL API (server-only)
  ├─ Cache (Next.js fetch cache + revalidate)
  └─ Map/shape to typed DTOs for UI
```

## Routing & Folders

```
app/
  layout.tsx
  page.tsx                          # Landing: asks for Entry ID + recent entries
  (dashboard)/
    [entryId]/page.tsx              # SSR/RSC summary page: profile + totals + latest GW + pitch card
    [entryId]/gameweek/page.tsx     # SSR/RSC gameweek page with Previous/Next navigation
    [entryId]/leagues/page.tsx      # SSR/RSC league standings + top 5 race chart
    [entryId]/fixtures/page.tsx     # SSR/RSC fixtures with team badges + player points
  api/
    fpl/
      profile/route.ts              # ?entryId=
      summary/route.ts              # profile + totals + latestGW composed
      latest-gw/route.ts            # ?entryId=
      leagues/route.ts              # ?leagueId= & type=classic|h2h
lib/
  fpl/
    client.ts                       # server-only fetch wrappers + React cache()
    service.ts                      # business logic orchestration layer
    mappers.ts                      # map raw FPL -> DTOs
    schemas.ts                      # Zod schemas for validation
    dto.ts                          # TypeScript DTO types
  cache.ts                          # helpers for revalidate + keys
  utils.ts
components/
  EntryIdForm.tsx (client)          # Entry ID input with validation
  ProfileCard.tsx (server)          # Manager profile display
  LatestGwCard.tsx (server)         # Latest gameweek metrics
  TotalsCard.tsx (server)           # Total points and rank
  GameweekPitchCard.tsx (client)    # Interactive pitch visualization with player images
  GameweekCard.tsx (client)         # Gameweek navigation with Previous/Next
  LeagueTable.tsx (server)          # League standings table
  LeagueRaceChart.tsx (client)      # Top 5 race chart with recharts + interactive toggles
  LeagueSwitcher.tsx (client)       # League dropdown selector
  FixturesCard.tsx (server)         # Fixture display with team badges + player columns
  DashboardNav.tsx (client)         # Dashboard navigation tabs
  ThemeToggle.tsx (client)          # Dark/light mode toggle
  DeadlineCard.tsx (client)         # Countdown to next deadline
  RecentEntries.tsx (client)        # Recent entry history
  PersistLastEntry.tsx (client)     # localStorage persistence
styles/
  globals.css                       # CSS custom properties for theming
```

## Data Flow & DTOs

- **Service layer** (`lib/fpl/service.ts`) orchestrates data fetching and composition via server-only client
- **FPL client** (`lib/fpl/client.ts`) wraps API calls with React `cache()` and `fetch` revalidation
- Responses validated via **Zod** schemas and mapped to typed DTOs:
  - `ProfileDTO`: teamName, playerName, overallPoints, overallRank
  - `TotalsDTO`: totalPoints, overallRank, transfersMade, etc.
  - `LatestGwDTO`: event, points, rank, starting XI + bench with player details, chips, live indicators
  - `GameweekViewDTO`: entryId, teamName, managerName, currentEvent, gameweek
  - `LeaguesViewDTO`: entryId, leagues list, selectedLeague, leagueRace
  - `LeagueStandingDTO`: leagueName, entries with rank/points, pagination, gameweek context
  - `LeagueRaceDTO`: top 5 entries with history (event, totalPoints) for chart visualization
  - `FixturesViewDTO`: entryId, event, fixtures with team badges/scores, playersByFixture map
  - `FixtureDTO`: match details with team IDs, badges, scores, kickoff time
  - `FixturePlayerDTO`: player details with team association for column layout

## Caching Strategy

- Use Next.js **fetch cache** with `next: { revalidate: n }` per endpoint.
- Suggested revalidate windows:
  - `bootstrap-static`: `revalidate: 3600` (hourly)
  - `entry/*`: `revalidate: 300` (5 min) during active GWs; `1800` off-peak
  - `event/{gw}/live`: `revalidate: 60` while a GW is active; `3600` after deadline
- Compose cache keys by URL + params; avoid client-side re-fetch unless needed.
- Optional: add **Edge Cache** (Vercel) via `Cache-Control` headers on route responses.
- Expose an env-driven "active GW" toggle that forces shorter revalidate windows without code changes.

## Error Handling & UX

- Validate inputs with Zod; return 400s for invalid IDs.
- Gracefully handle 404/5xx from FPL; show user-friendly banners.
- Provide loading skeletons for cards (RSC streaming where possible).

## Security & Privacy

- No secrets are required for public FPL read APIs; keep all calls server-side to avoid CORS and rate-limit exposure.
- Sanitize all query params; set strict Content Security Policy in `next.config.mjs`/headers.

## Performance

- Prefer **Server Components** for data-heavy sections.
- Minimal client JS (form + progressive navigation).
- Preload routes on hover; RSC streaming for fast TTFB.
- Wrap heavy sections in suspense boundaries to keep primary content responsive.

## UX & Analytics

- Maintain a lightweight navigation shell with tabs/breadcrumbs for summary vs. leagues.
- Ship skeleton loaders and optimistic messaging for live GW volatility.
- Instrument analytics (e.g., Vercel Analytics or PostHog) for entry submissions and page views through a shared analytics provider boundary.

## Testing

- **Unit**: mappers + schemas; route handlers with mocked fetch.
- **E2E**: Page loads, valid/invalid entry flow, league table render.

## Observability

- Basic structured request logging in route handlers (method, endpoint, status, latency).
- Optional Sentry integration for errors + traces.
- Include health-check endpoint/tests to detect upstream FPL maintenance windows.

## Future Extensions

- Multiple saved entry IDs (requires DB: SQLite/Prisma)
- Compare vs friends or past seasons
- Per-player breakdown with detailed statistics
- PWA installable shell
- Push notifications for deadline reminders
