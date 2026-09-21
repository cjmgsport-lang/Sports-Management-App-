import Link from "next/link";
import { LinkButton } from "@/components/ui";
import { AudienceTabs } from "@/components/audience-tabs";

const FEATURES: { title: string; desc: string }[] = [
  { title: "Editable calendars", desc: "Shared team calendars for training, matches, meetings and travel — always up to date." },
  { title: "Periodised training plans", desc: "Plan seasons top-down: macrocycles, mesocycles and weekly microcycles down to individual sessions and drills." },
  { title: "Team chat & noticeboard", desc: "Keep coaches, athletes, parents and staff aligned with channels and pinned announcements." },
  { title: "Fixtures & tournaments", desc: "Fixture templates, tournament brackets and results, all in one place." },
  { title: "GPS, video & session uploads", desc: "Upload GPS files, match/session video, session animations and PDFs, linked to sessions and fixtures." },
  { title: "Clothing orders", desc: "Manage kit catalogues and team clothing orders by size and athlete." },
  { title: "Member, medical & transport forms", desc: "Collect and securely store member information, medical details and transport needs." },
  { title: "Personal season budgets", desc: "Give families a clear view of the season's costs, line by line." },
  { title: "Individual development plans", desc: "Track goals, strengths and action plans for every athlete." },
  { title: "Weekly feedback", desc: "Structured coach feedback and athlete reflection, every week." },
  { title: "Trials & selection", desc: "Run trials and record selection decisions transparently." },
  { title: "Resource sharing", desc: "Book fields, balls, cones, poles, mannequins, GPS units and video equipment without double-booking." },
];

const AUDIENCES = ["Schools", "Clubs", "Universities", "Franchises", "Professional teams", "Federations"];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-slate-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span className="text-lg font-bold text-brand-700">Freedom Sports Management</span>
          <nav className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Log in
            </Link>
            <LinkButton href="/signup">Get started</LinkButton>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-16 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Built for South African sport</p>
        <h1 className="mx-auto mt-3 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          One platform to run every team, every season
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
          Freedom Sports Management brings planning, performance, communication and administration
          together for schools, clubs, universities, franchises, professional teams and federations.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <LinkButton href="/signup">Start free trial</LinkButton>
          <LinkButton href="/login" variant="secondary">
            Log in
          </LinkButton>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {AUDIENCES.map((a) => (
            <span key={a} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
              {a}
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-4">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Whoever you are on the team</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">See what Freedom looks like for you</h2>
        </div>
        <div className="mt-8">
          <AudienceTabs />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold text-slate-900">Everything included, for the whole organization</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-1.5 text-sm text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-brand-950 py-14 text-center text-white">
        <h2 className="text-2xl font-semibold">Ready to bring your whole programme onto one platform?</h2>
        <p className="mx-auto mt-2 max-w-xl text-brand-100">
          Every module — from periodised training to trials and kit orders — works together out of the box.
        </p>
        <LinkButton href="/signup" className="mt-6">
          Create your organization
        </LinkButton>
      </section>

      <footer className="border-t border-slate-100 py-6 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} Freedom Sports Management
      </footer>
    </main>
  );
}
