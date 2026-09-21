export type NavItem = { href: string; label: string; icon: string };
export type NavGroup = { label: string; items: NavItem[] };

export function buildNav(orgId: string): NavGroup[] {
  const base = `/org/${orgId}`;
  return [
    {
      label: "Overview",
      items: [{ href: `${base}/dashboard`, label: "Dashboard", icon: "🏠" }],
    },
    {
      label: "People",
      items: [
        { href: `${base}/teams`, label: "Teams & Members", icon: "👥" },
        { href: `${base}/members`, label: "Member Forms", icon: "📋" },
      ],
    },
    {
      label: "Plan & Communicate",
      items: [
        { href: `${base}/calendar`, label: "Calendar", icon: "📅" },
        { href: `${base}/training-plans`, label: "Training Plans", icon: "📈" },
        { href: `${base}/chat`, label: "Chat", icon: "💬" },
        { href: `${base}/noticeboard`, label: "Noticeboard", icon: "📌" },
      ],
    },
    {
      label: "Compete",
      items: [
        { href: `${base}/fixtures`, label: "Fixtures & Results", icon: "🏆" },
        { href: `${base}/tournaments`, label: "Tournaments", icon: "🎯" },
        { href: `${base}/trials`, label: "Trials & Selection", icon: "✅" },
      ],
    },
    {
      label: "Performance",
      items: [
        { href: `${base}/uploads`, label: "GPS / Video / Files", icon: "🛰️" },
        { href: `${base}/idp`, label: "Development Plans", icon: "🎯" },
        { href: `${base}/feedback`, label: "Weekly Feedback", icon: "📝" },
      ],
    },
    {
      label: "Operations",
      items: [
        { href: `${base}/resources`, label: "Resources & Booking", icon: "🥅" },
        { href: `${base}/clothing`, label: "Clothing Orders", icon: "👕" },
        { href: `${base}/budget`, label: "Season Budgets", icon: "💰" },
      ],
    },
    {
      label: "Organization",
      items: [{ href: `${base}/settings`, label: "Settings & Plan", icon: "⚙️" }],
    },
  ];
}
