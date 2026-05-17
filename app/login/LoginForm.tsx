"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getOrCreateDeviceKey,
  getStoredDeviceKey,
  persistDeviceKey,
} from "../src/lib/clientDevice";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const isMounted = useRef(true);
  useEffect(() => { isMounted.current = true; return () => { isMounted.current = false; }; }, []);

  useEffect(() => { try { getOrCreateDeviceKey(); } catch {} }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const deviceKey = (typeof window !== 'undefined')
        ? (getStoredDeviceKey() || getOrCreateDeviceKey())
        : getOrCreateDeviceKey();

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember, deviceKey }),
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || "Invalid credentials");

      const effectiveKey = data?.signature || deviceKey;
      persistDeviceKey(effectiveKey);

      if (isMounted.current) setSuccess("Login successful 🎉 Redirecting...");
      const next = searchParams?.get("next") || data?.redirect || "/";
      setTimeout(() => router.replace(next), 600);
    } catch (err: any) {
      if (isMounted.current) setError(err?.message || "Something went wrong");
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-gray-50 to-blue-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Login to your OneLink account</p>
        </div>

        {error && <div className="text-sm bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg mb-3">{error}</div>}
        {success && <div className="text-sm bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg mb-3">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4 text-gray-950" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input id="email" name="email" type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
              placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input id="password" name="password" type={showPassword ? "text" : "password"}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none pr-10"
                placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
              <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">{showPassword ? "Hide" : "Show"}</button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-600">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="rounded border-gray-300 text-blue-600" />
              Remember me
            </label>
            <Link href="/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium">Forgot password?</Link>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-60">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="h-px w-20 bg-gray-200" />
          <span className="text-xs text-gray-500">or continue with</span>
          <div className="h-px w-20 bg-gray-200" />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-3">
          {["Google", "GitHub", "LinkedIn"].map((p) => (
            <button key={p} type="button" onClick={() => alert(`${p} login coming soon!`)} className="border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50">{p}</button>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don’t have an account? <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">Create one</Link>
        </p>
      </div>
    </div>
  );
}
