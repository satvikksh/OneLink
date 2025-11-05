"use client";

import React, { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Invalid credentials");
      }

      setSuccess("Login successful 🎉 Redirecting...");
      // Example: redirect after success
      // setTimeout(() => window.location.href = "/", 1500);

    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
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
          <div className="text-sm bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg mb-3">
            {error}
          </div>
        )}
        {success && (
          <div className="text-sm bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg mb-3">
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none pr-10"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
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
              />
              Remember me
            </label>
            <a href="/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium">
              Forgot password?
            </a>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-60"
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
            >
              {provider}
            </button>
          ))}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-600">
          Don’t have an account?{" "}
          <a href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
            Create one
          </a>
        </p>
      </div>
    </div>
  );
}
