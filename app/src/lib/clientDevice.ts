const DEVICE_KEY_STORAGE = "onelink-device-key";

function fallbackUuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function getOrCreateDeviceKey() {
  if (typeof window === "undefined") {
    return fallbackUuid();
  }

  const existing = window.localStorage.getItem(DEVICE_KEY_STORAGE);
  if (existing) return existing;

  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : fallbackUuid();

  window.localStorage.setItem(DEVICE_KEY_STORAGE, generated);
  return generated;
}

export function persistDeviceKey(deviceKey: string) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(DEVICE_KEY_STORAGE, deviceKey);
  document.cookie = `device_key=${encodeURIComponent(
    deviceKey
  )}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
}
