// Membership roles are stored as plain strings in the database (SQLite has no
// native enum support). This union documents the allowed values — the same
// ones enforced by zod in src/lib/actions/*.
export type MembershipRole =
  | "OWNER"
  | "ADMIN"
  | "HOD"
  | "COACH"
  | "ASSISTANT_COACH"
  | "MEDICAL"
  | "MANAGER"
  | "ANALYST"
  | "ADMIN_ASSISTANT"
  | "LOGISTICS_MANAGER"
  | "PERFORMANCE_PSYCH"
  | "PHYSIO"
  | "STRENGTH_CONDITIONING"
  | "ATHLETE"
  | "PARENT"
  | "STAFF";

// Roles that can manage org-level settings, membership, and configuration.
// HOD (Head of Department) has the same full permissions as Admin.
export const ADMIN_ROLES: string[] = ["OWNER", "ADMIN", "HOD"];

// Roles that can create/edit coaching content (plans, calendar, selection, feedback).
export const COACHING_ROLES: string[] = ["OWNER", "ADMIN", "HOD", "COACH", "ASSISTANT_COACH", "MANAGER"];

// Roles that can view/edit medical information.
export const MEDICAL_ROLES: string[] = ["OWNER", "ADMIN", "HOD", "MEDICAL", "COACH", "PHYSIO"];

// The support-staff job titles listed in the Administration > People
// directory (a school/club's backroom team, distinct from athletes/parents).
export const STAFF_DIRECTORY_ROLES: string[] = [
  "MANAGER",
  "ADMIN_ASSISTANT",
  "COACH",
  "ASSISTANT_COACH",
  "LOGISTICS_MANAGER",
  "PERFORMANCE_PSYCH",
  "PHYSIO",
  "STRENGTH_CONDITIONING",
  "ANALYST",
];

export function isAdmin(role: string) {
  return ADMIN_ROLES.includes(role);
}

export function canCoach(role: string) {
  return COACHING_ROLES.includes(role);
}

export function canSeeMedical(role: string) {
  return MEDICAL_ROLES.includes(role);
}

export const ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Administrator",
  HOD: "Head of Department",
  COACH: "Coach",
  ASSISTANT_COACH: "Assistant Coach",
  MEDICAL: "Medical Staff",
  MANAGER: "Manager",
  ANALYST: "Performance Analyst",
  ADMIN_ASSISTANT: "Administrative Assistant",
  LOGISTICS_MANAGER: "Logistics Manager",
  PERFORMANCE_PSYCH: "Performance Psychologist",
  PHYSIO: "Physiotherapist",
  STRENGTH_CONDITIONING: "Strength & Conditioning Coach",
  ATHLETE: "Athlete",
  PARENT: "Parent / Guardian",
  STAFF: "Staff",
};

// Team-roster roles — who someone is *for a specific team*, independent of
// their org-wide role above. A coach can put the HOD on their own team's
// roster (e.g. as oversight) without changing anyone's org-level role.
export const TEAM_ROLE_LABELS: Record<string, string> = {
  HEAD_COACH: "Head Coach",
  ASSISTANT_COACH: "Assistant Coach",
  HOD: "Head of Department",
  MANAGER: "Manager",
  ANALYST: "Analyst",
  MEDICAL: "Medical",
  ATHLETE: "Athlete",
};

export const ORG_TYPE_LABELS: Record<string, string> = {
  SCHOOL: "School",
  CLUB: "Club",
  UNIVERSITY: "University",
  FRANCHISE: "Franchise",
  PROFESSIONAL: "Professional Team",
  FEDERATION: "Federation",
};
