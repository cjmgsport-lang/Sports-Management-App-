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

export type MatchDayCode =
  | "MD_MINUS_5"
  | "MD_MINUS_4"
  | "MD_MINUS_3"
  | "MD_MINUS_2"
  | "MD_MINUS_1"
  | "MD"
  // Double-header weeks (two matches): the second match's own MD-1/MD-2
  // relative to itself, and MD itself for the second match day.
  | "MD_SECOND_MINUS_2"
  | "MD_SECOND_MINUS_1"
  | "MD_SECOND"
  | "MD_PLUS_1"
  | "MD_PLUS_2";

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
  "MD_SECOND_MINUS_2",
  "MD_SECOND_MINUS_1",
  "MD_SECOND",
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
  MD_SECOND_MINUS_2: "MD-2 (2nd match)",
  MD_SECOND_MINUS_1: "MD-1 (2nd match)",
  MD_SECOND: "MD (2nd match)",
  MD_PLUS_1: "MD+1",
  MD_PLUS_2: "MD+2",
};

const MATCH_DAY_SORT_ORDER: MatchDayCode[] = [
  "MD_MINUS_5",
  "MD_MINUS_4",
  "MD_MINUS_3",
  "MD_MINUS_2",
  "MD_MINUS_1",
  "MD",
  "MD_SECOND_MINUS_2",
  "MD_SECOND_MINUS_1",
  "MD_SECOND",
  "MD_PLUS_1",
  "MD_PLUS_2",
];

export function matchDaySortIndex(code: string | null | undefined): number {
  const idx = MATCH_DAY_SORT_ORDER.indexOf(code as MatchDayCode);
  return idx === -1 ? 99 : idx;
}

// ---------- Microcycle templates ----------
// Four named shapes for a week, keyed to the fixture pattern the user
// chooses. A "single match" week is structurally identical whether the
// match falls on Saturday or Sunday (the codes are all relative to the
// match date), so SINGLE_SATURDAY and SINGLE_SUNDAY share one recipe —
// they're kept as separate named options because that's how coaches think
// about the week, and the UI enforces the expected weekday when picking
// the anchor date.

export type MicrocycleTemplateId = "SINGLE_SATURDAY" | "SINGLE_SUNDAY" | "DOUBLE_SAT_SUN" | "DOUBLE_THU_SUN";

export const MICROCYCLE_TEMPLATES: Record<
  MicrocycleTemplateId,
  { label: string; matchDayOfWeek: number; secondMatchDayOfWeek: number | null; description: string }
> = {
  SINGLE_SATURDAY: {
    label: "Single match — Saturday",
    matchDayOfWeek: 6,
    secondMatchDayOfWeek: null,
    description: "One match, kicking off on Saturday.",
  },
  SINGLE_SUNDAY: {
    label: "Single match — Sunday",
    matchDayOfWeek: 0,
    secondMatchDayOfWeek: null,
    description: "One match, kicking off on Sunday.",
  },
  DOUBLE_SAT_SUN: {
    label: "Double header — Saturday & Sunday",
    matchDayOfWeek: 6,
    secondMatchDayOfWeek: 0,
    description: "Back-to-back matches, Saturday then Sunday.",
  },
  DOUBLE_THU_SUN: {
    label: "Double header — Thursday & Sunday",
    matchDayOfWeek: 4,
    secondMatchDayOfWeek: 0,
    description: "Two matches three days apart, Thursday then Sunday.",
  },
};

export type TemplateSessionRecipe = {
  /** Days offset from the first match date (negative = before, positive = after). */
  offsetDays: number;
  matchDayCode: MatchDayCode;
  subDynamic: SubDynamic;
  focus: string;
};

const SINGLE_MATCH_RECIPE: TemplateSessionRecipe[] = [
  { offsetDays: -4, matchDayCode: "MD_MINUS_4", subDynamic: "DURATION", focus: "Base training — high duration, sub-maximal intensity" },
  { offsetDays: -3, matchDayCode: "MD_MINUS_3", subDynamic: "SPEED_ENDURANCE", focus: "Speed-endurance work in tactically specific duels" },
  { offsetDays: -2, matchDayCode: "MD_MINUS_2", subDynamic: "SPEED", focus: "Short, explosive, tactically specific actions" },
  { offsetDays: -1, matchDayCode: "MD_MINUS_1", subDynamic: "ACTIVATION", focus: "Activation & set-piece walkthrough" },
  { offsetDays: 1, matchDayCode: "MD_PLUS_1", subDynamic: "RECOVERY", focus: "Recovery — low intensity, low complexity" },
];

const DOUBLE_HEADER_TIGHT_RECIPE: TemplateSessionRecipe[] = [
  // Back-to-back (1 day apart): all prep happens before match 1, then
  // straight into recovery once match 2 is done.
  { offsetDays: -4, matchDayCode: "MD_MINUS_4", subDynamic: "DURATION", focus: "Base training — high duration, sub-maximal intensity" },
  { offsetDays: -3, matchDayCode: "MD_MINUS_3", subDynamic: "SPEED_ENDURANCE", focus: "Speed-endurance work in tactically specific duels" },
  { offsetDays: -2, matchDayCode: "MD_MINUS_2", subDynamic: "SPEED", focus: "Short, explosive, tactically specific actions" },
  { offsetDays: -1, matchDayCode: "MD_MINUS_1", subDynamic: "ACTIVATION", focus: "Activation & set-piece walkthrough" },
  { offsetDays: 2, matchDayCode: "MD_PLUS_1", subDynamic: "RECOVERY", focus: "Recovery after both matches — low intensity, low complexity" },
];

const DOUBLE_HEADER_GAPPED_RECIPE: TemplateSessionRecipe[] = [
  // Three days apart: full prep before match 1, then a short, minimal-load
  // bridge before match 2.
  { offsetDays: -4, matchDayCode: "MD_MINUS_4", subDynamic: "DURATION", focus: "Base training — high duration, sub-maximal intensity" },
  { offsetDays: -3, matchDayCode: "MD_MINUS_3", subDynamic: "SPEED_ENDURANCE", focus: "Speed-endurance work in tactically specific duels" },
  { offsetDays: -2, matchDayCode: "MD_MINUS_2", subDynamic: "SPEED", focus: "Short, explosive, tactically specific actions" },
  { offsetDays: -1, matchDayCode: "MD_MINUS_1", subDynamic: "ACTIVATION", focus: "Activation & set-piece walkthrough" },
  { offsetDays: 1, matchDayCode: "MD_SECOND_MINUS_2", subDynamic: "SPEED_ENDURANCE", focus: "Between-match touch — minimal fatigue carried into match 2" },
  { offsetDays: 2, matchDayCode: "MD_SECOND_MINUS_1", subDynamic: "ACTIVATION", focus: "Activation for the second match" },
  { offsetDays: 4, matchDayCode: "MD_PLUS_1", subDynamic: "RECOVERY", focus: "Recovery after both matches — low intensity, low complexity" },
];

export function microcycleTemplateRecipe(templateId: MicrocycleTemplateId): TemplateSessionRecipe[] {
  switch (templateId) {
    case "SINGLE_SATURDAY":
    case "SINGLE_SUNDAY":
      return SINGLE_MATCH_RECIPE;
    case "DOUBLE_SAT_SUN":
      return DOUBLE_HEADER_TIGHT_RECIPE;
    case "DOUBLE_THU_SUN":
      return DOUBLE_HEADER_GAPPED_RECIPE;
  }
}

/** Builds the {date, matchDayCode, subDynamic, focus} rows for a template, anchored to the first match's date. */
export function buildMicrocycleSessions(templateId: MicrocycleTemplateId, firstMatchDate: Date) {
  const recipe = microcycleTemplateRecipe(templateId);
  return recipe.map((r) => {
    const date = new Date(firstMatchDate);
    date.setDate(date.getDate() + r.offsetDays);
    return { date, matchDayCode: r.matchDayCode, subDynamic: r.subDynamic, focus: r.focus };
  });
}

export type Complexity = "LOW" | "MEDIUM" | "HIGH";

export const COMPLEXITIES: Complexity[] = ["LOW", "MEDIUM", "HIGH"];

export const COMPLEXITY_LABELS: Record<Complexity, string> = {
  LOW: "Low complexity",
  MEDIUM: "Medium complexity",
  HIGH: "High complexity",
};
