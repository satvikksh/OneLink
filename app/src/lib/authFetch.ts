// lib/authFetch.ts
import { getStoredDeviceKey } from "./clientDevice";

export async function authFetch(url: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});

  try {
    if (typeof window !== "undefined") {
      const dk = getStoredDeviceKey();
      if (dk) headers.set("x-device-key", dk);
    }
  } catch {}

  const method = (options.method || "GET").toUpperCase();
  if (!headers.get("Content-Type") && method !== "GET") {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, { credentials: "include", ...options, headers });
  const ct = res.headers.get("content-type") || "";

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      const pathname = window.location.pathname;
      const loginPath = pathname.startsWith("/students/")
        ? "/students/login"
        : pathname.startsWith("/institutes/")
        ? "/institutes/login"
        : "/login";
      window.location.href = `${loginPath}?next=${next}`;
    }

    let data: any = null;
    if (ct.includes("application/json")) {
      data = await res.json().catch(() => null);
    }
    throw new Error(data?.error || data?.message || "Unauthorized");
  }

  if (!res.ok) {
    if (ct.includes("application/json")) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || data?.message || `Request failed ${res.status}`);
    }
    throw new Error(`Request failed ${res.status}`);
  }

  if (res.status === 204) return null;
  if (!ct.includes("application/json")) return null;
  return res.json().catch(() => null);
}
