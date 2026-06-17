import type { AuditFacts } from "./data/types";

/**
 * The Triple Captain TEMPLATED NARRATOR — turns pre-digested engine facts into
 * cheeky-English-football-manager prose ("The Gaffer" / "Chief Scout" voice)
 * with ZERO AI. Pure string assembly over synonym pools, seeded by a stable
 * hash of the inputs so the same facts always yield the same words while
 * different facts vary the phrasing.
 *
 * Determinism contract:
 *  - No Math.random, no Date.now, no I/O. Same input => byte-identical output.
 *  - Phrasing variety comes from a mulberry32 PRNG seeded by a string hash of
 *    the salient facts (names, percentages), not from randomness.
 *
 * Off-season safety:
 *  - Empty / zeroed facts degrade to sensible neutral prose, never throw.
 */

// ---------- Seeded PRNG (inline, no deps) ----------

/** xmur3-style string hash → 32-bit unsigned seed. Deterministic. */
function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/** mulberry32: tiny deterministic PRNG, returns a function yielding [0,1). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A seeded picker: choose from a pool deterministically; advances internal state. */
function makePicker(seedStr: string): <T>(pool: readonly T[]) => T {
  const rnd = mulberry32(hashSeed(seedStr));
  return <T>(pool: readonly T[]): T => {
    if (pool.length === 0) throw new Error("empty pool"); // pools below are never empty
    return pool[Math.floor(rnd() * pool.length) % pool.length];
  };
}

// ---------- Number / phrasing helpers ----------

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function pctText(n: number): string {
  return `${Math.round(n)}%`;
}

/** Join names like "Salah, Saka and Palmer" (Oxford-free, manager-speak). */
function listNames(names: string[]): string {
  const clean = names.filter((n) => n && n.trim().length > 0);
  if (clean.length === 0) return "";
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} and ${clean[1]}`;
  return `${clean.slice(0, -1).join(", ")} and ${clean[clean.length - 1]}`;
}

function capitalise(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}

// ---------- Public micro-helpers ----------

/**
 * Describe a player's form figure in manager slang. Deterministic buckets.
 */
export function formWord(form: number): string {
  if (!Number.isFinite(form) || form <= 0) return "ice cold";
  if (form < 2) return "out of sorts";
  if (form < 3.5) return "ticking over";
  if (form < 5) return "in decent nick";
  if (form < 6.5) return "flying";
  if (form < 8) return "on fire";
  return "absolutely unplayable";
}

/**
 * Turn a 1-5 FDR (1 = easiest) into a short fixture phrase. Undefined / out of
 * range (off-season, no fixtures) → a neutral "no fixtures locked in" line.
 */
export function fixturePhrase(fdr?: number): string {
  if (fdr === undefined || !Number.isFinite(fdr)) return "no fixtures locked in just yet";
  if (fdr <= 1.5) return "a dream run of fixtures";
  if (fdr <= 2.5) return "a kind set of games";
  if (fdr <= 3.4) return "a fair, middling schedule";
  if (fdr <= 4.3) return "a tough run ahead";
  return "a proper minefield of a schedule";
}

// ---------- narrateAudit ----------

const HEALTH_OPENERS_GOOD = [
  "Right, sit down — I've had a good look at this squad and I rather like what I see.",
  "Listen up. This is a tidy little outfit you've put together, and no mistake.",
  "I'll be honest with you — this team's in good shape. We're cooking.",
  "Cup of tea in hand, I went through your XI, and you'll be pleased: it's a strong unit.",
] as const;

const HEALTH_OPENERS_MID = [
  "Right then, gather round. The squad's solid enough, but there's work to do.",
  "Let's not kid ourselves — there's a decent team here, but it's far from finished.",
  "I've studied the team sheet. Promising bones, a few rough edges to sand down.",
  "Sit tight. This XI's got legs, though I'd not be popping the champagne yet.",
] as const;

const HEALTH_OPENERS_POOR = [
  "Right, I'm not going to sugar-coat it — this lot needs a serious look at.",
  "Sit down, this won't take long. The squad's wobbling and we both know it.",
  "Bluntly? There are holes in this team you could drive a team bus through.",
  "I've seen the team sheet and, well, we've got our work cut out.",
] as const;

const STRONGEST_LINES = [
  (names: string) => `${names} are carrying us — proper bankers, the lot of them.`,
  (names: string) => `The engine room's humming: ${names} are pulling their weight and then some.`,
  (names: string) => `Up top of the ratings it's ${names} — keep 'em, build round 'em.`,
  (names: string) => `${names} are the spine of this side. Don't you dare ship them out.`,
] as const;

const WEAKEST_LINES = [
  (names: string) => `${names}, on the other hand, are giving me sleepless nights.`,
  (names: string) => `My worry is ${names} — they're dragging the average down.`,
  (names: string) => `${names} are the weak links. Passengers, frankly.`,
  (names: string) => `If I'm pointing fingers, it's at ${names}. Not earning their corn.`,
] as const;

const ALIGN_HIGH = [
  (p: string) => `You're bang on the template — ${p} aligned with the elite. Safe as houses.`,
  (p: string) => `${p} template alignment: you're shoulder-to-shoulder with the best in the game.`,
  (p: string) => `Template-wise you're right in the mix at ${p}. The crowd can't get an edge on you.`,
] as const;

const ALIGN_MID = [
  (p: string) => `${p} aligned to the elite template — respectable, but you're leaving differentials on the table.`,
  (p: string) => `You sit at ${p} template alignment. Half-templated, half-maverick. Pick a lane.`,
  (p: string) => `${p} in step with the elite. Fine, though there's room to either conform or gamble.`,
] as const;

const ALIGN_LOW = [
  (p: string) => `Only ${p} aligned to the template — brave, possibly daft. You're going your own way.`,
  (p: string) => `${p} template alignment is low. Either you're a genius or you're about to find out the hard way.`,
  (p: string) => `At ${p} you're miles off the template. High risk, high reward — don't say I didn't warn you.`,
] as const;

/**
 * Narrate a full squad audit in Gaffer voice. Grounded ONLY in the supplied
 * facts. Returns a short multi-paragraph critique plus 3-5 actionable lines.
 */
export function narrateAudit(facts: AuditFacts): { critique: string; recommendations: string[] } {
  const seedKey = [
    facts.teamName ?? "",
    round1(facts.avgScore),
    Math.round(facts.healthScore),
    Math.round(facts.templateAlignmentPct),
    facts.eliteCaptain?.name ?? "",
    ...facts.strongest.map((s) => s.name),
    ...facts.weakest.map((w) => w.name),
  ].join("|");
  const pick = makePicker(`audit:${seedKey}`);

  const health = Number.isFinite(facts.healthScore) ? facts.healthScore : 50;
  const teamRef = facts.teamName && facts.teamName.trim().length > 0 ? `${facts.teamName}` : "the squad";

  // --- Paragraph 1: opener + headline health ---
  const opener =
    health >= 70 ? pick(HEALTH_OPENERS_GOOD) : health >= 45 ? pick(HEALTH_OPENERS_MID) : pick(HEALTH_OPENERS_POOR);
  const avgLine =
    facts.avgScore > 0
      ? ` ${capitalise(teamRef)} averages a ${round1(facts.avgScore)} engine rating across the XI` +
        (health > 0 ? `, health sitting at ${Math.round(health)}/100.` : ".")
      : ` Not much to grade yet — ${teamRef} is light on data, so I'll keep my powder dry.`;
  const para1 = `${opener}${avgLine}`;

  // --- Paragraph 2: strongest / weakest ---
  const strongNames = listNames(facts.strongest.slice(0, 3).map((s) => s.name));
  const weakNames = listNames(facts.weakest.slice(0, 2).map((w) => w.name));
  const parts2: string[] = [];
  if (strongNames) parts2.push(pick(STRONGEST_LINES)(strongNames));
  if (weakNames) parts2.push(pick(WEAKEST_LINES)(weakNames));
  if (parts2.length === 0)
    parts2.push("Hard to single anyone out — the ratings are bunched and the data's thin. Off-season, eh?");
  const para2 = parts2.join(" ");

  // --- Paragraph 3: template + captaincy ---
  const align = Math.round(facts.templateAlignmentPct);
  const alignText =
    align >= 70 ? pick(ALIGN_HIGH)(pctText(align)) : align >= 40 ? pick(ALIGN_MID)(pctText(align)) : pick(ALIGN_LOW)(pctText(align));
  const capParts: string[] = [alignText];
  if (facts.eliteCaptain) {
    const eliteCapPct = pctText(facts.eliteCaptain.captainPct);
    if (facts.userCaptainEliteCapPct >= facts.eliteCaptain.captainPct - 5) {
      capParts.push(
        `On the armband you're spot on — ${facts.eliteCaptain.name} is where the smart money's gone (${eliteCapPct} of the elite).`,
      );
    } else if (facts.userCaptainEliteCapPct > 0) {
      capParts.push(
        `Your captain's a bit off the pace — the elite are loading the armband onto ${facts.eliteCaptain.name} (${eliteCapPct}). Worth a think.`,
      );
    } else {
      capParts.push(
        `If you want the safe armband, the elite are piling onto ${facts.eliteCaptain.name} (${eliteCapPct} captaincy).`,
      );
    }
  }
  const para3 = capParts.join(" ");

  const critique = [para1, para2, para3].filter((p) => p.trim().length > 0).join("\n\n");

  // --- Recommendations (3-5 actionable lines) ---
  const recs: string[] = [];
  if (facts.missingTemplate.length > 0) {
    const top = facts.missingTemplate[0];
    recs.push(
      `Get ${top.name} in — ${pctText(top.elitePct)} of the elite own him and you don't. That's a gap waiting to bite.`,
    );
    if (facts.missingTemplate.length > 1) {
      const rest = listNames(facts.missingTemplate.slice(1, 3).map((m) => m.name));
      if (rest) recs.push(`Keep an eye on ${rest} too — the template's drifting that way.`);
    }
  }
  if (facts.weakest.length > 0) {
    const w = facts.weakest[0];
    recs.push(`Cash in on ${w.name} (rating ${round1(w.score)}) before the rest of the league does. Dead weight.`);
  }
  if (facts.eliteCaptain && facts.userCaptainEliteCapPct < facts.eliteCaptain.captainPct - 5) {
    recs.push(`Strongly consider the armband on ${facts.eliteCaptain.name} this week — the elite aren't wrong often.`);
  }
  if (align < 40) {
    recs.push("You're well off-template — fine if it's deliberate, but make sure those punts are paying rent.");
  } else if (align >= 70 && facts.weakest.length === 0) {
    recs.push("You're heavily templated — find one differential to leapfrog your mini-league rivals.");
  }
  if (facts.strongest.length > 0) {
    recs.push(`Build round ${facts.strongest[0].name} — that's your foundation, don't tinker with it.`);
  }
  // Guarantee 3-5 lines even in sparse off-season data.
  if (recs.length === 0) {
    recs.push("Not much to action yet — fixtures are off, so hold steady and bank your free transfers.");
    recs.push("Revisit once the new season's fixtures drop and the elite snapshot refreshes.");
    recs.push("Keep your team value healthy — don't take needless hits in the dead weeks.");
  }
  while (recs.length < 3) {
    recs.push("Stay patient, trust the process, and don't chase last week's points.");
  }

  return { critique, recommendations: recs.slice(0, 5) };
}

// ---------- narrateScoutPick ----------

const SCOUT_OPENERS = [
  (n: string) => `Chief Scout's verdict on ${n}:`,
  (n: string) => `Got eyes on ${n} —`,
  (n: string) => `${n}? Filed a report.`,
  (n: string) => `One for the watchlist: ${n}.`,
] as const;

const SCOUT_VALUE_GOOD = [
  "the elite are all over him and the crowd hasn't caught on.",
  "a genuine differential the best managers already trust.",
  "ownership's quiet but the smart money's loud.",
] as const;

const SCOUT_VALUE_TEMPLATE = [
  "he's a template pick for a reason — ignore him at your peril.",
  "the bandwagon's full for good cause.",
  "everyone owns him because everyone should.",
] as const;

/**
 * One-to-two sentence scouting blurb for a single player. Deterministic per
 * player (seeded by name + figures). All fields optional → degrades gracefully.
 */
export function narrateScoutPick(p: {
  name: string;
  team?: string;
  ownership: number;
  elitePct?: number;
  eliteEdge?: number;
  form?: number;
  epNext?: number;
  reasons?: string[];
}): string {
  const elitePct = p.elitePct ?? 0;
  const eliteEdge = p.eliteEdge ?? elitePct - (p.ownership ?? 0);
  const form = p.form ?? 0;
  const epNext = p.epNext ?? 0;

  const seedKey = [p.name, p.team ?? "", Math.round(p.ownership), Math.round(elitePct), round1(form), round1(epNext)].join(
    "|",
  );
  const pick = makePicker(`scout:${seedKey}`);

  const teamTag = p.team && p.team.trim().length > 0 ? ` (${p.team})` : "";
  const opener = `${pick(SCOUT_OPENERS)(p.name)}${teamTag}`;

  const clauses: string[] = [];
  if (form > 0) clauses.push(`${formWord(form)} (form ${round1(form)})`);
  if (epNext > 0) clauses.push(`projected ${round1(epNext)} pts next time out`);

  // Conviction line keyed off elite ownership vs the crowd.
  let conviction: string;
  if (elitePct >= 50) conviction = pick(SCOUT_VALUE_TEMPLATE);
  else if (eliteEdge >= 15 && elitePct > 0) conviction = pick(SCOUT_VALUE_GOOD);
  else if (elitePct > 0) conviction = `${pctText(elitePct)} elite ownership and rising.`;
  else conviction = "an under-the-radar shout worth tracking.";

  // Prefer an engine reason if one was supplied (already deterministic upstream).
  const reason = p.reasons && p.reasons.length > 0 ? p.reasons[0] : "";

  const body = clauses.length > 0 ? `${capitalise(clauses.join(", "))}. ${capitalise(conviction)}` : capitalise(conviction);
  const tail = reason ? ` ${capitalise(reason)}.` : "";

  return `${opener} ${body}${tail}`.replace(/\s+/g, " ").trim();
}

// ---------- narrateLeagueInsights ----------

const TITLE_LEADER = ["Top of the Pile", "The Pacesetter", "Leading the Charge", "Out in Front"] as const;
const TITLE_GAP = ["Mind the Gap", "Daylight at the Top", "A League of Their Own", "Catch Me If You Can"] as const;
const TITLE_TIGHT = ["Too Close to Call", "Photo Finish", "Squeaky Bum Time", "Knife-Edge Stuff"] as const;
const TITLE_CHASER = ["The Hunter", "Breathing Down Necks", "The Chaser", "Lurking with Intent"] as const;
const TITLE_BASEMENT = ["Bottom of the Barrel", "The Wooden Spoon Race", "Anchored at the Foot", "Spare a Thought"] as const;

const LEADER_LINES = [
  (s: string, n: number) => `${s} sit pretty on ${n} — somebody pinch them, this is the dream.`,
  (s: string, n: number) => `${s} are running the show with ${n} points. Form is temporary, class is ${s}.`,
  (s: string, n: number) => `${n} points and counting for ${s}. The rest are playing for second.`,
] as const;

const GAP_LINES = [
  (s: string, g: number) => `${s} have opened up a ${g}-point cushion. That's not a lead, that's a postcode.`,
  (s: string, g: number) => `${g} points clear, ${s} can practically see the trophy from here.`,
  (s: string, g: number) => `A ${g}-point gap to the chasing pack — ${s} are taking the mickey now.`,
] as const;

const TIGHT_LINES = [
  (a: string, b: string, g: number) => `${g} points splits ${a} and ${b}. One bad captain pick and it all flips.`,
  (a: string, b: string, g: number) => `${a} and ${b} are inseparable — ${g} points in it and nerves shredding.`,
  (a: string, b: string, g: number) => `Just ${g} points between ${a} and ${b}. Bring snacks, this one's going the distance.`,
] as const;

const CHASER_LINES = [
  (s: string, g: number) => `${s} are lurking just ${g} back — one big haul and the title race blows wide open.`,
  (s: string, g: number) => `Don't sleep on ${s}: ${g} points adrift and clearly up for the scrap.`,
  (s: string, g: number) => `${g} points off top spot, ${s} smell blood.`,
] as const;

const BASEMENT_LINES = [
  (s: string, n: number) => `Spare a thought for ${s}, propping up the table on ${n}. It can only get better. Probably.`,
  (s: string, n: number) => `${s} are anchored to the foot with ${n} points — the wooden spoon's got their name on it.`,
  (s: string, n: number) => `Somebody check on ${s} (${n} pts). Rough season, that.`,
] as const;

type LeagueEntry = { name: string; manager?: string; total: number; points?: number; rank?: number };

/**
 * Three witty, fact-grounded league insights. Robust to short / empty tables:
 * returns as many real insights as the data supports, padded with neutral
 * filler up to three so callers always get a stable shape.
 */
export function narrateLeagueInsights(args: {
  leagueName: string;
  top: LeagueEntry[];
}): Array<{ title: string; insight: string; squadName: string; sentiment: "positive" | "negative" | "neutral" | "funny" }> {
  const rows = [...(args.top ?? [])]
    .filter((r) => r && typeof r.total === "number" && r.name)
    .sort((a, b) => b.total - a.total);

  const out: Array<{
    title: string;
    insight: string;
    squadName: string;
    sentiment: "positive" | "negative" | "neutral" | "funny";
  }> = [];

  if (rows.length === 0) {
    const pad = makePicker(`league-empty:${args.leagueName}`);
    return [
      {
        title: "Quiet on the Pitch",
        insight: `No standings to chew over in ${args.leagueName || "this league"} just yet. Check back once the points roll in.`,
        squadName: args.leagueName || "League",
        sentiment: "neutral",
      },
      {
        title: pad(TITLE_TIGHT),
        insight: "Empty table for now — everyone's level on nothing, which is the fairest the league will ever be.",
        squadName: args.leagueName || "League",
        sentiment: "funny",
      },
      {
        title: "The Long Game",
        insight: "Pre-season hush. The real drama starts when gameweek one kicks off.",
        squadName: args.leagueName || "League",
        sentiment: "neutral",
      },
    ];
  }

  const leader = rows[0];
  const second = rows[1];
  const last = rows[rows.length - 1];

  const seedBase = `${args.leagueName}|${rows.map((r) => `${r.name}:${r.total}`).join(",")}`;

  // --- Insight 1: the leader (gap-aware) ---
  {
    const pick = makePicker(`league-leader:${seedBase}`);
    const gap = second ? leader.total - second.total : leader.total;
    if (second && gap >= 30) {
      out.push({
        title: pick(TITLE_GAP),
        insight: pick(GAP_LINES)(leader.name, gap),
        squadName: leader.name,
        sentiment: "positive",
      });
    } else {
      out.push({
        title: pick(TITLE_LEADER),
        insight: pick(LEADER_LINES)(leader.name, leader.total),
        squadName: leader.name,
        sentiment: "positive",
      });
    }
  }

  // --- Insight 2: the title race (tight) or the chaser ---
  if (second) {
    const pick = makePicker(`league-race:${seedBase}`);
    const gap = leader.total - second.total;
    if (gap <= 15) {
      out.push({
        title: pick(TITLE_TIGHT),
        insight: pick(TIGHT_LINES)(leader.name, second.name, gap),
        squadName: second.name,
        sentiment: "funny",
      });
    } else {
      out.push({
        title: pick(TITLE_CHASER),
        insight: pick(CHASER_LINES)(second.name, gap),
        squadName: second.name,
        sentiment: "neutral",
      });
    }
  }

  // --- Insight 3: the basement ---
  if (last && last !== leader && last !== second) {
    const pick = makePicker(`league-basement:${seedBase}`);
    out.push({
      title: pick(TITLE_BASEMENT),
      insight: pick(BASEMENT_LINES)(last.name, last.total),
      squadName: last.name,
      sentiment: "negative",
    });
  }

  // Pad to exactly three with neutral, fact-grounded filler.
  const pad = makePicker(`league-pad:${seedBase}`);
  while (out.length < 3) {
    const ref = rows[out.length % rows.length] ?? leader;
    out.push({
      title: pad(TITLE_LEADER),
      insight: `${ref.name} are in the mix on ${ref.total} — plenty of football still to play.`,
      squadName: ref.name,
      sentiment: "neutral",
    });
  }

  return out.slice(0, 3);
}
