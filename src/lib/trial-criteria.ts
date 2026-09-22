// The nine whole-athlete selection domains scored on every trial
// selection document — Administration > Trials & Selection.
export const TRIAL_CRITERIA = [
  "biological",
  "conditioning",
  "coordination",
  "cognitive",
  "socioAffective",
  "creative",
  "emotionalSkill",
  "mental",
  "leadershipCharacter",
] as const;

export type TrialCriterion = (typeof TRIAL_CRITERIA)[number];

export const TRIAL_CRITERIA_LABELS: Record<TrialCriterion, string> = {
  biological: "Biological",
  conditioning: "Conditioning",
  coordination: "Coordination",
  cognitive: "Cognitive",
  socioAffective: "Socio-Affective",
  creative: "Creative",
  emotionalSkill: "Emotional Skill",
  mental: "Mental",
  leadershipCharacter: "Leadership & Character",
};

export const TRIAL_CRITERIA_SHORT_LABELS: Record<TrialCriterion, string> = {
  biological: "Bio",
  conditioning: "Cond.",
  coordination: "Coord.",
  cognitive: "Cog.",
  socioAffective: "Socio-Aff.",
  creative: "Creative",
  emotionalSkill: "Emo. Skill",
  mental: "Mental",
  leadershipCharacter: "Leadership",
};

export const TRIAL_SCORE_SCALE = [1, 2, 3, 4, 5] as const;
