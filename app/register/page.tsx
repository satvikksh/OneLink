"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation"; // ✅ add

type FormState = {
  name: string;
  username: string;
  email: string;
  password: string;
  confirm: string;
  role: "student" | "recruiter" | "creator";
  accept: boolean;
};

type Errors = Partial<Record<keyof FormState | "global", string>>;

function strengthScore(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0..5
}

function barStyle(i: number, score: number) {
  const active = i < score;
  const palette = ["bg-red-500","bg-orange-500","bg-yellow-500","bg-lime-500","bg-emerald-600"];
  return `h-1.5 rounded ${active ? palette[Math.min(score-1, palette.length-1)] : "bg-gray-200"}`;
}

export default function RegisterPage() {
  const router = useRouter(); // ✅ add
  const [form, setForm] = useState<FormState>({
    name: "",
    username: "",
    email: "",
    password: "",
    confirm: "",
    role: "student",
    accept: false,
  });
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [success, setSuccess] = useState<string | null>(null);

  // Auto-generate username from name (only if user hasn't set their own)
  useEffect(() => {
    if (!form.name) return;
    if (
      !form.username ||
      (/^[a-z0-9\-]*$/.test(form.username) &&
        form.username.replace(/\d+$/,'') === slug(form.username.replace(/\d+$/,'')))
    ) {
      const s = slug(form.name);
      setForm(prev => ({ ...prev, username: s }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.name]);

  const pwScore = useMemo(() => strengthScore(form.password), [form.password]);
  const avatarLetter = (form.name.trim()[0] || "?").toUpperCase();

  function slug(v: string) {
    return v
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function validate(): Errors {
    const e: Errors = {};
    if (!form.name.trim()) e.name = "Please enter your full name.";
    if (!form.username.trim()) e.username = "Choose a username.";
    else if (!/^[a-z0-9-]{3,20}$/.test(form.username)) e.username = "3–20 chars, lowercase letters, numbers, hyphen.";
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email.";
    if (!form.password) e.password = "Create a password.";
    else if (pwScore < 3) e.password = "Use 8+ chars with mix of cases & numbers.";
    if (form.confirm !== form.password) e.confirm = "Passwords don’t match.";
    if (!form.accept) e.accept = "Please accept Terms & Privacy.";
    return e;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();


    const v = validate();
    setErrors(v);
    if (Object.keys(v).length) return;

    setLoading(true);

    // ⬇️ Only the fields your backend expects
    const payload = {
      name: form.name.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password, // backend will hash
      role: form.role,
    };

    const API_BASE =
      (typeof window !== "undefined" && (window as any).NEXT_PUBLIC_API_BASE) ||
      process.env.NEXT_PUBLIC_API_BASE ||
      "";

    const url = `${API_BASE}/api/auth/register`;

    // Abort after 12s to avoid hanging fetch
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 12000);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
        signal: ctrl.signal,
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // response may be empty on some server errors
      }

      if (!res.ok) {
        setErrors({ global: data?.error || `Registration failed (HTTP ${res.status}).` });
        return;
      }

      // ✅ success → optional banner here, but we’ll redirect shortly
      setSuccess("Account created successfully 🎉 Redirecting to sign in…");

      // Clear form
      setForm({
        name: "",
        username: "",
        email: "",
        password: "",
        confirm: "",
        role: "student",
        accept: false,
      });

      // ✅ redirect (prefer API-provided target, else fallback with a helpful flag)
      const redirectTo = (data && data.redirect) || "/login?registered=1";
      // small delay so users see the success message
      setTimeout(() => {
        router.push(redirectTo);
        // or use replace to prevent back navigation to register:
        // router.replace(redirectTo);
      }, 900);
    } catch (err: any) {
      if (err?.name === "AbortError") {
        setErrors({ global: "Request timed out. Check your connection and try again." });
      } else {
        setErrors({ global: "Network error. Please try again." });
      }
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Brand / Benefits */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-blue-100 blur-3xl opacity-70" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-indigo-100 blur-3xl opacity-60" />
          <div className="relative p-8 md:p-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md" />
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Join OneLink</h1>
            </div>
            <p className="text-slate-600 mb-8">
              Build your professional identity, connect with people, and share your work. Your next opportunity starts here.
            </p>

            <ul className="space-y-4">
              {[
                { t: "Create a standout profile", d: "Showcase your skills, projects, and achievements." },
                { t: "Grow your network", d: "Discover people in your field and send meaningful invites." },
                { t: "Share & learn", d: "Post updates, ask questions, and learn from others." },
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <div className="mt-1 size-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">✓</div>
                  <div>
                    <div className="font-semibold text-slate-900">{item.t}</div>
                    <div className="text-slate-600 text-sm">{item.d}</div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="text-sm text-slate-600">
                Already have an account?{" "}
                <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">Sign in</a>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="relative">
          <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-500 opacity-20 blur-2xl" />
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-xl">
            <form onSubmit={onSubmit} className="p-6 md:p-10">
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="size-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold"
                  aria-hidden
                >
                  {avatarLetter}
                </div>
                <div>
                  <div className="text-slate-900 font-semibold">Create your account</div>
                  <div className="text-slate-500 text-sm">Takes less than a minute</div>
                </div>
              </div>

              {errors.global && (
                <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                  {errors.global}
                </div>
              )}
              {success && (
                <div className="mb-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
                  {success}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className={`w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 ${
                      errors.name ? "border-red-300 focus:ring-red-100" : "border-slate-300 focus:ring-blue-100"
                    }`}
                    placeholder="Jane Doe"
                    autoComplete="name"
                  />
                  {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 text-slate-500 text-sm">
                      onelink.com/u/
                    </span>
                    <input
                      value={form.username}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, username: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))
                      }
                      className={`w-full rounded-r-lg border px-3 py-2 outline-none focus:ring-2 ${
                        errors.username ? "border-red-300 focus:ring-red-100" : "border-slate-300 focus:ring-blue-100"
                      }`}
                      placeholder="janedoe"
                      autoComplete="username"
                    />
                  </div>
                  {errors.username && <p className="text-xs text-red-600 mt-1">{errors.username}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    className={`w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 ${
                      errors.email ? "border-red-300 focus:ring-red-100" : "border-slate-300 focus:ring-blue-100"
                    }`}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                  {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                      className={`w-full rounded-lg border px-3 py-2 pr-10 outline-none focus:ring-2 ${
                        errors.password ? "border-red-300 focus:ring-red-100" : "border-slate-300 focus:ring-blue-100"
                      }`}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-sm"
                      aria-label="Toggle password"
                    >
                      {showPw ? "Hide" : "Show"}
                    </button>
                  </div>
                  <div className="flex gap-1 mt-2">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div key={i} className={`flex-1 ${barStyle(i, pwScore)}`} />
                    ))}
                  </div>
                  {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirm password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPw ? "text" : "password"}
                      value={form.confirm}
                      onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
                      className={`w-full rounded-lg border px-3 py-2 pr-10 outline-none focus:ring-2 ${
                        errors.confirm ? "border-red-300 focus:ring-red-100" : "border-slate-300 focus:ring-blue-100"
                      }`}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-sm"
                      aria-label="Toggle confirm password"
                    >
                      {showConfirmPw ? "Hide" : "Show"}
                    </button>
                  </div>
                  {errors.confirm && <p className="text-xs text-red-600 mt-1">{errors.confirm}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">I am a</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["student","recruiter","creator"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, role: opt }))}
                        className={`px-3 py-2 rounded-lg border text-sm ${
                          form.role === opt
                            ? "border-blue-600 bg-blue-50 text-blue-700"
                            : "border-slate-300 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-2 mt-6 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={form.accept}
                  onChange={(e) => setForm((p) => ({ ...p, accept: e.target.checked }))}
                  className="mt-0.5 size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-200"
                />
                <span>
                  I agree to the{" "}
                  <a className="text-blue-600 hover:text-blue-700" href="/legal/terms">Terms</a> and{" "}
                  <a className="text-blue-600 hover:text-blue-700" href="/legal/privacy">Privacy Policy</a>.
                </span>
              </label>
              {errors.accept && <p className="text-xs text-red-600 mt-1">{errors.accept}</p>}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2.5 font-medium hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? "Creating account…" : "Create account"}
          

              </button>

              <div className="mt-4 grid grid-cols-3 items-center gap-3">
                <div className="h-px bg-slate-200" />
                <div className="text-center text-xs text-slate-500">or continue with</div>
                <div className="h-px bg-slate-200" />
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                {["Google", "GitHub", "LinkedIn"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                    onClick={() => alert(`${p} auth coming soon`)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
