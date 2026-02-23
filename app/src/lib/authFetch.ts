// lib/authFetch.ts
export async function authFetch(url: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});

  try {
    if (typeof window !== "undefined") {
      const dk = localStorage.getItem("onelink_device_key");
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
      window.location.href = `/login?next=${next}`;
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
