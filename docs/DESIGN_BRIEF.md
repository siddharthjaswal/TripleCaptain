# Triple Captain — Design Brief

A reference for redesign / wireframing work. Pair this with one screenshot per page.

## Product in one line
A **Fantasy Premier League (FPL) companion** for UK managers: enter your FPL entry ID and get
server-rendered dashboards — squad/pitch view, gameweek breakdown, transfer planning, mini-league
standings, fixtures, and AI tactical insights. Live at **https://triplecaptain.in**.

## Stack (for context, not constraint)
Next.js 16 (App Router) · React 19 · Tailwind CSS v4 (CSS-variable tokens) · Prisma/Postgres ·
data from the public FPL API. Theming is 100% driven by CSS variables + `tc-*` utility classes in
`app/globals.css`, so a palette change cascades everywhere.

---

## Pages — 8 total

| # | Page | Route | What's on it |
|---|------|-------|--------------|
| 1 | **Landing** | `/` | Hero wordmark, value prop, FPL-ID entry form, feature grid, club-badge reel, footer |
| 2 | **Summary (Dashboard)** | `/[id]` | Manager header + nav tabs, AI "Gaffer's Auditor" CTA card, Season Pace, Chips Status, Manager Profile, Overall Performance, **compact pitch** (starting XI + bench) |
| 3 | **Gameweek** | `/[id]/gameweek` | GW header (points/rank/bench, chip used), prev/next nav, **pitch** for that GW |
| 4 | **AI Insight** | `/[id]/predictions` | AI predictions (captain picks, predicted XI, differentials). *Off-season gated — shows empty state when no upcoming GW* |
| 5 | **Transfer Planner** | `/[id]/planner` | Interactive **editable pitch**, bank balance, tap-to-swap players, search, fixture difficulty stars, "Gaffer's Verdict" AI |
| 6 | **Leagues** | `/[id]/leagues` | League switcher pills, standings table (rank/trend/captain/points/total), highlighted "you" row, **Title Race line chart** (top 5) |
| 7 | **Fixtures** | `/[id]/fixtures` | GW selector, fixture cards with scores + your players' points per match |
| 8 | **Pro / Pricing** | `/[id]/pro` | 3 tiers: Free / Season Pass £14.99 / Credit Pack £0.99, feature lists, "Trusted by" strip |

Shared chrome: a top nav (Summary · GW · AI Insight · Planner · Leagues · Fixtures) with a theme
toggle, plus a **mobile bottom tab bar** (icons) below `md`. Also non-page states: `loading`,
`error`, `not-found` per route.

---

## Color palette — "Aubergine Nights" (classic FPL)

Roles: **magenta = action**, **cyan = positive / up / highlight**, **gold = premium / captain**,
**red = negative / down**. Green is intentionally avoided.

### Dark (default)
| Token | Value | Use |
|-------|-------|-----|
| surface-root | `#120318` | page background (deep aubergine-black) |
| surface-elevated | `#1d0a26` | cards |
| surface-hover | `#2a1334` | hover / inset wells |
| surface-border | `#311941` | borders |
| surface-border-strong | `#46285a` | stronger borders |
| text-primary | `#f7eefb` | headings / values |
| text-secondary | `#b8a3c4` | body / labels |
| text-tertiary | `#7d6688` | muted |
| accent (magenta) | `#ff2d78` (hover `#ff5b96`) | buttons, active state, links |
| accent-light | `rgba(233,0,82,0.16)` | active pill / tint fills |
| cyan | `#04f5ff` / `#00c6d4` | positive points, highlights |
| gold | `#f5b932` | captain badge, premium |

### Light
| Token | Value |
|-------|-------|
| surface-root | `#faf7fb` |
| surface-elevated | `#ffffff` |
| surface-hover | `#f3edf5` |
| surface-border | `#e9e1ed` |
| surface-border-strong | `#d3c6da` |
| text-primary | `#24062a` |
| text-secondary | `#6c5673` |
| text-tertiary | `#9d8aa3` |
| accent (magenta) | `#e90052` (hover `#c70045`) |
| accent-light | `#fde0ea` |
| cyan | `#00c6d4` · gold | `#f5b932` |

Brand gradient (wordmark/accents): magenta → violet → cyan
(`#ff2d78 → #c33bd4 → #04f5ff`).

---

## Typography
- **Display / headlines / big numbers:** Archivo (bold, condensed feel) — `--font-display`
- **Body / UI:** Geist Sans — `--font-geist-sans`
- **Stats / scoreboard numbers:** Geist Mono, tabular figures — `--font-geist-mono`

## Core UI primitives (in `globals.css`)
- `tc-card` — 16px radius, subtle border + top hairline highlight, lift-on-hover
- `tc-button-primary` — gradient magenta + glow (reserve for real CTAs)
- `tc-badge`, `tc-input`, `tc-skeleton`
- `tc-pitch` — **compact, dark "under-the-lights" field** (not bright grass): faint white markings,
  player chips with photo + name + position + points; gold C/V captain/vice badges; cyan live dot.
  Tuned to fit ~one viewport.

## Signature / complex components
- **Pitch** (Summary, Gameweek, Planner) — the hero visual; player kits/photos from FPL CDN
- **Title Race chart** (Leagues) — recharts line chart, categorical magenta/cyan/gold/violet/orange
- **Pricing cards** (Pro) — tiered, "Best Value" ribbon

---

## Important context for redesign
- **Two themes, both supported & readable** (light mode was recently fixed; it had been dark-first).
  Keep both working — palette is token-driven.
- **Mobile matters** — there's a dedicated bottom tab bar; design mobile-first for the dashboard.
- **Data-dense** — FPL users want lots of numbers legible at a glance (pace, rank deltas, EP, ownership,
  fixture difficulty). Tabular numerals + clear hierarchy are key.
- **Monetization is live in the UI** (not yet wired to payments): Free / £14.99 season / £0.99 credits.
  The paid tier sells AI features (Gaffer audit, Chief Scout, predictions).
- **AI features exist but the backend is currently broken** (built on the wrong SDK) — treat AI
  surfaces as real product areas to design for, even if not functional yet.
- **Off-season states** — predictions/planner gracefully degrade when there's no upcoming gameweek.

## Known weak spots worth wireframing
- Dashboard card density/order on the Summary page (lots competing for attention above the pitch)
- The empty/CTA states (AI auditor card, off-season predictions)
- Planner's larger editing pitch vs the compact display pitch — consistency
- Fixtures readability and the per-player points affordance
- Onboarding (the single FPL-ID input is the entire front door)
