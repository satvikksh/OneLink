// app/login/page.tsx
'use client';

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const DEVICE_KEY_STORAGE = 'onelink_device_key';

function getOrCreateDeviceKey(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
      return (crypto as any).randomUUID();
    }
    if (typeof crypto !== 'undefined' && (crypto as any).getRandomValues) {
      const arr = new Uint8Array(16);
      (crypto as any).getRandomValues(arr);
      arr[6] = (arr[6] & 0x0f) | 0x40;
      arr[8] = (arr[8] & 0x3f) | 0x80;
      const hex = Array.from(arr, (n) => n.toString(16).padStart(2, '0'));
      return `${hex.slice(0,4).join('')}-${hex.slice(4,6).join('')}-${hex.slice(6,8).join('')}-${hex.slice(8,10).join('')}-${hex.slice(10,16).join('')}`;
    }
  } catch {}
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function ensureDeviceKeyStored(): string {
  try {
    const existing = typeof window !== 'undefined' ? window.localStorage.getItem(DEVICE_KEY_STORAGE) : null;
    if (existing && existing.length > 5) return existing;
    const newKey = getOrCreateDeviceKey();
    try { window.localStorage.setItem(DEVICE_KEY_STORAGE, newKey); } catch {}
    return newKey;
  } catch {
    return getOrCreateDeviceKey();
  }
}

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

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    try { ensureDeviceKeyStored(); } catch (e) { console.warn('deviceKey init failed', e); }
  }, []);

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
        ? (window.localStorage.getItem(DEVICE_KEY_STORAGE) || ensureDeviceKeyStored())
        : getOrCreateDeviceKey();

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember, deviceKey }),
        credentials: "include",
        cache: "no-store",
      });

      let data: any = {};
      try { data = await res.json(); } catch { data = {}; }

      if (!res.ok) {
        throw new Error(data?.error || data?.message || "Invalid credentials");
      }

      // Save signature from server if present (server may generate it)
      const effectiveKey = data?.signature || deviceKey;
      try { window.localStorage.setItem(DEVICE_KEY_STORAGE, effectiveKey); } catch {}

      // Also set a non-HttpOnly cookie as fallback for the server to read immediately
      try {
        const cookieValue = encodeURIComponent(effectiveKey);
        // do not use 'Secure' here in dev unless using https; samesite=lax
        document.cookie = `device_key=${cookieValue}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
      } catch (cookieErr) {
        console.warn("Could not set device_key cookie", cookieErr);
      }

      // Optional immediate verification to avoid redirect bounce:
      try {
        const verifyKey = window.localStorage.getItem(DEVICE_KEY_STORAGE) || effectiveKey || "";
        await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          headers: { "x-device-key": verifyKey },
          cache: "no-store",
        });
      } catch (verifyErr) {
        // ignore — best-effort
        console.warn("me verify failed after login", verifyErr);
      }

      if (isMounted.current) setSuccess("Login successful 🎉 Redirecting...");

      const next = searchParams?.get?.("next");
      const target = data?.redirect || next || "/";

      setTimeout(() => { router.push(target); }, 600);
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

        {error && <div role="alert" className="text-sm bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg mb-3">{error}</div>}
        {success && <div role="status" className="text-sm bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg mb-3">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4 text-gray-950" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input id="email" name="email" type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
              placeholder="you@example.com" value={email} onChange={(e)=>setEmail(e.target.value)} autoComplete="email" required />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input id="password" name="password" type={showPassword ? "text" : "password"}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none pr-10"
                placeholder="••••••••" value={password} onChange={(e)=>setPassword(e.target.value)} autoComplete="current-password" required />
              <button type="button" aria-pressed={showPassword} onClick={()=>setShowPassword(s=>!s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">{showPassword ? "Hide" : "Show"}</button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-600">
              <input type="checkbox" checked={remember} onChange={(e)=>setRemember(e.target.checked)} className="rounded border-gray-300 text-blue-600" />
              Remember me
            </label>
            <Link href="/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium">Forgot password?</Link>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-60">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="h-px w-20 bg-gray-200" />
          <span className="text-xs text-gray-500">or continue with</span>
          <div className="h-px w-20 bg-gray-200" />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-3">
          {["Google","GitHub","LinkedIn"].map(p => (
            <button key={p} type="button" onClick={()=>alert(`${p} login coming soon!`)}
              className="border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50">{p}</button>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don’t have an account? <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">Create one</Link>
        </p>
      </div>
    </div>
  );
}
