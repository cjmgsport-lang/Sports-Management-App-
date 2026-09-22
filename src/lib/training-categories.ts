// The four fixed training folders under Sport > Training.
export const TRAINING_CATEGORIES = ["FOUNDATIONS", "POSITIONAL_RELATIONAL", "SCENARIO_SIMULATION", "TACTICAL_GAMES"] as const;

export type TrainingCategory = (typeof TRAINING_CATEGORIES)[number];

export const TRAINING_CATEGORY_LABELS: Record<TrainingCategory, string> = {
  FOUNDATIONS: "Foundations",
  POSITIONAL_RELATIONAL: "Positional / Relational Games",
  SCENARIO_SIMULATION: "Specific Scenario Simulations",
  TACTICAL_GAMES: "Tactical Games",
};

export const TRAINING_RESOURCE_KINDS = ["IMAGE", "PDF", "VIDEO", "ANIMATION"] as const;
export type TrainingResourceKind = (typeof TRAINING_RESOURCE_KINDS)[number];

export const TRAINING_RESOURCE_KIND_LABELS: Record<TrainingResourceKind, string> = {
  IMAGE: "Image",
  PDF: "PDF",
  VIDEO: "Video",
  ANIMATION: "Animation",
};
