// Vocabulary for planning training under Tactical Periodisation (Vítor
// Frade's periodização táctica, as used by Mourinho/Guardiola-lineage
// coaching staffs). Two ideas drive the whole training-plans module:
//
// 1. The GAME MODEL — how the team wants to play, expressed as concrete
//    principles/sub-principles under the four moments of the game (plus
//    set pieces). Every drill and every session should serve one of these;
//    tactical periodisation never trains "fitness" in the abstract.
//
// 2. The MORPHOCYCLE — the standard weekly structure built backward from
//    the next match (MD). Each day has a fixed identity: which moment of
//    the game is dominant that day, and which "sub-dynamic" of effort
//    (duration -> speed-endurance -> speed -> activation, bookended by
//    recovery) the exercises should propensiate. Complexity and duration
//    fall as match day approaches while intensity/speed rises — but always
//    through tactically specific exercises, never decontextualised running.

export type Moment =
  | "OFFENSIVE_ORGANIZATION"
  | "DEFENSIVE_ORGANIZATION"
  | "ATTACKING_TRANSITION"
  | "DEFENSIVE_TRANSITION"
  | "SET_PIECES";

export const MOMENT_LABELS: Record<Moment, string> = {
  OFFENSIVE_ORGANIZATION: "Offensive Organization",
  DEFENSIVE_ORGANIZATION: "Defensive Organization",
  ATTACKING_TRANSITION: "Attacking Transition (won possession)",
  DEFENSIVE_TRANSITION: "Defensive Transition (lost possession)",
  SET_PIECES: "Set Pieces",
};

export const MOMENT_SHORT_LABELS: Record<Moment, string> = {
  OFFENSIVE_ORGANIZATION: "Offensive Org.",
  DEFENSIVE_ORGANIZATION: "Defensive Org.",
  ATTACKING_TRANSITION: "Attacking Transition",
  DEFENSIVE_TRANSITION: "Defensive Transition",
  SET_PIECES: "Set Pieces",
};

export const MOMENT_COLORS: Record<Moment, "blue" | "red" | "green" | "amber" | "purple"> = {
  OFFENSIVE_ORGANIZATION: "blue",
  DEFENSIVE_ORGANIZATION: "red",
  ATTACKING_TRANSITION: "green",
  DEFENSIVE_TRANSITION: "amber",
  SET_PIECES: "purple",
};

export const MOMENTS: Moment[] = [
  "OFFENSIVE_ORGANIZATION",
  "DEFENSIVE_ORGANIZATION",
  "ATTACKING_TRANSITION",
  "DEFENSIVE_TRANSITION",
  "SET_PIECES",
];

export type SubDynamic = "RECOVERY" | "DURATION" | "STRENGTH" | "SPEED_ENDURANCE" | "SPEED" | "ACTIVATION";

export const SUB_DYNAMICS: SubDynamic[] = ["RECOVERY", "DURATION", "STRENGTH", "SPEED_ENDURANCE", "SPEED", "ACTIVATION"];

export const SUB_DYNAMIC_LABELS: Record<SubDynamic, string> = {
  RECOVERY: "Recovery",
  DURATION: "Duration",
  STRENGTH: "Strength",
  SPEED_ENDURANCE: "Speed Endurance",
  SPEED: "Speed",
  ACTIVATION: "Activation",
};

export const SUB_DYNAMIC_HINTS: Record<SubDynamic, string> = {
  RECOVERY: "Low intensity, low complexity — regenerate after the match.",
  DURATION: "Highest complexity and duration of the week, sub-maximal intensity — builds tension progressively.",
  STRENGTH: "High complexity with resisted/duelling actions — strength expressed through tactical duels.",
  SPEED_ENDURANCE: "Shorter, sharper exercises — intensity rising, duration and complexity falling.",
  SPEED: "Short, explosive, high-speed actions — lowest volume, highest intensity.",
  ACTIVATION: "Very light, no residual fatigue — tactical review and set-piece walkthroughs before the match.",
};

export type MatchDayCode = "MD_MINUS_5" | "MD_MINUS_4" | "MD_MINUS_3" | "MD_MINUS_2" | "MD_MINUS_1" | "MD" | "MD_PLUS_1" | "MD_PLUS_2";

// Ordered as they fall across a week, MD first for reference.
export const MATCH_DAY_CODES: MatchDayCode[] = [
  "MD_PLUS_1",
  "MD_PLUS_2",
  "MD_MINUS_5",
  "MD_MINUS_4",
  "MD_MINUS_3",
  "MD_MINUS_2",
  "MD_MINUS_1",
  "MD",
];

// A typical single-match week (Sat match), in calendar order, with the
// sub-dynamic the morphocycle prescribes for each — this is what a new
// microcycle's day strip defaults to, and what the "add session" helper
// suggests.
export const STANDARD_MORPHOCYCLE: { code: MatchDayCode; suggestedSubDynamic: SubDynamic }[] = [
  { code: "MD", suggestedSubDynamic: "SPEED" },
  { code: "MD_PLUS_1", suggestedSubDynamic: "RECOVERY" },
  { code: "MD_MINUS_4", suggestedSubDynamic: "DURATION" },
  { code: "MD_MINUS_3", suggestedSubDynamic: "SPEED_ENDURANCE" },
  { code: "MD_MINUS_2", suggestedSubDynamic: "SPEED" },
  { code: "MD_MINUS_1", suggestedSubDynamic: "ACTIVATION" },
];

export const MATCH_DAY_LABELS: Record<MatchDayCode, string> = {
  MD_MINUS_5: "MD-5",
  MD_MINUS_4: "MD-4",
  MD_MINUS_3: "MD-3",
  MD_MINUS_2: "MD-2",
  MD_MINUS_1: "MD-1",
  MD: "MD",
  MD_PLUS_1: "MD+1",
  MD_PLUS_2: "MD+2",
};

export function matchDaySortIndex(code: string | null | undefined): number {
  const order: MatchDayCode[] = ["MD_MINUS_5", "MD_MINUS_4", "MD_MINUS_3", "MD_MINUS_2", "MD_MINUS_1", "MD", "MD_PLUS_1", "MD_PLUS_2"];
  const idx = order.indexOf(code as MatchDayCode);
  return idx === -1 ? 99 : idx;
}

export type Complexity = "LOW" | "MEDIUM" | "HIGH";

export const COMPLEXITIES: Complexity[] = ["LOW", "MEDIUM", "HIGH"];

export const COMPLEXITY_LABELS: Record<Complexity, string> = {
  LOW: "Low complexity",
  MEDIUM: "Medium complexity",
  HIGH: "High complexity",
};
