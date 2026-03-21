import Link from "next/link";

type ModuleChoiceProps = {
  mode: "login" | "register";
};

const moduleCopy = {
  login: {
    heading: "Choose where you want to sign in",
    subheading:
      "Separate authentication paths keep the student experience and institute workspace focused.",
    studentHref: "/students/login",
    instituteHref: "/institutes/login",
    studentAction: "Student Login",
    instituteAction: "Institute Login",
  },
  register: {
    heading: "Choose the account you want to create",
    subheading:
      "Set up either a student discovery account or an institute management workspace.",
    studentHref: "/students/register",
    instituteHref: "/institutes/register",
    studentAction: "Student Register",
    instituteAction: "Institute Register",
  },
};

export default function ModuleChoice({ mode }: ModuleChoiceProps) {
  const copy = moduleCopy[mode];

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="rounded-full border border-slate-300/80 bg-white/70 px-4 py-2 text-sm text-slate-700 transition hover:bg-white"
          >
            Back Home
          </Link>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
            OneLink Modules
          </p>
        </div>

        <section className="glass-panel-strong rounded-[2rem] px-6 py-8 sm:px-8 sm:py-10">
          <div className="max-w-3xl space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Module selector
            </p>
            <h1 className="heading-serif text-4xl text-slate-900 sm:text-5xl">
              {copy.heading}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              {copy.subheading}
            </p>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <article className="rounded-[2rem] border border-slate-200/70 bg-white/85 p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--forest)]">
                Student Module
              </p>
              <h2 className="heading-serif mt-3 text-3xl text-slate-900">
                Explore, filter, compare
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-600">
                Students can discover institutions through search filters,
                compare shortlisted options side by side, and send direct
                inquiries to the institutes they care about.
              </p>
              <Link
                href={copy.studentHref}
                className="mt-6 inline-flex rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white"
              >
                {copy.studentAction}
              </Link>
            </article>

            <article className="rounded-[2rem] border border-[rgba(223,109,60,0.2)] bg-[rgba(255,245,239,0.92)] p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent-deep)]">
                Institute Module
              </p>
              <h2 className="heading-serif mt-3 text-3xl text-slate-900">
                Manage profile, gallery, and inquiries
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-600">
                Institutes receive a dedicated workspace to maintain academic
                and campus details, keep gallery content fresh, and respond to
                student requests in one place.
              </p>
              <Link
                href={copy.instituteHref}
                className="mt-6 inline-flex rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white"
              >
                {copy.instituteAction}
              </Link>
            </article>
          </div>
        </section>
      </div>
    </div>
  );
}
