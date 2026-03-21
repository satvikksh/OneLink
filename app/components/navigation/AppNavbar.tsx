"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  Bell,
  Building2,
  ChevronDown,
  Compass,
  Home,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Palette,
  Sun,
  UserPlus,
  X,
} from "lucide-react";
import {
  AUTH_CHANGED_EVENT,
  COMPARE_CHANGED_EVENT,
  THEME_CHANGED_EVENT,
  emitClientEvent,
} from "../../src/lib/clientEvents";
import {
  applyTheme,
  COMPARE_STORAGE_KEY,
  normalizeTheme,
  resolveClientTheme,
  THEME_MODES,
  type ThemeMode,
} from "../../src/lib/theme";
import type { AppUser } from "../../src/types/education";

type QuickLink = {
  label: string;
  href: string;
  icon: typeof Home;
  badge?: number;
};

const THEME_ICONS = {
  light: Sun,
  dark: Moon,
  blue: Palette,
} as const;

const THEME_LABELS: Record<ThemeMode, string> = {
  light: "Light",
  dark: "Dark",
  blue: "Blue",
};

function readCompareCount() {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(COMPARE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

function initialsFromName(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase() || "").join("") || "OL";
}

// Helper to get theme‑aware Tailwind classes
const getThemeClasses = (theme: ThemeMode) => {
  switch (theme) {
    case "light":
      return "bg-white/80 border-white/90 text-gray-900";
    case "dark":
      return "bg-gray-900/80 border-gray-700/30 text-white";
    case "blue":
      return "bg-blue-50/80 border-blue-100/80 text-gray-900";
    default:
      return "bg-white/80 border-white/90 text-gray-900";
  }
};

export default function AppNavbar() {
  const pathname = usePathname();
  const safePathname = pathname || "/";
  const isWorkspaceRoute =
    safePathname.startsWith("/students/discover") ||
    safePathname.startsWith("/institutes/dashboard");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [user, setUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [compareCount, setCompareCount] = useState(0);
  const [inquiryCount, setInquiryCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navbarRef = useRef<HTMLElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);

  // Update spacer height when navbar height changes (scroll state affects padding)
  const updateSpacerHeight = useCallback(() => {
    if (navbarRef.current && spacerRef.current) {
      spacerRef.current.style.height = `${navbarRef.current.offsetHeight}px`;
    }
  }, []);

  useEffect(() => {
    updateSpacerHeight();
    const observer = new ResizeObserver(updateSpacerHeight);
    if (navbarRef.current) observer.observe(navbarRef.current);
    window.addEventListener("scroll", () => setScrolled(window.scrollY > 20));
    window.addEventListener("resize", updateSpacerHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateSpacerHeight);
      window.removeEventListener("scroll", () => setScrolled(window.scrollY > 20));
    };
  }, [updateSpacerHeight]);

  const syncThemeFromDom = useCallback(() => {
    const nextTheme =
      normalizeTheme(document.documentElement.getAttribute("data-theme")) ||
      resolveClientTheme();
    setThemeState(nextTheme);
  }, []);

  const refreshAuthState = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store", credentials: "include" });
      if (!response.ok) {
        setUser(null);
        setInquiryCount(0);
        return;
      }
      const data = await response.json().catch(() => ({}));
      const nextUser = (data?.user || null) as AppUser | null;
      setUser(nextUser);
      if (nextUser?.role === "institute") {
        const inquiryResponse = await fetch("/api/inquiries", { cache: "no-store", credentials: "include" });
        const inquiryData = await inquiryResponse.json().catch(() => ({}));
        const count = Array.isArray(inquiryData?.inquiries)
          ? inquiryData.inquiries.filter((item: { status?: string }) => item.status === "new").length
          : 0;
        setInquiryCount(count);
      } else {
        setInquiryCount(0);
      }
    } catch {
      setUser(null);
      setInquiryCount(0);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    syncThemeFromDom();
    setCompareCount(readCompareCount());
    const handleThemeChange = () => syncThemeFromDom();
    const handleAuthChange = () => {
      setAuthLoading(true);
      refreshAuthState();
    };
    const handleCompareChange = () => setCompareCount(readCompareCount());

    window.addEventListener(THEME_CHANGED_EVENT, handleThemeChange);
    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
    window.addEventListener(COMPARE_CHANGED_EVENT, handleCompareChange);

    return () => {
      window.removeEventListener(THEME_CHANGED_EVENT, handleThemeChange);
      window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
      window.removeEventListener(COMPARE_CHANGED_EVENT, handleCompareChange);
    };
  }, [refreshAuthState, syncThemeFromDom]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    setCompareCount(readCompareCount());
    setAuthLoading(true);
    refreshAuthState();
  }, [safePathname, refreshAuthState]);

  const setTheme = (nextTheme: ThemeMode) => {
    applyTheme(nextTheme);
    setThemeState(nextTheme);
  };

  const roleLabel = user?.role === "student" ? "Student" : user?.role === "institute" ? "Institute" : "Guest";
  const displayName = user?.organizationName || user?.name || "OneLink";
  const avatarText = initialsFromName(displayName);
  const avatarUrl = user?.avatarUrl || user?.profileImage || "";

  const quickLinks = useMemo<QuickLink[]>(() => {
    if (user?.role === "student") {
      return [
        { label: "Discover", href: "/students/discover", icon: Compass },
        { label: "Compare", href: "/students/discover", icon: Bell, badge: compareCount },
      ];
    }
    if (user?.role === "institute") {
      return [
        { label: "Dashboard", href: "/institutes/dashboard", icon: Building2 },
        { label: "Inquiries", href: "/institutes/dashboard", icon: Bell, badge: inquiryCount },
      ];
    }
    const guestLinks: QuickLink[] = [
      { label: "Home", href: "/", icon: Home },
      { label: "Students", href: "/students/login", icon: Compass },
      { label: "Institutes", href: "/institutes/login", icon: Building2 },
    ];

    return isWorkspaceRoute
      ? guestLinks.filter((item) => item.label !== "Home")
      : guestLinks;
  }, [compareCount, inquiryCount, isWorkspaceRoute, user?.role]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {}
    try {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("refresh_token");
    } catch {}
    emitClientEvent(AUTH_CHANGED_EVENT, { loggedOut: true });
    startTransition(() => {
      router.replace("/");
    });
  }

  // Common styles for nav links (active state based on path)
  const isLinkActive = (href: string) => href === "/" ? safePathname === "/" : safePathname.startsWith(href);

  return (
    <>
      {/* Navbar */}
      <nav
        ref={navbarRef}
        className={`
          fixed top-0 left-0 right-0 z-50
          transition-all duration-300 ease-out
          ${scrolled ? "py-2" : "py-4"}
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`
              backdrop-blur-xl rounded-2xl border shadow-lg transition-all duration-300
              ${scrolled ? "rounded-xl shadow-xl" : "rounded-2xl shadow-md"}
              ${getThemeClasses(theme)}
            `}
          >
            <div className="px-4 py-3 sm:px-6">
              {/* Main Row */}
              <div className="flex items-center justify-between gap-4">
                {/* Logo */}
                <Link
                  href="/"
                  className="flex items-center gap-3 group transition-transform hover:scale-[1.02]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-semibold shadow-md group-hover:shadow-lg transition-all">
                    OL
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-gray-500 dark:text-gray-400">
                      OneLink
                    </p>
                    <p className="text-lg font-semibold leading-tight">Education Hub</p>
                  </div>
                </Link>

                {/* Desktop Links */}
                <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
                  {quickLinks.map((item) => {
                    const Icon = item.icon;
                    const active = isLinkActive(item.href);
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        className={`
                          relative flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium
                          transition-all duration-200 hover:scale-105 hover:bg-black/5 dark:hover:bg-white/5
                          ${active ? "text-indigo-600 dark:text-indigo-400" : "text-gray-700 dark:text-gray-300"}
                        `}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                        {typeof item.badge === "number" && item.badge > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-sm">
                            {item.badge > 9 ? "9+" : item.badge}
                          </span>
                        )}
                        {active && (
                          <span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-indigo-500" />
                        )}
                      </Link>
                    );
                  })}
                </div>

                {/* Desktop Right Section */}
                <div className="hidden lg:flex items-center gap-3">
                  {/* Theme Switcher */}
                  <div className="flex items-center gap-1 rounded-full bg-black/5 dark:bg-white/5 p-1">
                    {THEME_MODES.map((mode) => {
                      const Icon = THEME_ICONS[mode];
                      const active = theme === mode;
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setTheme(mode)}
                          className={`
                            rounded-full p-2 transition-all duration-200
                            ${active
                              ? "bg-white shadow-sm text-indigo-600 dark:bg-gray-700 dark:text-indigo-400"
                              : "text-gray-600 hover:bg-black/10 dark:text-gray-400 dark:hover:bg-white/10"
                            }
                          `}
                          aria-label={`Switch to ${THEME_LABELS[mode]} theme`}
                        >
                          <Icon className="h-4 w-4" />
                        </button>
                      );
                    })}
                  </div>

                  {/* Auth Section */}
                  {authLoading ? (
                    <div className="h-10 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                  ) : user ? (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="flex items-center gap-2 rounded-full bg-black/5 dark:bg-white/5 px-3 py-1.5 transition-all hover:bg-black/10 dark:hover:bg-white/10"
                      >
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={displayName}
                            className="h-8 w-8 rounded-full object-cover ring-2 ring-indigo-200 dark:ring-indigo-700"
                          />
                        ) : (
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                            {avatarText}
                          </span>
                        )}
                        <div className="hidden sm:block text-left">
                          <p className="text-sm font-semibold leading-tight">{displayName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{roleLabel}</p>
                        </div>
                        <ChevronDown
                          className={`h-3 w-3 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      {userMenuOpen && (
                        <div
                          className="absolute right-0 mt-2 w-56 rounded-xl border bg-white dark:bg-gray-800 shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-2"
                          role="menu"
                        >
                          <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Signed in as</p>
                            <p className="text-sm font-semibold">{displayName}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setUserMenuOpen(false);
                              handleLogout();
                            }}
                            disabled={isPending}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <LogOut className="h-4 w-4" />
                            {isPending ? "Signing out..." : "Sign out"}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {!isWorkspaceRoute ? (
                        <Link
                          href="/login"
                          className="rounded-full px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/5"
                        >
                          <span className="inline-flex items-center gap-2">
                            <LogIn className="h-4 w-4" />
                            <span>Login</span>
                          </span>
                        </Link>
                      ) : null}
                      <Link
                        href="/register"
                        className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-indigo-700 hover:scale-105 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                      >
                        <span className="inline-flex items-center gap-2">
                          <UserPlus className="h-4 w-4" />
                          <span>Register</span>
                        </span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Mobile Menu Toggle */}
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden flex items-center justify-center rounded-full p-2 text-gray-700 transition-colors hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/5"
                  aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>

              {/* Desktop Status Bar */}
              <div className="hidden lg:flex mt-3 pt-3 border-t border-gray-200/30 dark:border-gray-700/30 text-xs text-gray-600 dark:text-gray-400 gap-2">
                <div className="rounded-full bg-black/5 dark:bg-white/5 px-3 py-1">Role: {roleLabel}</div>
                <div className="rounded-full bg-black/5 dark:bg-white/5 px-3 py-1">Theme: {THEME_LABELS[theme]}</div>
                <div className="rounded-full bg-black/5 dark:bg-white/5 px-3 py-1">
                  {user?.role === "student"
                    ? `Compare: ${compareCount}`
                    : user?.role === "institute"
                    ? `Inquiries: ${inquiryCount}`
                    : "Guest mode"}
                </div>
              </div>

              {/* Mobile Menu Drawer */}
              <div
                className={`
                  lg:hidden overflow-hidden transition-all duration-300 ease-in-out
                  ${mobileMenuOpen ? "max-h-[500px] opacity-100 mt-4" : "max-h-0 opacity-0"}
                `}
              >
                <div className="space-y-5 border-t border-gray-200/30 dark:border-gray-700/30 pt-5">
                  {/* Mobile Quick Links */}
                  <div className="grid gap-2 sm:grid-cols-2">
                    {quickLinks.map((item) => {
                      const Icon = item.icon;
                      const active = isLinkActive(item.href);
                      return (
                        <Link
                          key={`mobile-${item.label}`}
                          href={item.href}
                          className={`
                            flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium
                            transition-all hover:bg-black/5 dark:hover:bg-white/5
                            ${active ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" : ""}
                          `}
                        >
                          <span className="inline-flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </span>
                          {typeof item.badge === "number" && item.badge > 0 && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                              {item.badge > 9 ? "9+" : item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>

                  {/* Mobile Theme Switcher */}
                  <div className="flex flex-wrap gap-2">
                    {THEME_MODES.map((mode) => {
                      const Icon = THEME_ICONS[mode];
                      const active = theme === mode;
                      return (
                        <button
                          key={`mobile-${mode}`}
                          type="button"
                          onClick={() => setTheme(mode)}
                          className={`
                            flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-medium
                            transition-all
                            ${active
                              ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                              : "bg-black/5 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10"
                            }
                          `}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{THEME_LABELS[mode]}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Mobile Auth Section */}
                  {user ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 rounded-2xl bg-black/5 dark:bg-white/5 p-3">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={displayName}
                            className="h-10 w-10 rounded-full object-cover ring-2 ring-indigo-200 dark:ring-indigo-700"
                          />
                        ) : (
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                            {avatarText}
                          </span>
                        )}
                        <div className="flex-1">
                          <p className="font-semibold">{displayName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{roleLabel}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-400 transition-all hover:bg-red-100 dark:hover:bg-red-900/50"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {!isWorkspaceRoute ? (
                        <Link
                          href="/login"
                          className="flex items-center justify-center gap-2 rounded-full bg-black/5 dark:bg-white/5 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 transition-all hover:bg-black/10 dark:hover:bg-white/10"
                        >
                          <LogIn className="h-4 w-4" />
                          <span>Login</span>
                        </Link>
                      ) : null}
                      <Link
                        href="/register"
                        className="flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                      >
                        <UserPlus className="h-4 w-4" />
                        <span>Register</span>
                      </Link>
                    </div>
                  )}

                  {/* Mobile Status Chips */}
                  <div className="flex flex-wrap gap-2 pt-2 text-xs text-gray-600 dark:text-gray-400">
                    <div className="rounded-full bg-black/5 dark:bg-white/5 px-3 py-1">Role: {roleLabel}</div>
                    <div className="rounded-full bg-black/5 dark:bg-white/5 px-3 py-1">Theme: {THEME_LABELS[theme]}</div>
                    {user?.role === "student" && (
                      <div className="rounded-full bg-black/5 dark:bg-white/5 px-3 py-1">Compare: {compareCount}</div>
                    )}
                    {user?.role === "institute" && (
                      <div className="rounded-full bg-black/5 dark:bg-white/5 px-3 py-1">Inquiries: {inquiryCount}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Dynamic spacer to push content below navbar */}
      <div ref={spacerRef} className="w-full transition-all duration-300" />
    </>
  );
}
