# Predictions Feature Plan

## Feasibility: ✅ HIGHLY FEASIBLE

The FPL API provides excellent prediction data that makes this feature very achievable:

### Available Data from FPL API

```json
{
  "ep_next": "7.0",              // ⭐ Expected Points Next GW (FPL's prediction!)
  "ep_this": "7.0",              // Expected Points This GW
  "form": "6.0",                 // Recent form score (last 3-4 GWs)
  "ict_index": "16.5",           // Influence, Creativity, Threat combined
  "now_cost": 57,                // Current price (in 0.1m units, so 5.7m)
  "selected_by_percent": "29.8", // Ownership percentage
  "points_per_game": "5.1",      // Average points per game
  "chance_of_playing_next_round": null, // Injury/availability status
  "minutes": 810,                // Total minutes played
  "element_type": 1,             // Position (GK=1, DEF=2, MID=3, FWD=4)
  "team": 1                      // Team ID
}
```

### Fixture Difficulty (1-5 scale)
```json
{
  "team_h_difficulty": 3,  // Home team difficulty (3 = medium)
  "team_a_difficulty": 4   // Away team difficulty (4 = hard)
}
```

## Feature Breakdown

### 1. Top 3 Captain Picks 👑

**Goal**: Recommend best 3 captain choices from user's current squad

**Algorithm**:
```
1. Get user's current squad (15 players)
2. Filter only starting XI (11 players likely to play)
3. Score each player:
   - Base score: ep_next (FPL's expected points)
   - Bonus: Low fixture difficulty (+0.5 to +2.0 points)
   - Bonus: High form (+0.0 to +1.0 points)
   - Penalty: Injury risk (chance_of_playing < 100%)
4. Sort by final score
5. Return top 3 with reasoning
```

**Display**:
- Player card with photo
- Expected points (ep_next)
- Fixture: [Team Badge] vs [Opponent Badge] (Difficulty: Easy/Medium/Hard)
- Form indicator (🔥 Hot / ➡️ Average / ❄️ Cold)
- Injury status if applicable (⚠️ 75% / 50% / 25%)

**Data Required**:
- ✅ Current picks (`/api/entry/{id}/event/{gw}/picks/`)
- ✅ Bootstrap data (player stats)
- ✅ Next GW fixtures

---

### 2. Predicted Best XI 🎯

**Goal**: Show the optimal 11-player lineup for next gameweek

**Algorithm**:
```
1. Get user's 15-player squad
2. Filter players likely to play (chance_of_playing >= 75%)
3. For each valid formation (e.g., 3-4-3, 4-3-3, 4-4-2, 5-3-2):
   - Pick highest ep_next players per position
   - Calculate total predicted points
4. Return formation with highest total
5. Identify captain (highest ep_next in starting XI)
```

**Valid Formations**:
- 1 GK (always)
- 3-5 DEF
- 2-5 MID (at least 2)
- 1-3 FWD

**Display**:
- Interactive pitch visualization (like GameweekPitchCard)
- Each player shows:
  - Photo + name
  - Predicted points (ep_next)
  - Captain badge on highest scorer
- Total predicted points at top
- Formation display (e.g., "3-5-2")
- Bench below with substitution order

**Data Required**:
- ✅ Current squad
- ✅ Bootstrap data (element_type, ep_next)
- ✅ Next GW fixtures

---

### 3. Top 3 Transfer Suggestions 🔄

**Goal**: Recommend best players to transfer IN, considering user's squad and budget

**Algorithm - Players to Transfer OUT**:
```
1. Get current 15-player squad
2. Score each player negatively:
   - Low ep_next (< 3.0) = candidate for removal
   - Poor form (< 3.0) = candidate
   - Injured (chance_of_playing < 75%) = candidate
   - Not playing (minutes < 200) = candidate
3. Return worst 3 players
```

**Algorithm - Players to Transfer IN**:
```
1. Get all players from bootstrap
2. Filter:
   - NOT in current squad
   - Can afford (now_cost <= available_budget + selling_price)
   - Same position as player being replaced
   - Likely to play (chance_of_playing >= 75%)
3. Score each player:
   - Base: ep_next
   - Bonus: Form rank
   - Bonus: Fixture difficulty (next 3-5 GWs)
   - Consider: Ownership trend (rising vs falling)
4. Return top 3 per position
```

**Display Each Suggestion**:
```
┌─────────────────────────────────────┐
│ OUT: [Player Name] (5.5m)           │
│ 📉 ep_next: 2.5 | Form: ❄️          │
│                                     │
│ IN:  [Player Name] (5.8m)           │
│ 📈 ep_next: 6.2 | Form: 🔥          │
│ Fixtures: ✅ EVE(H) ✅ IPS(A) ⚠️ MCI(H)│
│ Net cost: -0.3m                     │
└─────────────────────────────────────┘
```

**Budget Calculation**:
```typescript
// From entry history
currentValue = history.current[latest].value; // Total squad value in 0.1m
bank = history.current[latest].bank;          // Money in bank in 0.1m
availableBudget = bank / 10; // Convert to millions

// Selling price calculation (FPL rules):
// You get back purchase price OR current price, whichever is lower
// But this requires tracking purchase prices (not in API!)
// Simplification: Use current_price for feasibility
```

**Complexity Notes**:
- ⚠️ FPL API doesn't expose purchase prices
- Solution: Use `now_cost` as approximation
- Edge case: Can't perfectly calculate selling price without purchase history
- Workaround: Show "Estimated cost" with disclaimer

**Data Required**:
- ✅ Current squad + bench
- ✅ All players from bootstrap (2000+ players)
- ✅ Budget (from entry history: `value` and `bank`)
- ✅ Next 3-5 GW fixtures (for each team)

---

## Implementation Plan

### Phase 1: Data Layer (0.5 day)

**Files to create/modify**:
```
lib/fpl/
  predictions.ts         # NEW: Prediction algorithms
  dto.ts                 # ADD: PredictionsDTO types
  service.ts             # ADD: loadPredictions()
```

**New DTOs**:
```typescript
export type CaptainPickDTO = {
  playerId: number;
  playerName: string;
  playerPhoto: string;
  position: string;
  team: string;
  expectedPoints: number;
  form: number;
  fixtureOpponent: string;
  fixtureDifficulty: number; // 1-5
  isHome: boolean;
  chanceOfPlaying: number | null;
  reasoning: string; // e.g., "High expected points (7.5) vs weak opponent"
};

export type PredictedXIDTO = {
  formation: string; // e.g., "3-4-3"
  totalPredictedPoints: number;
  goalkeeper: PlayerPredictionDTO;
  defenders: PlayerPredictionDTO[];
  midfielders: PlayerPredictionDTO[];
  forwards: PlayerPredictionDTO[];
  bench: PlayerPredictionDTO[];
  captain: number; // playerId
};

export type PlayerPredictionDTO = {
  playerId: number;
  playerName: string;
  playerPhoto: string;
  position: string;
  expectedPoints: number;
  fixtureOpponent: string;
  fixtureDifficulty: number;
};

export type TransferSuggestionDTO = {
  playerOut: {
    playerId: number;
    playerName: string;
    playerPhoto: string;
    cost: number; // in millions
    expectedPoints: number;
    form: number;
    reasoning: string; // e.g., "Low expected points and poor form"
  };
  playerIn: {
    playerId: number;
    playerName: string;
    playerPhoto: string;
    cost: number;
    expectedPoints: number;
    form: number;
    upcomingFixtures: Array<{
      opponent: string;
      difficulty: number;
      isHome: boolean;
    }>;
    reasoning: string; // e.g., "High expected points with favorable fixtures"
  };
  netCost: number; // Positive = costs money, Negative = saves money
};

export type PredictionsDTO = {
  nextGameweek: number;
  captainPicks: CaptainPickDTO[];
  predictedXI: PredictedXIDTO;
  transferSuggestions: TransferSuggestionDTO[];
  budgetAvailable: number;
  disclaimer: string; // "Predictions based on FPL's expected points. Actual performance may vary."
};
```

### Phase 2: Prediction Algorithms (0.5 day)

**lib/fpl/predictions.ts**:
```typescript
import type { BootstrapStatic, EntryPicks } from "./schemas";

export function calculateCaptainPicks(
  currentPicks: EntryPicks,
  bootstrap: BootstrapStatic,
  nextGwFixtures: Fixture[],
  nextGw: number
): CaptainPickDTO[] {
  // Implementation
}

export function calculateBestXI(
  currentPicks: EntryPicks,
  bootstrap: BootstrapStatic,
  nextGwFixtures: Fixture[],
): PredictedXIDTO {
  // Implementation
}

export function calculateTransferSuggestions(
  currentPicks: EntryPicks,
  bootstrap: BootstrapStatic,
  upcomingFixtures: Fixture[], // Next 3-5 GWs
  budget: { value: number; bank: number }
): TransferSuggestionDTO[] {
  // Implementation
}
```

### Phase 3: Service Integration (0.25 day)

**lib/fpl/service.ts**:
```typescript
export async function loadPredictions(
  entryIdInput: string | number,
): Promise<PredictionsDTO> {
  const entryId = typeof entryIdInput === "number"
    ? entryIdInput
    : parseEntryId(entryIdInput);

  const [profile, history, bootstrap] = await Promise.all([
    getEntryProfile(entryId),
    getEntryHistory(entryId),
    getBootstrap(),
  ]);

  const nextGw = await resolveNextGameweek(profile.current_event);
  const currentPicks = await getEntryPicks(entryId, nextGw - 1); // Current GW
  const nextGwFixtures = await getFixtures(nextGw);
  const upcomingFixtures = await Promise.all([
    getFixtures(nextGw),
    getFixtures(nextGw + 1),
    getFixtures(nextGw + 2),
  ]);

  const latestHistory = history.current[history.current.length - 1];
  const budget = {
    value: latestHistory.value,
    bank: latestHistory.bank,
  };

  return {
    nextGameweek: nextGw,
    captainPicks: calculateCaptainPicks(currentPicks, bootstrap, nextGwFixtures, nextGw),
    predictedXI: calculateBestXI(currentPicks, bootstrap, nextGwFixtures),
    transferSuggestions: calculateTransferSuggestions(
      currentPicks,
      bootstrap,
      upcomingFixtures.flat(),
      budget
    ),
    budgetAvailable: budget.bank / 10,
    disclaimer: "Predictions based on FPL's expected points algorithm. Actual performance may vary.",
  };
}
```

### Phase 4: UI Components (0.75 day)

**Components to create**:
```
components/
  CaptainPicksCard.tsx        # Top 3 captain recommendations
  PredictedXICard.tsx         # Best XI visualization (reuse pitch layout)
  TransferSuggestionsCard.tsx # Transfer IN/OUT cards
```

**Page**:
```
app/(dashboard)/[entryId]/predictions/page.tsx
```

**Navigation**:
- Add "Predictions" tab to DashboardNav
- Only show if next gameweek hasn't started (hide once GW is live)

### Phase 5: Polish & Edge Cases (0.25 day)

**Edge Cases**:
1. ⚠️ No upcoming gameweek (season ended)
   - Show: "Season completed. No predictions available."

2. ⚠️ Next GW already started
   - Show: "Gameweek in progress. Predictions available after deadline."

3. ⚠️ User hasn't made picks for current GW
   - Show: "Set your team first to see predictions."

4. ⚠️ Budget calculation limitations
   - Add disclaimer about selling price approximations

5. ⚠️ Injured players (chance_of_playing < 100%)
   - Show warning icon and percentage

6. ⚠️ Blank gameweeks / Double gameweeks
   - Handle players with 0 or 2 fixtures

**Loading States**:
- Skeleton cards while calculating
- Suspense boundary for async data

---

## Total Effort Estimate

| Phase | Effort | Priority |
|-------|--------|----------|
| Phase 1: Data Layer | 0.5 day | P0 |
| Phase 2: Algorithms | 0.5 day | P0 |
| Phase 3: Service | 0.25 day | P0 |
| Phase 4: UI Components | 0.75 day | P0 |
| Phase 5: Polish | 0.25 day | P1 |
| **Total** | **2.25 days** | |

---

## Success Criteria

- ✅ User can view top 3 captain picks with reasoning
- ✅ User can see predicted best XI for next gameweek
- ✅ User can browse top 3 transfer suggestions
- ✅ All predictions based on FPL's `ep_next` data
- ✅ Fixture difficulty visualized clearly
- ✅ Form indicators (hot/cold) displayed
- ✅ Injury warnings shown when applicable
- ✅ Budget constraints respected for transfers
- ✅ Responsive on mobile and desktop
- ✅ Loading states and error handling

---

## Future Enhancements (Out of Scope)

- ML-based predictions (train custom model)
- Historical accuracy tracking
- Compare predictions vs actual results
- Differential picks (low ownership, high upside)
- Chip recommendations (Wildcard, Bench Boost, Triple Captain timing)
- Long-term fixture analysis (next 5-10 GWs)

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| FPL's ep_next is inaccurate | Medium | Add disclaimer; show multiple metrics (form, ICT) |
| Budget calculation imperfect | Low | Use approximations; add disclaimer |
| Injuries/rotation unpredictable | Medium | Show chance_of_playing; recommend cautious picks |
| API rate limiting | Low | Use existing caching (bootstrap cached 1h) |
| Double/blank gameweeks | Medium | Handle in algorithm; show "fixture count" |

---

## Dependencies

- ✅ Existing FPL client with caching
- ✅ Bootstrap data (already fetched)
- ✅ Fixtures endpoint (already implemented)
- ✅ Entry picks endpoint (already implemented)
- ✅ Entry history for budget (already implemented)

**No new API endpoints needed!** Everything is available.

---

## Open Questions

1. **Transfer suggestions scope**: Show 3 suggestions per position (12 total) or just top 3 overall?
   - **Recommendation**: Top 3 overall to keep UI simple

2. **Fixture horizon for transfers**: Next 3, 5, or 10 gameweeks?
   - **Recommendation**: Next 3 GWs (balance between short-term and planning)

3. **Multiple transfer scenarios**: Should we suggest multi-transfer strategies?
   - **Recommendation**: V1 = single transfers only. V2 = wildcard scenarios

4. **Captain vice-captain**: Should we also predict vice-captain?
   - **Recommendation**: Yes, show top 3 but highlight #1 as (C) and #2 as (VC)

---

## Ready to Proceed? 🚀

This feature is **production-ready** with ~2.25 days effort. The FPL API provides excellent data quality (they calculate `ep_next` themselves using advanced models).

**Recommend starting with MVP**:
1. Captain picks (highest ROI, easiest to implement)
2. Predicted XI (reuses existing pitch component)
3. Transfer suggestions (most complex, can be V2)

Would you like to proceed with implementation?
