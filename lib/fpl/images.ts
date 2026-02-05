/**
 * FPL image URL utilities for player photos and team badges
 */

const FPL_ASSETS_BASE = "https://resources.premierleague.com/premierleague";

/**
 * Get player photo URL from FPL photo code or player code
 * @param photoCode - Photo code from bootstrap element (e.g., "12345.jpg")
 * @param playerCode - Numeric code for the player
 * @returns Full URL to player photo or null if no code provided
 */
export function getPlayerPhotoUrl(photoCode: string | null, playerCode?: number | null): string | null {
  if (!photoCode && !playerCode) {
    return null;
  }

  const code = photoCode 
    ? photoCode.replace(/\.(jpg|png|jpeg)$/i, "") 
    : playerCode?.toString();

  if (!code) return null;

  // Primary: standard PNG format
  return `https://resources.premierleague.com/premierleague/photos/players/110x140/p${code}.png`;
}

/**
 * Get team badge URL from team ID
 * @param teamId - Team ID from bootstrap element
 * @returns Full URL to team badge or null if no ID provided
 */
export function getTeamBadgeUrl(teamId: number | null): string | null {
  if (!teamId) {
    return null;
  }

  return `${FPL_ASSETS_BASE}/badges/t${teamId}.png`;
}

/**
 * Get shirt/jersey image URL from team code
 * @param teamCode - Team code from bootstrap element
 * @returns Full URL to team shirt or null if no code provided
 */
export function getTeamShirtUrl(teamCode: number | null): string | null {
  if (!teamCode) {
    return null;
  }

  return `${FPL_ASSETS_BASE}/photos/shirts/standard/shirt_${teamCode}-110.png`;
}
