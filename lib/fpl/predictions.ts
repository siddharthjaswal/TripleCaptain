import type {
  CaptainPickDTO,
  FixtureDifficultyDTO,
  PlayerPredictionDTO,
  PredictedXIDTO,
  TransferSuggestionDTO,
} from "./dto";
import type {
  BootstrapElement,
  BootstrapStatic,
  EntryPicks,
  Fixture,
} from "./schemas";

/**
 * Calculate top 3 captain picks from the user's current squad
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

    // Find player's fixture
    const fixture = nextGwFixtures.find(
      (f) => f.team_h === player.team || f.team_a === player.team,
    );

    let fixtureDifficulty: FixtureDifficultyDTO | null = null;
    let difficultyBonus = 0;

    if (fixture) {
      const isHome = fixture.team_h === player.team;
      const opponentId = isHome ? fixture.team_a : fixture.team_h;
      const difficulty = isHome
        ? (fixture.team_h_difficulty ?? 3)
        : (fixture.team_a_difficulty ?? 3);

      fixtureDifficulty = {
        opponent: teamNameMap.get(opponentId) ?? "Unknown",
        opponentShort: teamShortNameMap.get(opponentId) ?? "???",
        difficulty,
        isHome,
      };

      // Bonus for easy fixtures
      if (difficulty <= 2) {
        difficultyBonus = 1.5;
      } else if (difficulty === 3) {
        difficultyBonus = 0.5;
      }
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
  return validPlayers.slice(0, 3).map(({ score, ...rest }) => rest);
}

/**
 * Calculate the predicted best XI from user's squad
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

        // Get next 3 fixtures for this player's team
        const playerFixtures = upcomingFixtures
          .filter(
            (f) =>
              (f.team_h === el.team || f.team_a === el.team) && f.event !== null,
          )
          .sort((a, b) => (a.event ?? 0) - (b.event ?? 0))
          .slice(0, 3)
          .map((f) => {
            const isHome = f.team_h === el.team;
            const opponentId = isHome ? f.team_a : f.team_h;
            const difficulty = isHome
              ? (f.team_h_difficulty ?? 3)
              : (f.team_a_difficulty ?? 3);

            return {
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

        const score = epNext + fixtureBonus + form * 0.2;

        const reasons: string[] = [];
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
