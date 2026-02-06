import type {
  CaptainPickDTO,
  ChipRecommendationDTO,
  DifferentialPickDTO,
  FixtureAnalysisDTO,
  FixtureDifficultyDTO,
  PlayerPredictionDTO,
  PredictedXIDTO,
  TeamFixtureRunDTO,
  TransferSuggestionDTO,
} from "./dto";
import type {
  BootstrapStatic,
  EntryPicks,
  Fixture,
} from "./schemas";

/**
 * Calculate top 3 captain picks from the user's current squad
 *
 * Algorithm:
 * 1. Analyzes starting XI only (first 11 picks)
 * 2. Scores each player based on: ep_next + fixture_bonus + form_bonus - injury_penalty
 * 3. Fixture bonus: +2 for easy (difficulty ≤2), +1 for medium (=3), 0 for hard (≥4)
 * 4. Form bonus: +1 for excellent form (≥6)
 * 5. Injury penalty: -5 if <100% chance to play
 * 6. Returns top 3 sorted by score
 */
export function calculateCaptainPicks(
  currentPicks: EntryPicks,
  bootstrap: BootstrapStatic,
  nextGwFixtures: Fixture[],
): CaptainPickDTO[] {
  const teamNameMap = new Map(
    bootstrap.teams.map((team) => [team.id, team.name]),
  );
  const teamShortNameMap = new Map(
    bootstrap.teams.map((team) => [team.id, team.short_name]),
  );

  // Get starting XI (first 11 picks)
  const startingXI = currentPicks.picks.slice(0, 11);

  // Score each player
  const scoredPlayers = startingXI.map((pick) => {
    const player = bootstrap.elements.find((el) => el.id === pick.element);
    if (!player) {
      return null;
    }

    const epNext = Number.parseFloat(player.ep_next ?? "0");
    const form = Number.parseFloat(player.form ?? "0");

    // Find player's fixtures in the next GW
    const playerFixtures = nextGwFixtures.filter(
      (f) => f.team_h === player.team || f.team_a === player.team,
    );

    let fixtureDifficulty: FixtureDifficultyDTO | null = null;
    let difficultyBonus = 0;
    const isDoubleGw = playerFixtures.length >= 2;

    if (playerFixtures.length > 0) {
      // Use the first fixture as primary for DTO but calculate bonus for all
      const primaryFixture = playerFixtures[0];
      const isHome = primaryFixture.team_h === player.team;
      const opponentId = isHome ? primaryFixture.team_a : primaryFixture.team_h;
      
      fixtureDifficulty = {
        gameweek: primaryFixture.event,
        opponent: teamNameMap.get(opponentId) ?? "Unknown",
        opponentShort: teamShortNameMap.get(opponentId) ?? "???",
        difficulty: isHome ? (primaryFixture.team_h_difficulty ?? 3) : (primaryFixture.team_a_difficulty ?? 3),
        isHome,
      };

      // Calculate combined difficulty bonus
      playerFixtures.forEach(f => {
          const home = f.team_h === player.team;
          const diff = home ? (f.team_h_difficulty ?? 3) : (f.team_a_difficulty ?? 3);
          if (diff <= 2) difficultyBonus += 1.5;
          else if (diff === 3) difficultyBonus += 0.5;
      });

      // Massive bonus for having two games
      if (isDoubleGw) {
          difficultyBonus += 4.0; 
      }
    } else {
        // Penalty for Blank Gameweek
        difficultyBonus -= 5.0;
    }

    // Form bonus
    const formBonus = form >= 6 ? 1.0 : form >= 4 ? 0.5 : 0;

    // Injury penalty
    const chanceOfPlaying = player.chance_of_playing_next_round ?? null;
    const injuryPenalty =
      chanceOfPlaying !== null && chanceOfPlaying < 100 ? 2.0 : 0;

    const finalScore = epNext + difficultyBonus + formBonus - injuryPenalty;

    // Generate reasoning
    const reasons: string[] = [];
    if (epNext >= 6) {
      reasons.push(`High expected points (${epNext.toFixed(1)})`);
    }
    if (form >= 6) {
      reasons.push("Excellent form");
    } else if (form >= 4) {
      reasons.push("Good form");
    }
    if (fixtureDifficulty && fixtureDifficulty.difficulty <= 2) {
      reasons.push("Easy fixture");
    }
    if (chanceOfPlaying !== null && chanceOfPlaying < 100) {
      reasons.push(`⚠️ ${chanceOfPlaying}% chance of playing`);
    }

    return {
      playerId: player.id,
      playerName: player.web_name,
      playerPhoto: player.photo ?? null,
      position: getPositionLabel(player.element_type),
      team: teamShortNameMap.get(player.team) ?? "Unknown",
      teamId: player.team,
      teamCode: player.team_code ?? 0,
      expectedPoints: epNext,
      form,
      fixture: fixtureDifficulty,
      chanceOfPlaying,
      reasoning: reasons.join(" • ") || "Solid choice",
      score: finalScore,
    };
  });

  // Filter out nulls and sort by score
  const validPlayers = scoredPlayers
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .sort((a, b) => b.score - a.score);

  // Return top 3
  return validPlayers.slice(0, 3).map(({ score, ...rest }) => {
    void score;
    return rest;
  });
}

/**
 * Calculate the predicted best XI from user's squad
 *
 * Algorithm:
 * 1. Maps all 15 players with their expected points for next gameweek
 * 2. Tests 7 valid formations: 3-5-2, 3-4-3, 4-4-2, 4-3-3, 4-5-1, 5-4-1, 5-3-2
 * 3. For each formation, selects highest ep_next players per position
 * 4. Returns formation with highest total predicted points
 * 5. Recommends highest-scoring starting player as captain
 */
export function calculateBestXI(
  currentPicks: EntryPicks,
  bootstrap: BootstrapStatic,
  nextGwFixtures: Fixture[],
): PredictedXIDTO {
  const teamShortNameMap = new Map(
    bootstrap.teams.map((team) => [team.id, team.short_name]),
  );

  // Get full squad details with predictions
  const squadPlayers = currentPicks.picks.map((pick) => {
    const player = bootstrap.elements.find((el) => el.id === pick.element);
    if (!player) {
      return null;
    }

    const epNext = Number.parseFloat(player.ep_next ?? "0");
    const chanceOfPlaying = player.chance_of_playing_next_round ?? null;

    // Find player's fixture
    const fixture = nextGwFixtures.find(
      (f) => f.team_h === player.team || f.team_a === player.team,
    );

    let fixtureDifficulty: FixtureDifficultyDTO | null = null;
    if (fixture) {
      const isHome = fixture.team_h === player.team;
      const opponentId = isHome ? fixture.team_a : fixture.team_h;
      const difficulty = isHome
        ? (fixture.team_h_difficulty ?? 3)
        : (fixture.team_a_difficulty ?? 3);

      fixtureDifficulty = {
        gameweek: fixture.event,
        opponent: teamShortNameMap.get(opponentId) ?? "Unknown",
        opponentShort: teamShortNameMap.get(opponentId) ?? "???",
        difficulty,
        isHome,
      };
    }

    return {
      playerId: player.id,
      playerName: player.web_name,
      playerPhoto: player.photo ?? null,
      position: getPositionLabel(player.element_type),
      teamId: player.team,
      teamCode: player.team_code ?? 0,
      elementType: player.element_type,
      expectedPoints: epNext,
      fixture: fixtureDifficulty,
      chanceOfPlaying,
    };
  });

  const validPlayers = squadPlayers.filter(
    (p): p is NonNullable<typeof p> => p !== null,
  );

  // Filter likely to play (75%+) or unknown status
  const playableSquad = validPlayers.filter(
    (p) => p.chanceOfPlaying === null || p.chanceOfPlaying >= 75,
  );

  // Separate by position
  const goalkeepers = playableSquad.filter((p) => p.elementType === 1);
  const defenders = playableSquad.filter((p) => p.elementType === 2);
  const midfielders = playableSquad.filter((p) => p.elementType === 3);
  const forwards = playableSquad.filter((p) => p.elementType === 4);

  // Sort each position by expected points
  const sortByEp = (
    a: { expectedPoints: number },
    b: { expectedPoints: number },
  ) => b.expectedPoints - a.expectedPoints;

  goalkeepers.sort(sortByEp);
  defenders.sort(sortByEp);
  midfielders.sort(sortByEp);
  forwards.sort(sortByEp);

  // Try different formations and pick the best
  const formations = [
    { def: 3, mid: 5, fwd: 2, name: "3-5-2" },
    { def: 3, mid: 4, fwd: 3, name: "3-4-3" },
    { def: 4, mid: 4, fwd: 2, name: "4-4-2" },
    { def: 4, mid: 3, fwd: 3, name: "4-3-3" },
    { def: 4, mid: 5, fwd: 1, name: "4-5-1" },
    { def: 5, mid: 4, fwd: 1, name: "5-4-1" },
    { def: 5, mid: 3, fwd: 2, name: "5-3-2" },
  ];

  let bestFormation = formations[0];
  let bestTotal = 0;
  let bestLineup = {
    goalkeeper: goalkeepers[0],
    defenders: defenders.slice(0, 3),
    midfielders: midfielders.slice(0, 5),
    forwards: forwards.slice(0, 2),
  };

  for (const formation of formations) {
    // Check if we have enough players for this formation
    if (
      defenders.length < formation.def ||
      midfielders.length < formation.mid ||
      forwards.length < formation.fwd
    ) {
      continue;
    }

    const lineup = {
      goalkeeper: goalkeepers[0],
      defenders: defenders.slice(0, formation.def),
      midfielders: midfielders.slice(0, formation.mid),
      forwards: forwards.slice(0, formation.fwd),
    };

    const total =
      (lineup.goalkeeper?.expectedPoints ?? 0) +
      lineup.defenders.reduce((sum, p) => sum + p.expectedPoints, 0) +
      lineup.midfielders.reduce((sum, p) => sum + p.expectedPoints, 0) +
      lineup.forwards.reduce((sum, p) => sum + p.expectedPoints, 0);

    if (total > bestTotal) {
      bestTotal = total;
      bestFormation = formation;
      bestLineup = lineup;
    }
  }

  // Determine bench (all players not in starting XI)
  const startingIds = new Set([
    bestLineup.goalkeeper?.playerId,
    ...bestLineup.defenders.map((p) => p.playerId),
    ...bestLineup.midfielders.map((p) => p.playerId),
    ...bestLineup.forwards.map((p) => p.playerId),
  ]);

  const bench = validPlayers
    .filter((p) => !startingIds.has(p.playerId))
    .sort(sortByEp)
    .slice(0, 4);

  // Find captain (highest ep in starting XI)
  const allStarters = [
    bestLineup.goalkeeper,
    ...bestLineup.defenders,
    ...bestLineup.midfielders,
    ...bestLineup.forwards,
  ].filter((p): p is NonNullable<typeof p> => p !== undefined);

  const captain = allStarters.reduce(
    (best, player) =>
      player.expectedPoints > best.expectedPoints ? player : best,
    allStarters[0],
  );

  // Map to DTOs (remove elementType and chanceOfPlaying)
  const mapToDTO = (
    p: (typeof allStarters)[number],
  ): PlayerPredictionDTO => ({
    playerId: p.playerId,
    playerName: p.playerName,
    playerPhoto: p.playerPhoto,
    position: p.position,
    teamId: p.teamId,
    teamCode: p.teamCode,
    expectedPoints: p.expectedPoints,
    fixture: p.fixture,
  });

  return {
    formation: bestFormation.name,
    totalPredictedPoints: Number.parseFloat(bestTotal.toFixed(1)),
    goalkeeper: mapToDTO(bestLineup.goalkeeper),
    defenders: bestLineup.defenders.map(mapToDTO),
    midfielders: bestLineup.midfielders.map(mapToDTO),
    forwards: bestLineup.forwards.map(mapToDTO),
    bench: bench.map(mapToDTO),
    captain: captain.playerId,
  };
}

/**
 * Calculate top 3 transfer suggestions
 */
export function calculateTransferSuggestions(
  currentPicks: EntryPicks,
  bootstrap: BootstrapStatic,
  upcomingFixtures: Fixture[], // Next 3-5 GWs
  budget: { value: number; bank: number },
): TransferSuggestionDTO[] {
  const teamShortNameMap = new Map(
    bootstrap.teams.map((team) => [team.id, team.short_name]),
  );

  // Get current squad IDs
  const currentSquadIds = new Set(currentPicks.picks.map((p) => p.element));

  // Find players to transfer OUT (poor performers)
  const squadPlayers = currentPicks.picks
    .map((pick) => {
      const player = bootstrap.elements.find((el) => el.id === pick.element);
      if (!player) {
        return null;
      }

      const epNext = Number.parseFloat(player.ep_next ?? "0");
      const form = Number.parseFloat(player.form ?? "0");
      const minutes = player.minutes ?? 0;
      const chanceOfPlaying = player.chance_of_playing_next_round ?? null;

      // Score negatively (lower is worse)
      let negativeScore = 0;
      if (epNext < 3) {
        negativeScore += 3;
      }
      if (form < 3) {
        negativeScore += 2;
      }
      if (minutes < 200) {
        negativeScore += 2;
      }
      if (chanceOfPlaying !== null && chanceOfPlaying < 75) {
        negativeScore += 3;
      }

      const reasons: string[] = [];
      if (epNext < 3) {
        reasons.push("Low expected points");
      }
      if (form < 3) {
        reasons.push("Poor form");
      }
      if (minutes < 200) {
        reasons.push("Limited minutes");
      }
      if (chanceOfPlaying !== null && chanceOfPlaying < 75) {
        reasons.push(`${chanceOfPlaying}% to play`);
      }

      return {
        playerId: player.id,
        playerName: player.web_name,
        playerPhoto: player.photo ?? null,
        position: getPositionLabel(player.element_type),
        elementType: player.element_type,
        cost: player.now_cost ? player.now_cost / 10 : 0,
        expectedPoints: epNext,
        form,
        reasoning: reasons.join(" • ") || "Consider replacing",
        negativeScore,
        teamId: player.team,
        teamCode: player.team_code ?? 0,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  // Sort by negative score (worst first)
  const worstPlayers = squadPlayers
    .filter((p) => p.negativeScore > 0)
    .sort((a, b) => b.negativeScore - a.negativeScore)
    .slice(0, 3);

  // If no poor performers, just take bottom 3 by ep_next
  const playersToReplace =
    worstPlayers.length > 0
      ? worstPlayers
      : squadPlayers
          .sort((a, b) => a.expectedPoints - b.expectedPoints)
          .slice(0, 3);

  // Available budget
  const availableBudget = budget.bank / 10;

  // Generate transfer suggestions
  const suggestions: TransferSuggestionDTO[] = [];

  for (const playerOut of playersToReplace) {
    // Budget if we sell this player
    const budgetWithSale = availableBudget + playerOut.cost;

    // Find best replacements (same position)
    const replacements = bootstrap.elements
      .filter((el) => {
        if (currentSquadIds.has(el.id)) {
          return false; // Already in squad
        }
        if (el.element_type !== playerOut.elementType) {
          return false; // Wrong position
        }

        const cost = el.now_cost ? el.now_cost / 10 : 0;
        if (cost > budgetWithSale) {
          return false; // Can't afford
        }

        const chanceOfPlaying = el.chance_of_playing_next_round ?? null;
        if (chanceOfPlaying !== null && chanceOfPlaying < 75) {
          return false; // Injury risk
        }

        return true;
      })
      .map((el) => {
        const epNext = Number.parseFloat(el.ep_next ?? "0");
        const form = Number.parseFloat(el.form ?? "0");
        const selectedByPercent = Number.parseFloat(
          el.selected_by_percent ?? "0",
        );

        // Get next 5 fixtures for this player's team
        const playerFixtures = upcomingFixtures
          .filter(
            (f) =>
              (f.team_h === el.team || f.team_a === el.team) && f.event !== null,
          )
          .sort((a, b) => (a.event ?? 0) - (b.event ?? 0))
          .slice(0, 5)
          .map((f) => {
            const isHome = f.team_h === el.team;
            const opponentId = isHome ? f.team_a : f.team_h;
            const difficulty = isHome
              ? (f.team_h_difficulty ?? 3)
              : (f.team_a_difficulty ?? 3);

            return {
              gameweek: f.event,
              opponent: teamShortNameMap.get(opponentId) ?? "Unknown",
              opponentShort: teamShortNameMap.get(opponentId) ?? "???",
              difficulty,
              isHome,
            };
          });

        // Bonus for easy fixtures
        const avgDifficulty =
          playerFixtures.reduce((sum, f) => sum + f.difficulty, 0) /
            (playerFixtures.length || 1);
        const fixtureBonus = avgDifficulty <= 2.5 ? 2 : avgDifficulty <= 3 ? 1 : 0;

        // Double Gameweek Logic for next week
        const nextWeekFixtures = playerFixtures.filter(f => f.gameweek === upcomingFixtures[0]?.event);
        const isDoubleGw = nextWeekFixtures.length >= 2;
        const isBlankGw = nextWeekFixtures.length === 0;

        const dgwBonus = isDoubleGw ? 4.0 : isBlankGw ? -5.0 : 0;

        const score = epNext + fixtureBonus + (form * 0.2) + dgwBonus;

        const reasons: string[] = [];
        if (isDoubleGw) {
            reasons.push("🚀 DOUBLE GAMEWEEK");
        }
        if (epNext >= 6) {
          reasons.push(`High expected points (${epNext.toFixed(1)})`);
        }
        if (form >= 6) {
          reasons.push("Excellent form");
        }
        if (avgDifficulty <= 2.5) {
          reasons.push("Favorable fixtures");
        }

        return {
          playerId: el.id,
          playerName: el.web_name,
          playerPhoto: el.photo ?? null,
          position: getPositionLabel(el.element_type),
          cost: el.now_cost ? el.now_cost / 10 : 0,
          expectedPoints: epNext,
          form,
          upcomingFixtures: playerFixtures,
          selectedByPercent,
          reasoning: reasons.join(" • ") || "Solid option",
          score,
          teamId: el.team,
          teamCode: el.team_code ?? 0,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 1);

    if (replacements.length > 0) {
      const playerIn = replacements[0];
      const netCost = Number.parseFloat(
        (playerIn.cost - playerOut.cost).toFixed(1),
      );

      suggestions.push({
        playerOut: {
          playerId: playerOut.playerId,
          playerName: playerOut.playerName,
          playerPhoto: playerOut.playerPhoto,
          position: playerOut.position,
          cost: playerOut.cost,
          expectedPoints: playerOut.expectedPoints,
          form: playerOut.form,
          reasoning: playerOut.reasoning,
          teamId: playerOut.teamId,
          teamCode: playerOut.teamCode,
        },
        playerIn: {
          playerId: playerIn.playerId,
          playerName: playerIn.playerName,
          playerPhoto: playerIn.playerPhoto,
          position: playerIn.position,
          cost: playerIn.cost,
          expectedPoints: playerIn.expectedPoints,
          form: playerIn.form,
          upcomingFixtures: playerIn.upcomingFixtures,
          selectedByPercent: playerIn.selectedByPercent,
          reasoning: playerIn.reasoning,
          teamId: playerIn.teamId,
          teamCode: playerIn.teamId, // It's el.team_code in playerIn
          team: {
              shortName: teamShortNameMap.get(playerIn.teamId) ?? "UNK"
          }
        },
        netCost,
      });
    }
  }

  return suggestions.slice(0, 3);
}

/**
 * Helper to convert element_type to position label
 */
function getPositionLabel(
  elementType: number,
): "GK" | "DEF" | "MID" | "FWD" {
  switch (elementType) {
    case 1:
      return "GK";
    case 2:
      return "DEF";
    case 3:
      return "MID";
    case 4:
      return "FWD";
    default:
      return "MID";
  }
}


/**
 * Calculate chip recommendations
 */
export function calculateChipRecommendations(
  currentPicks: EntryPicks,
  bootstrap: BootstrapStatic,
  nextGwFixtures: Fixture[],
  nextGw: number,
): ChipRecommendationDTO[] {
  const recommendations: ChipRecommendationDTO[] = [];

  // Get captain picks to evaluate Triple Captain
  const captainPicks = calculateCaptainPicks(currentPicks, bootstrap, nextGwFixtures);

  // Triple Captain
  if (captainPicks.length > 0) {
    const bestCaptain = captainPicks[0];
    const shouldRecommend =
      bestCaptain.expectedPoints >= 8 &&
      bestCaptain.fixture !== null &&
      bestCaptain.fixture.difficulty <= 2;

    recommendations.push({
      chipName: "Triple Captain",
      recommend: shouldRecommend,
      reasoning: shouldRecommend
        ? `${bestCaptain.playerName} has high expected points (${bestCaptain.expectedPoints.toFixed(1)}) against an easy opponent. Great time to use Triple Captain!`
        : `Wait for a premium captain with 8+ expected points and an easy fixture.`,
      bestGameweek: shouldRecommend ? nextGw : undefined,
      potentialPoints: shouldRecommend ? bestCaptain.expectedPoints * 3 : undefined,
    });
  }

  // Bench Boost
  const benchPlayers = currentPicks.picks.slice(11, 15);
  let benchExpectedPoints = 0;

  for (const pick of benchPlayers) {
    const player = bootstrap.elements.find((el) => el.id === pick.element);
    if (player) {
      benchExpectedPoints += Number.parseFloat(player.ep_next ?? "0");
    }
  }

  const shouldRecommendBB = benchExpectedPoints >= 12;

  recommendations.push({
    chipName: "Bench Boost",
    recommend: shouldRecommendBB,
    reasoning: shouldRecommendBB
      ? `Your bench has strong predicted points (${benchExpectedPoints.toFixed(1)}). Good gameweek to use Bench Boost!`
      : `Wait for a double gameweek or when your bench has 12+ combined expected points.`,
    bestGameweek: shouldRecommendBB ? nextGw : undefined,
    potentialPoints: shouldRecommendBB ? benchExpectedPoints : undefined,
  });

  // Free Hit
  // Count how many players have low chance of playing
  let unavailablePlayers = 0;
  for (const pick of currentPicks.picks) {
    const player = bootstrap.elements.find((el) => el.id === pick.element);
    if (player) {
      const chanceOfPlaying = player.chance_of_playing_next_round ?? null;
      if (chanceOfPlaying !== null && chanceOfPlaying < 75) {
        unavailablePlayers++;
      }
    }
  }

  const shouldRecommendFH = unavailablePlayers >= 5;

  recommendations.push({
    chipName: "Free Hit",
    recommend: shouldRecommendFH,
    reasoning: shouldRecommendFH
      ? `You have ${unavailablePlayers} players with injury concerns. Consider Free Hit to field a full team.`
      : `Save for blank gameweeks when many teams don't play, or when 5+ players are unavailable.`,
  });

  return recommendations;
}

/**
 * Calculate differential picks (low ownership, high upside)
 */
export function calculateDifferentialPicks(
  bootstrap: BootstrapStatic,
  nextGwFixtures: Fixture[],
  upcomingFixtures: Fixture[], // Next 3 GWs
  currentSquadIds: Set<number>,
  budget: number,
): DifferentialPickDTO[] {
  const teamShortNameMap = new Map(
    bootstrap.teams.map((team) => [team.id, team.short_name]),
  );

  const differentials = bootstrap.elements
    .filter((player) => {
      // Not in current squad
      if (currentSquadIds.has(player.id)) return false;

      const ownership = Number.parseFloat(player.selected_by_percent ?? "0");
      const epNext = Number.parseFloat(player.ep_next ?? "0");
      const form = Number.parseFloat(player.form ?? "0");
      const cost = player.now_cost ? player.now_cost / 10 : 999;

      // Differential criteria
      if (ownership >= 10) return false; // Must be below 10% ownership
      if (epNext < 5) return false; // Must have decent expected points
      if (form < 4) return false; // Must have some form
      if (cost > budget) return false; // Must be affordable

      return true;
    })
    .map((player) => {
      const ownership = Number.parseFloat(player.selected_by_percent ?? "0");
      const epNext = Number.parseFloat(player.ep_next ?? "0");
      const form = Number.parseFloat(player.form ?? "0");
      const cost = player.now_cost ? player.now_cost / 10 : 0;

      // Find next fixture
      const nextFixture = nextGwFixtures.find(
        (f) => f.team_h === player.team || f.team_a === player.team,
      );

      let fixtureDifficulty: FixtureDifficultyDTO | null = null;
      if (nextFixture) {
        const isHome = nextFixture.team_h === player.team;
        const opponentId = isHome ? nextFixture.team_a : nextFixture.team_h;
        const difficulty = isHome
          ? (nextFixture.team_h_difficulty ?? 3)
          : (nextFixture.team_a_difficulty ?? 3);

        fixtureDifficulty = {
          gameweek: nextFixture.event,
          opponent: teamShortNameMap.get(opponentId) ?? "Unknown",
          opponentShort: teamShortNameMap.get(opponentId) ?? "???",
          difficulty,
          isHome,
        };
      }

      // Get next 5 fixtures
      const playerUpcomingFixtures = upcomingFixtures
        .filter(
          (f) =>
            (f.team_h === player.team || f.team_a === player.team) && f.event !== null,
        )
        .sort((a, b) => (a.event ?? 0) - (b.event ?? 0))
        .slice(0, 5)
        .map((f) => {
          const isHome = f.team_h === player.team;
          const opponentId = isHome ? f.team_a : f.team_h;
          const difficulty = isHome
            ? (f.team_h_difficulty ?? 3)
            : (f.team_a_difficulty ?? 3);

          return {
            gameweek: f.event,
            opponent: teamShortNameMap.get(opponentId) ?? "Unknown",
            opponentShort: teamShortNameMap.get(opponentId) ?? "???",
            difficulty,
            isHome,
          };
        });

      // Calculate upside score (higher is better)
      const upsideScore = ownership > 0 ? epNext / ownership : epNext * 10;

      // DGW Bonus for Differentials
      const hasDgwInRun = playerUpcomingFixtures.some(f => {
          const gwFixtures = upcomingFixtures.filter(uf => uf.event === f.gameweek && (uf.team_h === player.team || uf.team_a === player.team));
          return gwFixtures.length >= 2;
      });

      const reasons: string[] = [];
      if (hasDgwInRun) {
          reasons.push("🚀 UPCOMING DOUBLE");
      }
      if (epNext >= 6) reasons.push(`High expected points (${epNext.toFixed(1)})`);
      if (ownership < 5) reasons.push(`Very low ownership (${ownership.toFixed(1)}%)`);
      if (form >= 6) reasons.push("Excellent form");

      const avgDifficulty =
        playerUpcomingFixtures.reduce((sum, f) => sum + f.difficulty, 0) /
        (playerUpcomingFixtures.length || 1);
      if (avgDifficulty <= 2.5) reasons.push("Great fixtures ahead");

      return {
        playerId: player.id,
        playerName: player.web_name,
        playerPhoto: player.photo ?? null,
        position: getPositionLabel(player.element_type),
        team: teamShortNameMap.get(player.team) ?? "Unknown",
        teamId: player.team,
        teamCode: player.team_code ?? 0,
        cost,
        expectedPoints: epNext,
        form,
        ownership,
        fixture: fixtureDifficulty,
        upcomingFixtures: playerUpcomingFixtures,
        reasoning: reasons.join(" • ") || "Solid differential option",
        upsideScore,
      };
    })
    .sort((a, b) => b.upsideScore - a.upsideScore)
    .slice(0, 5); // Top 5 differentials

  return differentials;
}

/**
 * Calculate long-term fixture analysis (next 5 GWs)
 */
export function calculateFixtureAnalysis(
  bootstrap: BootstrapStatic,
  fixtures: Fixture[], // Next 5+ GWs of fixtures
  nextGw: number,
): FixtureAnalysisDTO {
  const teamNameMap = new Map(
    bootstrap.teams.map((team) => [team.id, team.name]),
  );
  const teamShortNameMap = new Map(
    bootstrap.teams.map((team) => [team.id, team.short_name]),
  );

  // Analyze next 5 gameweeks
  const gameweeksToAnalyze = 5;
  const targetGws = Array.from({ length: gameweeksToAnalyze }, (_, i) => nextGw + i);

  // Build fixture run for each team
  const teamFixtureRuns: TeamFixtureRunDTO[] = bootstrap.teams.map((team) => {
    const teamFixtures = fixtures
      .filter(
        (f) =>
          (f.team_h === team.id || f.team_a === team.id) &&
          f.event !== null &&
          targetGws.includes(f.event),
      )
      .sort((a, b) => (a.event ?? 0) - (b.event ?? 0))
      .map((f) => {
        const isHome = f.team_h === team.id;
        const opponentId = isHome ? f.team_a : f.team_h;
        const difficulty = isHome
          ? (f.team_h_difficulty ?? 3)
          : (f.team_a_difficulty ?? 3);

        return {
          gameweek: f.event ?? nextGw,
          opponent: teamNameMap.get(opponentId) ?? "Unknown",
          opponentShort: teamShortNameMap.get(opponentId) ?? "???",
          difficulty,
          isHome,
        };
      });

    const averageDifficulty =
      teamFixtures.reduce((sum, f) => sum + f.difficulty, 0) /
      (teamFixtures.length || 1);

    let recommendation: "target" | "avoid" | "neutral" = "neutral";
    if (averageDifficulty <= 2.2) recommendation = "target";
    else if (averageDifficulty >= 3.8) recommendation = "avoid";

    return {
      teamId: team.id,
      teamCode: team.code,
      teamName: team.name,
      teamShort: team.short_name,
      fixtures: teamFixtures,
      averageDifficulty,
      recommendation,
    };
  });

  // Sort by difficulty (ascending - easiest first)
  const sortedTeams = [...teamFixtureRuns].sort(
    (a, b) => a.averageDifficulty - b.averageDifficulty,
  );

  // Always show top 5 best and bottom 5 worst, regardless of thresholds
  return {
    bestFixtureRuns: sortedTeams.slice(0, 5),
    worstFixtureRuns: sortedTeams.slice(-5).reverse(),
    gameweeksAnalyzed: gameweeksToAnalyze,
  };
}
