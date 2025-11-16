// src/lib/device.ts
export function sanitizeDeviceKey(value: unknown): string | null {
  if (!value || typeof value !== "string") return null;
  const key = value.trim();
  if (!key || key.length > 200) return null;
  return key;
}

export function generateSignature(): string {
  try {
    if (typeof crypto !== "undefined" && (crypto as any).randomUUID) return (crypto as any).randomUUID();
    if (typeof crypto !== "undefined" && (crypto as any).getRandomValues) {
      const arr = new Uint8Array(16);
      (crypto as any).getRandomValues(arr);
      arr[6] = (arr[6] & 0x0f) | 0x40;
      arr[8] = (arr[8] & 0x3f) | 0x80;
      const hex = Array.from(arr, n => n.toString(16).padStart(2,"0"));
      return `${hex.slice(0,4).join("")}-${hex.slice(4,6).join("")}-${hex.slice(6,8).join("")}-${hex.slice(8,10).join("")}-${hex.slice(10,16).join("")}`;
    }
  } catch {}
  return 'fallback-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}
