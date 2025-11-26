export async function authFetchMe() {
  const deviceKey =
    typeof window !== "undefined"
      ? window.localStorage.getItem("onelink_device_key") || ""
      : "";

  const res = await fetch("/api/auth/me", {
    method: "GET",
    cache: "no-store",
    credentials: "include",
    headers: {
      "x-device-key": deviceKey,
    },
  });

  const data = await res.json().catch(() => ({}));
  return { res, data };
}
