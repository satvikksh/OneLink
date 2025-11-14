'use client';

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // avoid state updates on unmounted component
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return; // prevent double-submit
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember }),
        credentials: "include", // ensure cookie is stored
        cache: "no-store",
      });

      // handle non-JSON or empty responses safely
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        // prefer server error message when available
        throw new Error(data?.error || data?.message || "Invalid credentials");
      }

      if (isMounted.current) setSuccess("Login successful 🎉 Redirecting...");

      // next param handle: /login?next=/something
      const next = searchParams?.get?.("next");
      const target = data?.redirect || next || "/";

      // small delay to show success state (optional)
      setTimeout(() => {
        // use router.push for client-side nav
        router.push(target);
      }, 600);
    } catch (err: any) {
      if (isMounted.current) setError(err?.message || "Something went wrong");
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-gray-50 to-blue-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Login to your OneLink account</p>
        </div>

        {/* Error or Success Message */}
        {error && (
          <div
            role="alert"
            className="text-sm bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg mb-3"
          >
            {error}
          </div>
        )}
        {success && (
          <div
            role="status"
            className="text-sm bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg mb-3"
          >
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              aria-required
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none pr-10"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                aria-required
              />
              <button
                type="button"
                aria-pressed={showPassword}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500"
                onClick={() => setShowPassword((s) => !s)}
                disabled={loading}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Remember Me + Forgot Password */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-600">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-200"
                disabled={loading}
              />
              Remember me
            </label>
            <Link href="/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium">
              Forgot password?
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-60"
            aria-disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* Divider */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="h-px w-20 bg-gray-200" />
          <span className="text-xs text-gray-500">or continue with</span>
          <div className="h-px w-20 bg-gray-200" />
        </div>

        {/* Social Logins */}
        <div className="mt-3 grid grid-cols-3 gap-3">
          {["Google", "GitHub", "LinkedIn"].map((provider) => (
            <button
              key={provider}
              type="button"
              onClick={() => alert(`${provider} login coming soon!`)}
              className="border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50"
              disabled={loading}
            >
              {provider}
            </button>
          ))}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-600">
          Don’t have an account?{" "}
          <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
