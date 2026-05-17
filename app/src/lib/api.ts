import { getStoredDeviceKey } from "./clientDevice";

export async function authFetchMe() {
  const deviceKey =
    typeof window !== "undefined"
      ? getStoredDeviceKey()
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
