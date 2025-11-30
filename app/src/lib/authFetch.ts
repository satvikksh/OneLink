// lib/authFetch.ts
export async function authFetch(
  url: string,
  options: RequestInit = {},
) {
  const res = await fetch(url, { credentials: "include", ...options });
  if (res.status === 401) {
    // 401 → user is not authenticated → redirect once
    if (typeof window !== "undefined") {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?next=${next}`;
    }
    return null; // swallow error → caller receives null
  }
  if (!res.ok) {
    // other errors → return null instead of throwing
    return null;
  }
  if (res.status === 204) return null;
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return null;
  return res.json().catch(() => null);
}