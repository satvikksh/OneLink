export const AUTH_CHANGED_EVENT = "onelink-auth-changed";
export const THEME_CHANGED_EVENT = "onelink-theme-changed";
export const COMPARE_CHANGED_EVENT = "onelink-compare-changed";

export function emitClientEvent(eventName: string, detail?: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent(eventName, { detail }));
}
