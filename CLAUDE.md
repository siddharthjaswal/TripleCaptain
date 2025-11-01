# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Triple Captain is a Fantasy Premier League companion app built with Next.js 16 (App Router) and React 19. Users enter an FPL entry ID to view server-rendered dashboards with profile details, gameweek metrics, pitch visualizations with player images, live match indicators, deadline countdown, league standings with race charts, and fixtures with team badges. The app features a dedicated Gameweek page with navigation, smart league filtering, and interactive data visualizations. All data is fetched server-side from the public FPL API with aggressive caching.

## Essential Commands

```bash
# Package management - ALWAYS use pnpm
pnpm install              # Install dependencies

# Development
pnpm dev                  # Start dev server on localhost:3000
FPL_DEBUG_LOGS=true pnpm dev  # Enable FPL API request logging

# Code quality
pnpm lint                 # Run ESLint
pnpm typecheck            # Type-check without emitting files
pnpm format               # Format code with Prettier
pnpm format:check         # Check formatting without writing

# Testing
pnpm test                 # Run Vitest unit tests (single run)
pnpm test:watch           # Run Vitest in watch mode
pnpm test:ui              # Launch Vitest UI
pnpm test:e2e             # Run Playwright e2e tests
pnpm exec playwright install  # Install browsers for Playwright (first-time setup)

# Build
pnpm build                # Production build
pnpm start                # Start production server
```

## Architecture Overview

### Data Flow Pattern

The application follows a strict server-side data fetching pattern:

```
Browser → RSC Page → Service Layer (lib/fpl/service.ts) → FPL Client (lib/fpl/client.ts) → FPL API
                                    ↓
                              Mappers (lib/fpl/mappers.ts)
                                    ↓
                              DTOs (lib/fpl/dto.ts)
                                    ↓
                         Server Components (components/)
```

**Critical architectural rules:**
- **ALL FPL API calls MUST go through `lib/fpl/client.ts`** - never call the FPL API directly
- The client is server-only (`import "server-only"`) and uses Zod schemas for runtime validation
- Service layer (`lib/fpl/service.ts`) orchestrates multiple API calls and handles business logic
- Mappers transform raw FPL responses into clean DTOs for UI consumption
- Server Components fetch via service functions; Client Components only handle interactivity

### Caching Strategy

- **Bootstrap data** (`/api/bootstrap-static/`): Uses React `cache()` with no revalidation to avoid Next.js 2MB data-cache limit
- **Entry profile/history**: 300s revalidation (5 minutes)
- **Event picks**: 90s revalidation
- **Live event data**: 60s revalidation during active gameweeks
- **League standings**: 600s revalidation (10 minutes)

The FPL client respects `FPL_DEBUG_LOGS=true` environment variable for detailed request logging.

### Key Layers

1. **FPL Client** (`lib/fpl/client.ts`):
   - Server-only fetch wrappers with centralized error handling
   - Zod validation via schemas from `lib/fpl/schemas.ts`
   - Throws `FplError` with status codes (404 triggers Next.js `notFound()`)

2. **Service Layer** (`lib/fpl/service.ts`):
   - `loadEntrySummary(entryId)`: Composes profile + totals + latest gameweek with picks + live data
   - `loadEntryLeagues(entryId, options)`: Fetches league standings with pagination and top 5 race data
   - `loadGameweek(entryId, options)`: Loads specific gameweek data with navigation support
   - `loadFixtures(entryId, options)`: Fetches fixtures with team badges and player points
   - Handles gameweek resolution logic (current vs. latest completed)
   - Manages error boundaries (404s → `notFound()`, others propagate)

3. **Mappers** (`lib/fpl/mappers.ts`):
   - Transform FPL schemas into typed DTOs
   - Handle edge cases: bench-only squads, missing live data, captain badges
   - Tested extensively in `lib/fpl/mappers.test.ts`

4. **DTOs** (`lib/fpl/dto.ts`):
   - Clean, UI-focused types consumed by Server Components
   - Examples: `ProfileDTO`, `TotalsDTO`, `LatestGameweekDTO`, `LeaguesViewDTO`

### Routing Structure

```
app/
├── page.tsx                           # Landing page with EntryIdForm
├── layout.tsx                         # Root layout with theme provider
├── (dashboard)/
│   └── [entryId]/
│       ├── page.tsx                   # Summary dashboard (profile + totals + gameweek pitch)
│       ├── gameweek/
│       │   └── page.tsx               # Dedicated gameweek page with navigation
│       ├── leagues/
│       │   ├── page.tsx               # League standings with race chart and pagination
│       │   ├── loading.tsx            # Streaming skeleton
│       │   ├── error.tsx              # Error boundary
│       │   └── not-found.tsx          # 404 fallback
│       ├── fixtures/
│       │   └── page.tsx               # Fixtures with team badges and player points
│       ├── loading.tsx                # Summary loading state
│       ├── error.tsx                  # Summary error boundary
│       └── not-found.tsx              # Entry not found
└── api/fpl/                           # Route handlers (profile, summary, latest-gw, leagues)
```

Route handlers exist primarily for backwards compatibility; pages now call service functions directly.

## Critical Patterns

### Gameweek Resolution

The `loadEntrySummary` service uses this logic to determine which gameweek to show:

1. Find the latest completed gameweek from entry history
2. Fall back to `profile.current_event` or bootstrap's current/next event
3. Fetch picks + live data for that gameweek (with fallbacks if unavailable)
4. Mark as `isLive` based on bootstrap event metadata

This prevents showing empty pitch cards when live data is incomplete.

### Client-Side State

- **Recent entries**: Stored in localStorage (`lib/storage.ts`) with max 5 entries
- **League preferences**: Per-entry league ID stored in localStorage
- **Theme**: Dark/light mode preference persisted via `THEME_STORAGE_KEY`

Client components use these utilities:
- `getStoredLeaguePreference(entryId)` / `setStoredLeaguePreference(entryId, leagueId)`
- `PersistLastEntry.tsx` component handles recent entry tracking

### Error Handling

- `FplError` with status codes thrown from client layer
- 404s trigger Next.js `notFound()` in service layer
- Route-level error boundaries (`error.tsx`) catch rendering errors
- Validation errors from Zod include detailed path/message logging when `FPL_DEBUG_LOGS=true`

## Important Files

- **`lib/fpl/service.ts`**: Primary entry point for data fetching in pages
- **`lib/fpl/client.ts`**: Server-only FPL API wrapper with caching
- **`lib/fpl/mappers.ts`**: Data transformation logic (heavily tested)
- **`lib/fpl/schemas.ts`**: Zod schemas for all FPL API responses
- **`lib/storage.ts`**: Client-side localStorage utilities
- **`components/GameweekPitchCard.tsx`**: Complex pitch visualization component
- **`components/GameweekCard.tsx`**: Gameweek page with navigation controls
- **`components/FixturesCard.tsx`**: Fixtures display with team badges and player points
- **`components/LeagueRaceChart.tsx`**: Interactive race chart using recharts
- **`components/LeagueSwitcher.tsx`**: Smart league filter with toggle for large leagues
- **`docs/architecture_md_fpl_next.md`**: Detailed architecture documentation
- **`docs/plan_md_fpl_next.md`**: Milestone tracking and delivery roadmap

## Testing Approach

- **Unit tests**: Vitest with Testing Library for mappers, components, and utilities
- **E2E tests**: Playwright specs in `tests/e2e/` (currently basic landing page coverage)
- Test files co-located with implementation: `*.test.ts` or `*.test.tsx`
- Coverage tracking configured with v8 provider

When writing tests:
- Mock FPL API responses using Zod schemas as fixtures
- Test mapper edge cases (missing data, bench-only squads, captain chips)
- E2E tests should cover entry lookup, invalid ID flow, and league pagination

## Code Quality

- Strict TypeScript with `strict: true`
- ESLint + Next.js config + Testing Library plugin
- Prettier formatting (always run before commits)
- Path alias: `@/*` maps to project root

## Deployment Context

- Target: Vercel (planned for milestone M5)
- Uses `@vercel/analytics` for basic instrumentation
- No environment secrets required (public FPL API only)
- Server-side rendering with aggressive caching for performance
