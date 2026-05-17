"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { getOrCreateDeviceKey, persistDeviceKey } from "../../src/lib/clientDevice";
import { emitClientEvent, AUTH_CHANGED_EVENT } from "../../src/lib/clientEvents";
import type { AccountRole } from "../../src/types/education";

type AuthFormProps = {
  mode: "login" | "register";
  role: AccountRole;
};

type FormState = {
  name: string;
  organizationName: string;
  email: string;
  password: string;
  confirmPassword: string;
  remember: boolean;
};

const copy = {
  student: {
    register: {
      heading: "Build your student discovery account",
      description:
        "Register to search institutions, compare options side by side, and reach out directly.",
      endpoint: "/api/auth/student/register",
      alternateLabel: "Already registered?",
      alternateHref: "/students/login",
      alternateAction: "Student Login",
    },
    login: {
      heading: "Welcome back, student",
      description:
        "Sign in to continue exploring schools and colleges with saved context.",
      endpoint: "/api/auth/student/login",
      alternateLabel: "Need an account?",
      alternateHref: "/students/register",
      alternateAction: "Student Register",
    },
  },
  institute: {
    register: {
      heading: "Create your institute workspace",
      description:
        "Set up a dedicated institute account to publish profile details, gallery items, and replies.",
      endpoint: "/api/auth/institute/register",
      alternateLabel: "Already have an institute account?",
      alternateHref: "/institutes/login",
      alternateAction: "Institute Login",
    },
    login: {
      heading: "Return to your institute dashboard",
      description:
        "Sign in to update profile information, manage inquiries, and keep listings current.",
      endpoint: "/api/auth/institute/login",
      alternateLabel: "Need a new institute workspace?",
      alternateHref: "/institutes/register",
      alternateAction: "Institute Register",
    },
  },
};

const benefits = {
  student: [
    "Advanced filters across location, courses, fees, and facilities.",
    "Shortlist multiple institutions and compare them in one grid.",
    "Send focused inquiries without leaving the discovery flow.",
  ],
  institute: [
    "Publish structured details about academics, fees, and facilities.",
    "Manage image and video gallery items in the same dashboard.",
    "Receive student inquiries and reply from a single workspace.",
  ],
};

const roleHome = {
  student: "/students/discover",
  institute: "/institutes/dashboard",
} as const;

function getSafeNextPath(rawNext: string | null | undefined, role: AccountRole) {
  const fallback = roleHome[role];
  if (!rawNext || !rawNext.startsWith("/") || rawNext.startsWith("//")) {
    return fallback;
  }

  const authPaths = [
    "/login",
    "/register",
    "/students/login",
    "/students/register",
    "/institutes/login",
    "/institutes/register",
  ];

  if (authPaths.some((path) => rawNext === path || rawNext.startsWith(`${path}?`))) {
    return fallback;
  }

  if (role === "student" && rawNext.startsWith("/institutes/")) {
    return fallback;
  }

  if (role === "institute" && rawNext.startsWith("/students/")) {
    return fallback;
  }

  return rawNext;
}

export default function AuthForm({ mode, role }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: "",
    organizationName: "",
    email: "",
    password: "",
    confirmPassword: "",
    remember: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(
    searchParams?.get("registered") === "1"
      ? "Account created successfully. You can sign in now."
      : null
  );
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(mode === "login");

  const pageCopy = copy[role][mode];
  const passwordScore = useMemo(() => {
    let score = 0;
    if (form.password.length >= 8) score += 1;
    if (/[A-Z]/.test(form.password)) score += 1;
    if (/[a-z]/.test(form.password)) score += 1;
    if (/\d/.test(form.password)) score += 1;
    if (/[^A-Za-z0-9]/.test(form.password)) score += 1;
    return score;
  }, [form.password]);

  const updateForm = (key: keyof FormState, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  useEffect(() => {
    if (mode !== "login") return;

    let active = true;

    async function redirectIfAlreadyAuthenticated() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });

        if (!response.ok) return;

        const data = await response.json().catch(() => ({}));
        const currentRole = data?.user?.role;
        if (
          !active ||
          (currentRole !== "student" && currentRole !== "institute")
        ) {
          return;
        }

        const nextPath = getSafeNextPath(searchParams?.get("next"), currentRole);
        router.replace(nextPath);
        router.refresh();
      } finally {
        if (active) setCheckingSession(false);
      }
    }

    redirectIfAlreadyAuthenticated();

    return () => {
      active = false;
    };
  }, [mode, router, searchParams]);

  const validate = () => {
    if (!form.email.trim() || !form.password) {
      return "Email and password are required.";
    }

    if (mode === "register") {
      if (!form.name.trim()) return "Please enter your name.";
      if (role === "institute" && !form.organizationName.trim()) {
        return "Institute name is required.";
      }
      if (form.password.length < 8) {
        return "Password must be at least 8 characters long.";
      }
      if (form.password !== form.confirmPassword) {
        return "Passwords do not match.";
      }
    }

    return null;
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const deviceKey = getOrCreateDeviceKey();
      const payload =
        mode === "register"
          ? {
              name: form.name.trim(),
              organizationName:
                role === "institute" ? form.organizationName.trim() : undefined,
              email: form.email.trim(),
              password: form.password,
              deviceKey,
            }
          : {
              email: form.email.trim(),
              password: form.password,
              remember: form.remember,
              deviceKey,
            };

      const response = await fetch(pageCopy.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.error || "Unable to continue right now.");
        return;
      }

      if (data?.signature) {
        persistDeviceKey(data.signature);
      }

      emitClientEvent(AUTH_CHANGED_EVENT, {
        role,
        mode,
      });

      setSuccess(data?.message || "Success.");
      const nextPath = getSafeNextPath(
        searchParams?.get("next") || data?.redirect,
        role
      );

      startTransition(() => {
        router.replace(nextPath);
        router.refresh();
      });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.88fr_1.12fr]">
        <aside className="glass-panel-strong rounded-[2rem] p-6 sm:p-8">
          <Link
            href="/"
            className="inline-flex rounded-full border border-slate-300/80 bg-white/70 px-4 py-2 text-sm text-slate-700 transition hover:bg-white"
          >
            Back Home
          </Link>
          <div className="mt-8 space-y-5">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              {role === "student" ? "Student Auth" : "Institute Auth"}
            </p>
            <h1 className="heading-serif text-4xl text-slate-900">
              {pageCopy.heading}
            </h1>
            <p className="max-w-xl text-base leading-8 text-slate-600">
              {pageCopy.description}
            </p>
          </div>

          <div className="mt-8 space-y-4">
            {benefits[role].map((item, index) => (
              <div
                key={item}
                className={`rounded-3xl border p-4 text-sm leading-7 ${
                  index % 2 === 0
                    ? "border-slate-200/80 bg-white/80 text-slate-600"
                    : "border-[rgba(223,109,60,0.14)] bg-[rgba(255,245,239,0.88)] text-slate-600"
                }`}
              >
                {item}
              </div>
            ))}
          </div>
        </aside>

        <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                {mode === "register" ? "Create account" : "Sign in"}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {pageCopy.alternateLabel}{" "}
                <Link
                  href={pageCopy.alternateHref}
                  className="font-semibold text-[var(--accent-deep)]"
                >
                  {pageCopy.alternateAction}
                </Link>
              </p>
            </div>
            <Link
              href={mode === "register" ? "/register" : "/login"}
              className="rounded-full border border-slate-300/80 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.18em] text-slate-600"
            >
              Switch Module
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {success ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </div>
            ) : null}
            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {mode === "register" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-700">
                  <span>{role === "student" ? "Full Name" : "Contact Person"}</span>
                  <input
                    value={form.name}
                    onChange={(event) => updateForm("name", event.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[var(--forest)]"
                    placeholder={
                      role === "student" ? "Aarav Sharma" : "Admissions Office"
                    }
                  />
                </label>

                {role === "institute" ? (
                  <label className="space-y-2 text-sm text-slate-700">
                    <span>Institute Name</span>
                    <input
                      value={form.organizationName}
                      onChange={(event) =>
                        updateForm("organizationName", event.target.value)
                      }
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                      placeholder="Riverstone College"
                    />
                  </label>
                ) : null}
              </div>
            ) : null}

            <label className="block space-y-2 text-sm text-slate-700">
              <span>Email Address</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateForm("email", event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[var(--forest)]"
                placeholder="hello@example.com"
              />
            </label>

            <label className="block space-y-2 text-sm text-slate-700">
              <span>Password</span>
              <div className="rounded-2xl border border-slate-300 bg-white px-4 py-3">
                <div className="flex items-center gap-3">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(event) => updateForm("password", event.target.value)}
                    className="w-full outline-none"
                    placeholder="Enter a secure password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="text-sm font-semibold text-slate-500"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {mode === "register" ? (
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {new Array(5).fill(null).map((_, index) => (
                      <div
                        key={index}
                        className={`h-1.5 rounded-full ${
                          index < passwordScore
                            ? role === "student"
                              ? "bg-[var(--forest)]"
                              : "bg-[var(--accent)]"
                            : "bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </label>

            {mode === "register" ? (
              <label className="block space-y-2 text-sm text-slate-700">
                <span>Confirm Password</span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(event) =>
                    updateForm("confirmPassword", event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                  placeholder="Re-enter your password"
                />
              </label>
            ) : (
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={(event) => updateForm("remember", event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Remember this device
              </label>
            )}

            <button
              type="submit"
              disabled={loading || isPending || checkingSession}
              className={`w-full rounded-full px-5 py-3 text-sm font-semibold text-white transition disabled:opacity-70 ${
                role === "student"
                  ? "bg-[var(--forest)]"
                  : "bg-[var(--accent)]"
              }`}
            >
              {checkingSession
                ? "Checking session..."
                : loading || isPending
                ? "Please wait..."
                : mode === "register"
                ? role === "student"
                  ? "Create Student Account"
                  : "Create Institute Account"
                : role === "student"
                ? "Sign In as Student"
                : "Sign In as Institute"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
