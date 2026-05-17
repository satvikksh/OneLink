export const DEVICE_KEY_STORAGE = "onelink-device-key";
const LEGACY_DEVICE_KEY_STORAGE = "onelink_device_key";

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

  const existing = getStoredDeviceKey();
  if (existing) return existing;

  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : fallbackUuid();

  window.localStorage.setItem(DEVICE_KEY_STORAGE, generated);
  return generated;
}

export function getStoredDeviceKey() {
  if (typeof window === "undefined") return "";

  const current = window.localStorage.getItem(DEVICE_KEY_STORAGE);
  if (current) return current;

  const legacy = window.localStorage.getItem(LEGACY_DEVICE_KEY_STORAGE);
  if (!legacy) return "";

  // Migrate older clients that used an underscore-based key so every
  // authenticated request reads the same device identity going forward.
  window.localStorage.setItem(DEVICE_KEY_STORAGE, legacy);
  window.localStorage.removeItem(LEGACY_DEVICE_KEY_STORAGE);
  return legacy;
}

export function persistDeviceKey(deviceKey: string) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(DEVICE_KEY_STORAGE, deviceKey);
  window.localStorage.removeItem(LEGACY_DEVICE_KEY_STORAGE);
  document.cookie = `device_key=${encodeURIComponent(
    deviceKey
  )}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
}

export function clearPersistedDeviceKey() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(DEVICE_KEY_STORAGE);
  window.localStorage.removeItem(LEGACY_DEVICE_KEY_STORAGE);
  document.cookie = "device_key=; path=/; max-age=0; samesite=lax";
}
