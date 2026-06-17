# Triple Captain — Zero-Token Data Engine

The plan to make Triple Captain the most data-rich FPL site anywhere, where every
suggestion, prediction and insight is produced by **our own deterministic engine**
— no AI tokens spent at request time, ever.

---

## 0. Guiding principle

> **AI is the scaffolding, not the building.** Use it (sparingly) to help *design*
> models and *write copy templates*. Once built, the product runs on maths +
> precomputed data. The "intelligence" lives in models we own and can explain.

A user request must never trigger an LLM call. Worst case it reads a precomputed
row from Postgres. The only live external calls are cheap FPL reads that are
*inherent* to being a live companion (your picks, live scores, your mini-league).

---

## 1. What is online vs offline today

| Surface | Source today | Verdict |
|---|---|---|
| Your squad / picks | FPL API (live) | **Stays live** — must be real-time, but it's a cheap read, no AI |
| Live gameweek scores | FPL API (60s) | **Stays live** — inherent |
| Mini-league standings | FPL API (600s) | **Stays live** — inherent |
| Deadline countdown | FPL API | **Stays live** — trivial |
| Player metadata (price/form/ownership) | DB via `db:sync` | Already offline ✓ |
| Gaffer audit | was AI; now engine-or-AI | **→ fully offline** (engine + narrator) |
| Chief Scout differentials | was AI; now engine-or-AI | **→ fully offline** |
| League insights | was AI | **→ fully offline** (templated) |
| Elite-template analysis | DB (Brain) | Already offline ✓ |
| Fixture difficulty | FPL's static FDR | **→ replace** with our own ratings |
| Match predictions | — | **NEW, offline** |
| Custom xP | FPL's `ep_next` | **→ replace** with our own model |

**Everything labelled "→" becomes a pure function over our data.** The AI key
becomes optional polish (a slightly wittier sentence), never a dependency.

---

## 2. Data layer (the foundation)

### 2a. Current season — FPL API → DB (already have `db:sync`)
Extend the sync to also pull, per player, `element-summary/{id}`:
- `history` — this season's per-GW actuals (points, minutes, xG, xA, bps…)
- `history_past` — career season totals (incl. xG/xA back to 2022/23)

### 2b. History — vaastav/Fantasy-Premier-League (2016-17 → 2024-25)
Public CSVs, one-time load + ~3 refreshes/yr (their cadence):
- `data/<season>/fixtures.csv` — every match: teams, scores, difficulty, kickoff → **match history**
- `data/<season>/teams.csv` — per-season team id↔code↔name + FPL strength ratings
- `data/<season>/gws/merged_gw.csv` — per-player-per-GW: xP, xG, xA, xGI, xGC, minutes, bps, ict, opponent, was_home → **the motherlode** for xP, consistency, per-90 rates

### 2c. New Prisma models
```
HistoricalMatch     (season, event, homeCode, awayCode, hg, ag, hxg?, axg?, kickoff)
HistoricalPlayerSeason (playerCode, season, minutes, goals, assists, xG, xA, points, ppg…)
HistoricalPlayerGw  (optional, heavy) — only if we want boom/bust distributions
TeamRating          (teamCode, elo, attackStrength, defenceStrength, homeAdv, updatedAt)
MatchPrediction     (season, event, homeCode, awayCode, pHome, pDraw, pAway, xHome, xAway, topScores Json)
PlayerProjection    (playerId, event, xPoints, capScore, ceiling, floor, archetype, reasons Json)
```
Players/teams keyed by **`code`** (stable across seasons), not per-season `id`.

---

## 3. Engine modules (pure, deterministic, no tokens)

1. **Team ratings** — Elo (updated match-by-match over all history) + attack/defence
   strength from goals & xG (Dixon-Coles style decay so recent seasons weigh more).
2. **Match predictor** — bivariate Poisson from attack/defence/home-adv →
   P(win/draw/loss), expected scoreline, top-N scorelines, BTTS%, clean-sheet%.
   *Validated against held-out seasons for calibration (Brier score).*
3. **Custom FDR** — derive each team's next-N opponent difficulty from *our* ratings,
   split by attack vs defence (a great fixture for a defender ≠ for a striker).
4. **Custom xP** — per player: minutes model × per-90 attacking returns (blended
   season + career, regressed to position mean) × fixture (from #2) + set-piece &
   penalty bonus + clean-sheet EV (defenders/GK from #2). Beats FPL's `ep_next`.
5. **Player scoring / ranking** — the Brain, extended to consume #4 + elite data.
6. **Captaincy model** — ceiling-weighted xP (captains want upside, not floor) ×
   fixture × elite captaincy signal.
7. **Transfer optimizer** — given squad + bank + FT, find best 1-2 transfers by
   Δ(projected points over next N GWs) under budget/club/position constraints.
8. **Chip strategy** — BB/TC/FH/WC timing from fixture swings & blank/double GWs.
9. **Price-change predictor** — from net transfer momentum vs ownership thresholds.
10. **Archetypes** — consistency / ceiling / floor / "boom-or-bust" from historical
    GW point distributions; "set-and-forget" vs "rotation risk".

---

## 4. Narrator layer (natural language, zero tokens)

The Gaffer / Chief Scout voice from **templated generation**: structured engine
facts → sentence templates with synonym pools, seeded by player/context for
variety. e.g. `"{player} is in {form_word} form ({form}) with {fixture_phrase}."`
→ *"Haaland's in scintillating form (9.2) with a kind run ahead."*

Deterministic, instant, free. The optional AI path (when `ANTHROPIC_API_KEY` set)
just rephrases the same facts more naturally — never the source of truth.

---

## 5. Zero-token operation model

**Nightly precompute (cron on the server):**
1. `db:sync` (refresh current-season players/fixtures)
2. recompute `TeamRating` (Elo/strength) from history + current results
3. recompute `MatchPrediction` for upcoming fixtures
4. recompute `PlayerProjection` (xP, cap score, archetypes) for all players
5. rebuild `EliteSnapshot` (the Brain) weekly

Pages then **read precomputed rows**. A cold request = a few indexed SELECTs.
No AI, no heavy math at request time.

Cron: `0 4 * * *` → `pnpm precompute`. In-season add a deadline-day run.

---

## 6. Feature roadmap (what makes us "top top top")

**Tier A — core differentiators (this project):**
- Our-own xP + custom FDR (attack/defence split)
- Match predictor with scorelines & probabilities (no FPL site shows this well)
- Transfer optimizer ("best move for your team this week", offline)
- Captaincy ceiling model
- Player archetypes & boom/bust profiles from 9 seasons

**Tier B — engagement:**
- Team-vs-team head-to-head history & predicted result on the Fixtures page
- "Form vs Fixtures" matrix; rotation/rest risk flags
- Differential finder filtered by elite-edge (have it) + xP (new)
- Mini-league "rivals watch": who's captaining what, template gaps

**Tier C — moat:**
- Backtested model accuracy badges ("our xP beat FPL's by X% last season")
- Price-change predictions with confidence
- Set-piece & penalty hierarchy per club
- Season-long planner using predicted fixtures across all 38 GWs

---

## 7. Build phases

- **P1 — Data foundation** *(in progress)*: historical models + ingestion (vaastav + FPL history).
- **P2 — Match predictor**: Elo + Poisson, validated. Surface on Fixtures (team-vs-team).
- **P3 — Custom xP + FDR**: replace FPL's; power scoring/captaincy/transfers.
- **P4 — Transfer optimizer + chip strategy**.
- **P5 — Narrator**: templated Gaffer/Scout; drop AI dependency entirely.
- **P6 — Precompute cron + accuracy backtesting + polish**.

Each phase ships behind the push-to-deploy CI and degrades gracefully if a data
table is empty (off-season safe).
