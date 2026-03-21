import Link from "next/link";

const studentHighlights = [
  "Advanced filters across location, courses, fees, ratings, and facilities.",
  "Side-by-side institution comparison to narrow choices with confidence.",
  "Direct inquiry flow to reach institutes without leaving the platform.",
];

const instituteHighlights = [
  "Separate institute sign-in for profile management and publishing updates.",
  "Rich profile editing for courses, infrastructure, faculty, fees, and contacts.",
  "Gallery and inquiry management to showcase campuses and reply quickly.",
];

const spotlightStats = [
  { label: "Student journeys", value: "Search + compare + inquire" },
  { label: "Institute actions", value: "Profile + gallery + replies" },
  { label: "Core promise", value: "One connected discovery workflow" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="glass-panel sticky top-4 z-30 rounded-full px-5 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#205548,#7ac7d9)] text-sm font-semibold text-white">
                OL
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  OneLink Education Hub
                </p>
                <p className="heading-serif text-xl text-slate-800">
                  Discovery for students, control for institutes
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                href="/students/login"
                className="rounded-full border border-slate-300/70 bg-white/70 px-4 py-2 text-slate-700 transition hover:border-slate-400 hover:bg-white"
              >
                Student Login
              </Link>
              <Link
                href="/institutes/login"
                className="rounded-full border border-[rgba(139,58,28,0.28)] bg-[rgba(223,109,60,0.12)] px-4 py-2 text-[var(--accent-deep)] transition hover:bg-[rgba(223,109,60,0.18)]"
              >
                Institute Login
              </Link>
            </div>
          </div>
        </header>

        <section className="relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-8 lg:px-12 lg:py-16">
          <div className="absolute inset-0 rounded-[2rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(250,244,237,0.78),rgba(237,244,248,0.94))]" />
          <div className="animate-float absolute -left-10 top-10 h-36 w-36 rounded-full bg-[rgba(122,199,217,0.26)] blur-2xl" />
          <div className="animate-pulse-soft absolute right-8 top-16 h-48 w-48 rounded-full bg-[rgba(223,109,60,0.14)] blur-3xl" />
          <div className="animate-float absolute bottom-0 right-20 h-44 w-44 rounded-full bg-[rgba(32,85,72,0.12)] blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="inline-flex rounded-full border border-white/70 bg-white/70 px-4 py-2 text-xs uppercase tracking-[0.28em] text-slate-500">
                Dual authentication modules
              </div>
              <div className="max-w-3xl space-y-4">
                <h1 className="heading-serif text-4xl leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
                  A calmer way for students to discover institutions and for
                  institutes to stay accurately represented.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-[var(--ink-soft)]">
                  Students get powerful discovery tools and clean comparison
                  views. Institutes get a separate workspace to publish profile
                  details, maintain galleries, and respond to incoming interest.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/students/register"
                  className="rounded-full bg-[var(--forest)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-950/10 transition hover:translate-y-[-1px]"
                >
                  Start as Student
                </Link>
                <Link
                  href="/institutes/register"
                  className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-950/10 transition hover:translate-y-[-1px]"
                >
                  Start as Institute
                </Link>
                <Link
                  href="/students/discover"
                  className="rounded-full border border-slate-300 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
                >
                  Explore Directory
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {spotlightStats.map((item) => (
                  <div
                    key={item.label}
                    className="glass-panel rounded-3xl px-5 py-4 text-sm"
                  >
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                      {item.label}
                    </p>
                    <p className="mt-2 font-semibold text-slate-800">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel-strong relative rounded-[2rem] p-6 sm:p-8">
              <div className="space-y-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                    Product flow
                  </p>
                  <h2 className="heading-serif mt-2 text-3xl text-slate-900">
                    Two modules, one connected decision journey
                  </h2>
                </div>
                <div className="space-y-4">
                  <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--forest)]">
                      Student Module
                    </p>
                    <ul className="mt-3 space-y-3 text-sm leading-7 text-slate-600">
                      {studentHighlights.map((item) => (
                        <li key={item} className="flex gap-3">
                          <span className="mt-2 h-2 w-2 rounded-full bg-[var(--forest)]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-3xl border border-[rgba(223,109,60,0.18)] bg-[rgba(255,245,239,0.92)] p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent-deep)]">
                      Institute Module
                    </p>
                    <ul className="mt-3 space-y-3 text-sm leading-7 text-slate-600">
                      {instituteHighlights.map((item) => (
                        <li key={item} className="flex gap-3">
                          <span className="mt-2 h-2 w-2 rounded-full bg-[var(--accent)]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Student Experience
            </p>
            <h2 className="heading-serif mt-3 text-3xl text-slate-900">
              Search deeper, compare smarter
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
              The student side focuses on clarity. Instead of scattered tabs and
              disconnected information, the platform keeps search, filters,
              compare, and inquiry in one focused workspace.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                "Filter by city, state, course, fees, ratings, and facilities.",
                "Compare multiple schools or colleges side by side.",
                "View academic, infrastructure, and faculty snapshots quickly.",
                "Send inquiries directly to institutes that match your goals.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-3xl border border-slate-200/70 bg-white/70 p-4 text-sm leading-7 text-slate-600"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Institute Experience
            </p>
            <h2 className="heading-serif mt-3 text-3xl text-slate-900">
              Publish details once, keep them current continuously
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
              Institutes manage their own presence through a dedicated login,
              structured profile editor, gallery tools, and a response center
              for incoming student interest.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                "Create and update institutional profile information anytime.",
                "Add infrastructure, faculty, contact, and fee data in one place.",
                "Upload image and video gallery items to highlight the campus.",
                "Track inquiries and respond without switching systems.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-3xl border border-[rgba(223,109,60,0.16)] bg-[rgba(255,245,239,0.9)] p-4 text-sm leading-7 text-slate-600"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
