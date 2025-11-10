// src/hooks/useLogout.ts
"use client";

export default function useLogout() {
  // Avoid calling React hooks (useRouter) here so this helper can be used
  // from non-component code; we'll use window.location to navigate instead.

  async function handleLogout() {
    try {
      // Backend se logout API call karega
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin", // send cookies
        headers: { "Content-Type": "application/json" },
      });

      // Agar token localStorage me save hai to remove kar do
      try {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("refresh_token");
      } catch (e) {
        console.warn("localStorage clear error:", e);
      }

      // Agar axios use kar rahe ho
      // import axios from "axios";
      // delete axios.defaults.headers.common["Authorization"];

      if (res.ok) {
        // login page pe redirect
        window.location.href = "/login";
      } else {
        const data = await res.json().catch(() => ({}));
        console.error("Logout failed:", data);
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("Logout request failed:", err);
      window.location.href = "/login";
    }
  }

  return { handleLogout };
}
