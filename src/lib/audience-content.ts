// Content for the audience switcher on the public landing page
// (src/app/page.tsx / src/components/audience-tabs.tsx). Kept as plain
// data so the copy for each end-user audience is easy to find and edit
// without touching any component logic.

export type AudienceHighlight = { title: string; desc: string };

export type Audience = {
  id: "coach" | "parent" | "player";
  label: string;
  icon: string;
  tagline: string;
  description: string;
  highlights: AudienceHighlight[];
  primaryCta: { label: string; href: string };
  secondaryNote: string;
};

export const AUDIENCE_CONTENT: Audience[] = [
  {
    id: "coach",
    label: "Coaches",
    icon: "🏆",
    tagline: "Plan, coach and develop your whole squad",
    description:
      "From periodised training plans to weekly feedback and trials, everything a coach needs to run a team is in one place.",
    highlights: [
      { title: "Periodised training plans", desc: "Build seasons top-down: macrocycles, mesocycles, weekly microcycles and individual sessions with drills." },
      { title: "Editable calendar", desc: "Schedule training, matches, meetings and travel for your team — always up to date." },
      { title: "GPS, video & session uploads", desc: "Attach GPS files, match video and session animations to any session or fixture." },
      { title: "Weekly feedback & IDPs", desc: "Give structured feedback and track an individual development plan for every athlete." },
      { title: "Trials & selection", desc: "Run trials and record selection decisions transparently." },
      { title: "Resource booking", desc: "Reserve fields, balls, cones, GPS units and video equipment without double-booking." },
    ],
    primaryCta: { label: "Start free trial", href: "/signup" },
    secondaryNote: "Setting up for your club or school? Create your organization in a minute.",
  },
  {
    id: "parent",
    label: "Parents & Guardians",
    icon: "👪",
    tagline: "Stay informed and in control of your child's season",
    description: "See what's coming up, what's owed, and what your child needs — all in one place.",
    highlights: [
      { title: "Personal season budget", desc: "A clear, line-by-line view of season costs, and what's already been paid." },
      { title: "Medical & transport forms", desc: "Submit medical details and transport needs once, stored securely." },
      { title: "Noticeboard & chat", desc: "Never miss a team announcement or message." },
      { title: "Fixtures & results", desc: "Know when and where every match is, and see the score afterwards." },
      { title: "Clothing orders", desc: "Order kit in the right size without chasing anyone." },
      { title: "Development plan visibility", desc: "See your child's goals, strengths and coach feedback." },
    ],
    primaryCta: { label: "Log in", href: "/login" },
    secondaryNote: "You'll usually be invited by your child's club or school — ask them for an invite if you don't have an account yet.",
  },
  {
    id: "player",
    label: "Players",
    icon: "⚽",
    tagline: "Know your plan. Track your progress. Stay connected.",
    description: "Everything you need for training, matches and your own development, in one app.",
    highlights: [
      { title: "Personal calendar", desc: "See training, matches and events for your team." },
      { title: "Individual development plan", desc: "Track your goals and progress with your coach." },
      { title: "Weekly feedback", desc: "Get structured feedback every week, and add your own reflection." },
      { title: "Team chat & noticeboard", desc: "Stay in the loop with your team." },
      { title: "Trials & selection", desc: "See trial dates and find out selection outcomes." },
      { title: "Clothing orders", desc: "Order your kit in the right size." },
    ],
    primaryCta: { label: "Log in", href: "/login" },
    secondaryNote: "You'll usually be invited by your coach or club — ask them for an invite if you don't have an account yet.",
  },
];
