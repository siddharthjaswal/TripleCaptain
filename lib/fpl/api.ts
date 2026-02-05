const API_BASE = "https://fantasy.premierleague.com/api";

export async function fetchFromFpl(path: string) {
    const response = await fetch(`${API_BASE}${path}`, {
        headers: {
            "User-Agent": "triple-captain-app/0.1",
            Accept: "application/json",
        },
    });
    if (!response.ok) throw new Error(`FPL request failed: ${response.status}`);
    return response.json();
}

export async function getEntryPicks(entryId: number, event: number) {
    return fetchFromFpl(`/entry/${entryId}/event/${event}/picks/`);
}
