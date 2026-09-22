// The six moments of the game continuum (Sport > Game Continuum) — each
// gets its own field-space image (attacking shape, defensive shape, etc.)
// and description, per team.
export const GAME_CONTINUUM_MOMENTS = [
  "POSSESSION",
  "COUNTER_ATTACK",
  "BALL_RECOVERY_COUNTER_DEFENCE",
  "SET_PIECE",
  "ATTACKING_SCORING_BEHAVIOUR",
  "DEFENSIVE_GOAL_AREA_BEHAVIOUR",
] as const;

export type GameContinuumMomentId = (typeof GAME_CONTINUUM_MOMENTS)[number];

export const GAME_CONTINUUM_LABELS: Record<GameContinuumMomentId, string> = {
  POSSESSION: "Possession",
  COUNTER_ATTACK: "Counter Attack",
  BALL_RECOVERY_COUNTER_DEFENCE: "Ball Recovery & Counter Defence",
  SET_PIECE: "Set Piece",
  ATTACKING_SCORING_BEHAVIOUR: "Attacking Scoring Behaviour",
  DEFENSIVE_GOAL_AREA_BEHAVIOUR: "Defensive Goal Area Behaviour",
};
