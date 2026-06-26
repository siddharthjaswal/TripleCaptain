# Triple Captain — Product Roadmap

The five initiatives that turn our zero-token data engine into the best FPL app.
Each builds on engine + data we already ship, so they're cheap to build and hard
to copy. Monetization (Stripe Pro) is tracked separately and gates the premium
slices of these.

**Build order:** #2 → #1 → #3 → #4 → #5
(retention base first, then matchday engagement, then trust, then depth, then social).

Cross-cutting infra (built in #2, reused everywhere): **PWA install + service
worker + Web Push**, and the per-entry **alerts engine**.

---

## #2 — Smart Alerts & Installable App (PWA push)  ·  *in progress*

**Goal:** bring users back without them opening the app; make TC installable.

**User value:** price rise/fall tonight, injury/status change to *your* players,
deadline reminder, "your captain is a doubt" — pushed to the phone.

**Layers**
- **2a — Alerts Center** (`/[entryId]/alerts`, zero secrets, works now/off-season):
  server-rendered feed from `lib/data/alerts.ts` — deadline countdown, owned-player
  status/injury flags, price movers among the squad (reuses `lib/data/price.ts`),
  captain doubt. Nav link in `DashboardNav`.
- **2b — PWA**: aubergine `manifest.ts` colors, `public/sw.js` (offline shell +
  push handler + notificationclick), `ServiceWorkerRegister` client, install affordance.
- **2c — Web Push** (gated on VAPID env, inert until keys added): `web-push` dep,
  `PushSubscription` model, `/api/push/(un)subscribe`, `lib/push.ts`
  (`isPushConfigured`/`sendPush`), `EnableNotifications` client, `scripts/send-alerts.ts`
  + nightly/AM GitHub Action that computes each subscriber's alerts and pushes.

**Data:** bootstrap `status`/`chance_of_playing_next_round`/transfer counts, entry
picks, next-deadline calc, `lib/data/price.ts`.
**Secrets (user-added):** `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_SUBJECT`.

---

## #1 — Live Gameweek Command Center

**Goal:** own the obsessive matchday refresh loop (the LiveFPL killer).

**User value:** live points, live overall rank estimate, bonus (BPS) projection,
auto-sub preview, captain status, green/red arrow — updating as goals go in.
Effective ownership vs the top 10k / your leagues.

**Data:** `getEventLive` (already fetched), `event` fixtures live state, entry
picks, Brain elite-ownership snapshot, classic-league standings.
**New:** live BPS→bonus projection (deterministic from `stats.bps`), live-rank
estimate model, `LiveCenter` surface on the summary/gameweek page with polling
(or revalidate) during active GWs.
**Effort:** L. **Best landed just before season kickoff** (needs live matches).

---

## #3 — Predicted Lineups & Nailedness Index

**Goal:** kill the most painful FPL mistake — captaining/owning a benched player.

**User value:** per-club predicted XI, rotation risk, a "nailed" score per player,
injury/suspension flags surfaced on your pitch.

**Data:** `HistoricalPlayerSeason` (minutes/starts), live `minutes`, bootstrap
`status` + `chance_of_playing_*`, recent starts streak.
**New:** `lib/data/nailedness.ts` (deterministic start-probability already partly
in `xp.ts startProb` — promote + expose), `PredictedXI` per club, pitch flags.
**Effort:** M. Pairs naturally with #1.

---

## #4 — Season Planner (multi-GW transfer & chip roadmap)

**Goal:** the FPL Review planner — free, on our engine.

**User value:** plan transfers 5–8 GWs ahead over the fixture swing, draft a
wildcard, map the chip calendar, see projected points & hits along the path.

**Data:** `lib/data/xp.ts`, `lib/data/fdr.ts`, `lib/data/optimizer.ts`,
`lib/data/chips.ts`, fixture ticker (planner already has BGW/DGW map).
**New:** multi-GW projection (xP per player per future GW via fixture mult),
a planning UI (drag transfers across a GW grid), cumulative points/hits.
**Effort:** L. Extends the existing planner page.

---

## #5 — Rivals Watch (mini-league intelligence)

**Goal:** the social/viral hook — beating your mates is the real game.

**User value:** live head-to-head vs your mini-league, who's captaining what,
differential ownership, "the 3 players who'd swing the league", template gaps.

**Data:** classic-league standings + each rival's picks (already fetched in
`loadEntryLeagues`), Brain elite patterns, live data, our xP.
**New:** rival-diff engine (squad set-differences + projected swing), a
`RivalsWatch` surface on the leagues page, shareable "gap" card.
**Effort:** M. Leans on league data we already pull.

---

## Honorable mentions (post-5)
- **Engine-grounded AI assistant** — natural-language Q&A answered by our xP +
  narrator, not a hallucinating chatbot. Natural Pro feature.
- **Player deep-dive & comparison** — xG/xA trends, form-vs-fixtures matrix, xP
  history side-by-side.
- **Shareable cards** — generated images (projected XI, rivals gap) for organic
  growth on Twitter/Reddit.
</content>
