// Membership roles are stored as plain strings in the database (SQLite has no
// native enum support). This union documents the allowed values — the same
// ones enforced by zod in src/lib/actions/*.
export type MembershipRole =
  | "OWNER"
  | "ADMIN"
  | "COACH"
  | "ASSISTANT_COACH"
  | "MEDICAL"
  | "MANAGER"
  | "ANALYST"
  | "ATHLETE"
  | "PARENT"
  | "STAFF";

// Roles that can manage org-level settings, membership, and configuration.
export const ADMIN_ROLES: string[] = ["OWNER", "ADMIN"];

// Roles that can create/edit coaching content (plans, calendar, selection, feedback).
export const COACHING_ROLES: string[] = ["OWNER", "ADMIN", "COACH", "ASSISTANT_COACH", "MANAGER"];

// Roles that can view/edit medical information.
export const MEDICAL_ROLES: string[] = ["OWNER", "ADMIN", "MEDICAL", "COACH"];

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
  COACH: "Coach",
  ASSISTANT_COACH: "Assistant Coach",
  MEDICAL: "Medical Staff",
  MANAGER: "Team Manager",
  ANALYST: "Analyst",
  ATHLETE: "Athlete",
  PARENT: "Parent / Guardian",
  STAFF: "Staff",
};

export const ORG_TYPE_LABELS: Record<string, string> = {
  SCHOOL: "School",
  CLUB: "Club",
  UNIVERSITY: "University",
  FRANCHISE: "Franchise",
  PROFESSIONAL: "Professional Team",
  FEDERATION: "Federation",
};
