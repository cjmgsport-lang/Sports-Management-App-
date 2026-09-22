// South African public holidays and approximate school/university term
// dates, 2026-2031, for Administration > Planning's 5-year calendar seed.
//
// Public holidays are computed exactly (fixed dates + the standard
// Gregorian Easter algorithm for Good Friday/Family Day), including the
// "falls on a Sunday -> observed the following Monday" rule from the
// Public Holidays Act.
//
// School and university term dates are NOT gazetted five years ahead by
// any SA authority — the values below are a reasonable approximation of
// the typical public-school/university calendar shape, nudged off
// weekends. They're seeded so planning has something to work against
// immediately, but every term event's description says to confirm against
// the year's official calendar once it's published.

export type SaCalendarEventType = "PUBLIC_HOLIDAY" | "SCHOOL_TERM" | "UNIVERSITY_TERM";

export type SaCalendarEvent = {
  title: string;
  type: SaCalendarEventType;
  startsAt: Date;
  endsAt: Date;
  description?: string;
};

const FIXED_HOLIDAYS: { title: string; month: number; day: number }[] = [
  { title: "New Year's Day", month: 1, day: 1 },
  { title: "Human Rights Day", month: 3, day: 21 },
  { title: "Freedom Day", month: 4, day: 27 },
  { title: "Workers' Day", month: 5, day: 1 },
  { title: "Youth Day", month: 6, day: 16 },
  { title: "National Women's Day", month: 8, day: 9 },
  { title: "Heritage Day", month: 9, day: 24 },
  { title: "Day of Reconciliation", month: 12, day: 16 },
  { title: "Christmas Day", month: 12, day: 25 },
  { title: "Day of Goodwill", month: 12, day: 26 },
];

function computeEasterSunday(year: number): Date {
  // Meeus/Jones/Butcher Gregorian algorithm.
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function dateAt(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Nudges a date off a weekend for approximate term boundaries — Sat/Sun -> the nearest weekday inward. */
function nudgeToWeekday(date: Date, direction: "forward" | "backward"): Date {
  const d = new Date(date);
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + (direction === "forward" ? 1 : -1));
  }
  return d;
}

function wholeDay(date: Date): { startsAt: Date; endsAt: Date } {
  const startsAt = new Date(date);
  startsAt.setHours(0, 0, 0, 0);
  const endsAt = new Date(date);
  endsAt.setHours(23, 59, 0, 0);
  return { startsAt, endsAt };
}

export function generatePublicHolidays(year: number): SaCalendarEvent[] {
  const events: SaCalendarEvent[] = [];

  for (const h of FIXED_HOLIDAYS) {
    const date = dateAt(year, h.month, h.day);
    events.push({ title: h.title, type: "PUBLIC_HOLIDAY", ...wholeDay(date) });
    if (date.getDay() === 0) {
      events.push({
        title: `${h.title} (observed)`,
        type: "PUBLIC_HOLIDAY",
        ...wholeDay(addDays(date, 1)),
        description: "Falls on a Sunday — observed the following Monday under the Public Holidays Act.",
      });
    }
  }

  const easterSunday = computeEasterSunday(year);
  events.push({ title: "Good Friday", type: "PUBLIC_HOLIDAY", ...wholeDay(addDays(easterSunday, -2)) });
  events.push({ title: "Family Day", type: "PUBLIC_HOLIDAY", ...wholeDay(addDays(easterSunday, 1)) });

  return events.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

const TERM_APPROX_NOTE = "Approximate — confirm against the official calendar once your province/institution publishes it for this year.";

export function generateSchoolTerms(year: number): SaCalendarEvent[] {
  const raw: { name: string; startMonth: number; startDay: number; endMonth: number; endDay: number }[] = [
    { name: "Term 1", startMonth: 1, startDay: 14, endMonth: 3, endDay: 20 },
    { name: "Term 2", startMonth: 4, startDay: 8, endMonth: 6, endDay: 12 },
    { name: "Term 3", startMonth: 7, startDay: 15, endMonth: 9, endDay: 25 },
    { name: "Term 4", startMonth: 10, startDay: 6, endMonth: 12, endDay: 4 },
  ];

  return raw.map((t) => ({
    title: `School ${t.name} ${year}`,
    type: "SCHOOL_TERM" as const,
    startsAt: nudgeToWeekday(dateAt(year, t.startMonth, t.startDay), "forward"),
    endsAt: nudgeToWeekday(dateAt(year, t.endMonth, t.endDay), "backward"),
    description: TERM_APPROX_NOTE,
  }));
}

export function generateUniversityTerms(year: number): SaCalendarEvent[] {
  const raw: { name: string; startMonth: number; startDay: number; endMonth: number; endDay: number }[] = [
    { name: "Semester 1", startMonth: 2, startDay: 16, endMonth: 6, endDay: 6 },
    { name: "Semester 2", startMonth: 7, startDay: 20, endMonth: 11, endDay: 14 },
  ];

  return raw.map((t) => ({
    title: `University ${t.name} ${year}`,
    type: "UNIVERSITY_TERM" as const,
    startsAt: nudgeToWeekday(dateAt(year, t.startMonth, t.startDay), "forward"),
    endsAt: nudgeToWeekday(dateAt(year, t.endMonth, t.endDay), "backward"),
    description: TERM_APPROX_NOTE,
  }));
}

export const PLANNING_CALENDAR_YEARS = [2026, 2027, 2028, 2029, 2030, 2031];

export function generateFiveYearPlanningCalendar(): SaCalendarEvent[] {
  return PLANNING_CALENDAR_YEARS.flatMap((year) => [
    ...generatePublicHolidays(year),
    ...generateSchoolTerms(year),
    ...generateUniversityTerms(year),
  ]);
}
