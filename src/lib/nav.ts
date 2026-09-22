export type NavItem = { href: string; label: string; icon: string };
export type NavGroup = { label: string; items: NavItem[] };
export type NavArea = "administration" | "sport";
export type AreaNav = { area: NavArea; areaLabel: string; groups: NavGroup[] };

// The app is split into two switchable areas — Administration (the
// backroom: people, planning, records, trials, fixtures, resources) and
// Sport (the coaching side: tactics, recruitment, training content, team
// communication, performance). A few modules are genuinely shared (the
// same team-scoped Game Model / Training Plans / Fixtures data), so they
// appear under both areas rather than being duplicated.
export function buildAreaNav(orgId: string): AreaNav[] {
  const base = `/org/${orgId}`;

  return [
    {
      area: "administration",
      areaLabel: "Administration",
      groups: [
        {
          label: "Overview",
          items: [{ href: `${base}/dashboard`, label: "Dashboard", icon: "🏠" }],
        },
        {
          label: "People",
          items: [
            { href: `${base}/administration/people`, label: "People", icon: "🧑‍💼" },
            { href: `${base}/teams`, label: "Teams & Members", icon: "👥" },
            { href: `${base}/members`, label: "Member Forms", icon: "📋" },
          ],
        },
        {
          label: "Planning",
          items: [
            { href: `${base}/administration/planning`, label: "Planning", icon: "🗓️" },
            { href: `${base}/calendar`, label: "Calendar", icon: "📅" },
          ],
        },
        {
          label: "Data",
          items: [
            { href: `${base}/administration/data`, label: "Data", icon: "🗂️" },
            { href: `${base}/uploads`, label: "GPS / Video / Files", icon: "🛰️" },
          ],
        },
        {
          label: "Trials & Selection",
          items: [{ href: `${base}/trials`, label: "Trials & Selection", icon: "✅" }],
        },
        {
          label: "Compete",
          items: [
            { href: `${base}/fixtures`, label: "Fixture List & Results", icon: "🏆" },
            { href: `${base}/tournaments`, label: "Tournaments", icon: "🎯" },
          ],
        },
        {
          label: "Resources",
          items: [{ href: `${base}/resources`, label: "Resources & Booking", icon: "🥅" }],
        },
        {
          label: "Organization",
          items: [
            { href: `${base}/clothing`, label: "Clothing Orders", icon: "👕" },
            { href: `${base}/budget`, label: "Season Budgets", icon: "💰" },
            { href: `${base}/noticeboard`, label: "Noticeboard", icon: "📌" },
            { href: `${base}/settings`, label: "Settings & Plan", icon: "⚙️" },
          ],
        },
      ],
    },
    {
      area: "sport",
      areaLabel: "Sport",
      groups: [
        {
          label: "Overview",
          items: [{ href: `${base}/dashboard`, label: "Dashboard", icon: "🏠" }],
        },
        {
          label: "Tactical Periodisation",
          items: [
            { href: `${base}/game-model`, label: "Game Model", icon: "🧠" },
            { href: `${base}/training-plans`, label: "Training Plans & Microcycles", icon: "📈" },
            { href: `${base}/sport/game-continuum`, label: "Game Continuum", icon: "🔄" },
          ],
        },
        {
          label: "Squad",
          items: [
            { href: `${base}/sport/people-team`, label: "People & Team", icon: "👥" },
            { href: `${base}/sport/recruitment`, label: "Recruitment & Retention", icon: "📝" },
            { href: `${base}/idp`, label: "Development Plans", icon: "🎯" },
          ],
        },
        {
          label: "Training",
          items: [{ href: `${base}/sport/training`, label: "Training Folders", icon: "🎬" }],
        },
        {
          label: "Communicate",
          items: [
            { href: `${base}/chat`, label: "Team Chat", icon: "💬" },
            { href: `${base}/sport/leadership-chat`, label: "Leadership Chat", icon: "🎖️" },
          ],
        },
        {
          label: "Feedback",
          items: [{ href: `${base}/feedback`, label: "Weekly Feedback", icon: "📝" }],
        },
        {
          label: "Compete",
          items: [
            { href: `${base}/fixtures`, label: "Fixtures & Results", icon: "🏆" },
            { href: `${base}/tournaments`, label: "Tournaments", icon: "🎯" },
          ],
        },
      ],
    },
  ];
}
