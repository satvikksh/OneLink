"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Briefcase,
  ChevronDown,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  Search,
  Settings,
  User,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface NavItem {
  key: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

interface UserStats {
  totalPosts: number;
  totalLikes: number;
  totalConnections: number;
}

interface NavbarProps {
  onPageChange: (page: string) => void;
  currentPage: string;
  onSearch: (query: string) => void;
  onCreatePost: () => void;
  userStats?: UserStats;
  userName?: string;
  userInitial?: string;
}

interface SearchUser {
  _id?: string;
  id?: string;
  name?: string;
  username?: string;
  email?: string;
  headline?: string | null;
  role?: string;
}

interface SearchInstitution {
  _id?: string;
  name?: string;
  institutionType?: "college" | "school";
  city?: string;
  state?: string;
}

type SearchResult =
  | {
      type: "user";
      id: string;
      title: string;
      subtitle: string;
      meta: string;
    }
  | {
      type: "college" | "school";
      id: string;
      title: string;
      subtitle: string;
      meta: string;
    };

const NAV_ITEMS: NavItem[] = [
  { key: "home", label: "Home", icon: Home },
  { key: "network", label: "Network", icon: Users },
  { key: "jobs", label: "Find", icon: Briefcase },
  { key: "chat", label: "Messages", icon: MessageSquare },
  { key: "notifications", label: "Alerts", icon: Bell },
];

const SEARCH_HINTS = [
  "Search users",
  "Search colleges",
  "Search schools",
];

function getDeviceKey() {
  try {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("onelink_device_key") || "";
  } catch {
    return "";
  }
}

function useDebounce<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

function useClickOutside<T extends HTMLElement>(onOutside: () => void) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(event.target as Node)) onOutside();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onOutside]);

  return ref;
}

const Navbar: React.FC<NavbarProps> = ({
  onPageChange,
  currentPage,
  onSearch,
  onCreatePost,
  userStats,
  userName = "User",
  userInitial = "U",
}) => {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchError, setSearchError] = useState("");

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useClickOutside<HTMLDivElement>(() => setDropdownOpen(false));

  const debouncedQuery = useDebounce(searchQuery, 300);

  const navItems = useMemo(
    () =>
      NAV_ITEMS.map((item) => {
        if (item.key === "network" && userStats?.totalConnections) {
          return {
            ...item,
            badge: userStats.totalConnections > 99 ? 99 : userStats.totalConnections,
          };
        }
        return item;
      }),
    [userStats?.totalConnections]
  );

  const groupedResults = useMemo(() => {
    return {
      users: searchResults.filter((r) => r.type === "user"),
      colleges: searchResults.filter((r) => r.type === "college"),
      schools: searchResults.filter((r) => r.type === "school"),
    };
  }, [searchResults]);

  useEffect(() => {
    onSearch(debouncedQuery);
  }, [debouncedQuery, onSearch]);

  useEffect(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (q.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError("");
      return;
    }

    let active = true;
    (async () => {
      setSearchLoading(true);
      setSearchError("");

      try {
        const headers = new Headers();
        const deviceKey = getDeviceKey();
        if (deviceKey) headers.set("x-device-key", deviceKey);

        const [usersRes, instRes] = await Promise.all([
          fetch("/api/users", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            headers,
          }),
          fetch("/api/institutions", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            headers,
          }),
        ]);

        const usersJson = await usersRes.json().catch(() => ({}));
        const instJson = await instRes.json().catch(() => ({}));
        if (!active) return;

        const users: SearchUser[] = Array.isArray(usersJson?.users) ? usersJson.users : [];
        const institutions: SearchInstitution[] = Array.isArray(instJson?.institutions) ? instJson.institutions : [];

        const userMatches: SearchResult[] = users
          .filter((u) => {
            const hay = [
              u.name || "",
              u.username || "",
              u.email || "",
              u.headline || "",
              u.role || "",
            ]
              .join(" ")
              .toLowerCase();
            return hay.includes(q);
          })
          .slice(0, 6)
          .map((u, idx) => ({
            type: "user" as const,
            id: String(u._id || u.id || `u-${idx}`),
            title: u.name || u.username || "Unknown User",
            subtitle: u.headline || `@${u.username || "user"}`,
            meta: u.role || "member",
          }));

        const institutionMatches: SearchResult[] = institutions
          .filter((i) => {
            const hay = [
              i.name || "",
              i.institutionType || "",
              i.city || "",
              i.state || "",
            ]
              .join(" ")
              .toLowerCase();
            return hay.includes(q);
          })
          .slice(0, 8)
          .map((i, idx) => ({
            type: i.institutionType === "school" ? "school" : "college",
            id: String(i._id || `i-${idx}`),
            title: i.name || "Unnamed Institution",
            subtitle: [i.city, i.state].filter(Boolean).join(", ") || "Location unavailable",
            meta: i.institutionType === "school" ? "School" : "College",
          }));

        setSearchResults([...userMatches, ...institutionMatches]);
      } catch {
        if (!active) return;
        setSearchError("Search failed. Please try again.");
        setSearchResults([]);
      } finally {
        if (active) setSearchLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const inInput = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;

      if (event.key === "/" && !inInput) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }

      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        setMobileSearchOpen(false);
        setDropdownOpen(false);
        setSearchFocused(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handlePage = useCallback(
    (page: string) => {
      onPageChange(page);
      setMobileMenuOpen(false);
      setMobileSearchOpen(false);
      setDropdownOpen(false);
    },
    [onPageChange]
  );

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      window.location.href = "/login";
    } catch {
      alert("Logout failed. Try again.");
    }
  }, []);

  const handleSearchResultClick = (item: SearchResult) => {
    setSearchQuery(item.title);
    setSearchFocused(false);
    setMobileSearchOpen(false);

    if (item.type === "user") {
      handlePage("network");
      return;
    }
    handlePage("jobs");
  };

  const renderSearchDropdown = () => {
    const hasQuery = debouncedQuery.trim().length >= 2;
    const hasResults = searchResults.length > 0;
    const showDropdown = searchFocused && (hasQuery || searchQuery.trim().length === 0);

    if (!showDropdown) return null;

    return (
      <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-2 z-50">
        {!hasQuery && (
          <div className="p-2">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Try searching</p>
            <div className="space-y-1">
              {SEARCH_HINTS.map((hint) => (
                <button
                  key={hint}
                  onMouseDown={() => setSearchQuery(hint)}
                  className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        )}

        {hasQuery && searchLoading && (
          <div className="px-3 py-3 text-sm text-gray-500">Searching database...</div>
        )}

        {hasQuery && !searchLoading && searchError && (
          <div className="px-3 py-3 text-sm text-red-600">{searchError}</div>
        )}

        {hasQuery && !searchLoading && !searchError && !hasResults && (
          <div className="px-3 py-3 text-sm text-gray-500">No users, colleges, or schools found.</div>
        )}

        {hasQuery && !searchLoading && !searchError && hasResults && (
          <div className="max-h-80 overflow-y-auto space-y-2">
            {groupedResults.users.length > 0 && (
              <div>
                <p className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">Users</p>
                {groupedResults.users.map((item) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    onMouseDown={() => handleSearchResultClick(item)}
                    className="w-full text-left rounded-lg px-3 py-2 hover:bg-gray-100"
                  >
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-600">{item.subtitle}</p>
                  </button>
                ))}
              </div>
            )}

            {groupedResults.colleges.length > 0 && (
              <div>
                <p className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">Colleges</p>
                {groupedResults.colleges.map((item) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    onMouseDown={() => handleSearchResultClick(item)}
                    className="w-full text-left rounded-lg px-3 py-2 hover:bg-gray-100"
                  >
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-600">{item.subtitle}</p>
                  </button>
                ))}
              </div>
            )}

            {groupedResults.schools.length > 0 && (
              <div>
                <p className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">Schools</p>
                {groupedResults.schools.map((item) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    onMouseDown={() => handleSearchResultClick(item)}
                    className="w-full text-left rounded-lg px-3 py-2 hover:bg-gray-100"
                  >
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-600">{item.subtitle}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-16 flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="lg:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <button onClick={() => handlePage("home")} className="flex items-center gap-2 shrink-0" aria-label="Go home">
              <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                <img src="/logo1.png" alt="OneLink" className="w-8 h-8 object-contain" />
              </div>
              <span className="text-lg font-bold text-gray-900">OneLink</span>
            </button>

            <div className="hidden md:block relative w-72 lg:w-96">
              <div className="flex items-center w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 120)}
                  placeholder="Search users, colleges, schools... (Press /)"
                  className="w-full bg-transparent px-2 text-sm text-gray-800 outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                      setSearchError("");
                    }}
                    className="text-gray-400 hover:text-gray-600 shrink-0"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {renderSearchDropdown()}
            </div>

            <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = currentPage === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => handlePage(item.key)}
                    className={`relative px-3 py-2 rounded-lg min-w-[76px] transition ${
                      active ? "text-blue-700 bg-blue-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <Icon className="w-5 h-5" />
                        {item.badge && item.badge > 0 && (
                          <span className="absolute -top-2 -right-3 min-w-4 px-1 h-4 rounded-full bg-red-500 text-white text-[10px] leading-4">
                            {item.badge > 9 ? "9+" : item.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-xs mt-1">{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={onCreatePost}
                className="hidden md:flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Post</span>
              </button>

              <button
                onClick={() => setMobileSearchOpen((prev) => !prev)}
                className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
                aria-label="Toggle mobile search"
              >
                <Search className="w-5 h-5" />
              </button>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-100"
                  aria-label="User menu"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold flex items-center justify-center">
                    {userInitial}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-600 transition ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl p-2">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                      <p className="text-xs text-gray-500">Manage your account</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-2">
                      <div className="rounded-lg bg-gray-50 p-2 text-center">
                        <p className="text-xs text-gray-500">Posts</p>
                        <p className="text-sm font-semibold text-gray-900">{userStats?.totalPosts ?? 0}</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-2 text-center">
                        <p className="text-xs text-gray-500">Likes</p>
                        <p className="text-sm font-semibold text-gray-900">{userStats?.totalLikes ?? 0}</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-2 text-center">
                        <p className="text-xs text-gray-500">Network</p>
                        <p className="text-sm font-semibold text-gray-900">{userStats?.totalConnections ?? 0}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handlePage("profile")}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-sm text-gray-700"
                    >
                      <User className="w-4 h-4" />
                      My Profile
                    </button>
                    <button
                      onClick={() => alert("Settings coming soon")}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-sm text-gray-700"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 text-sm text-red-600"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {mobileSearchOpen && (
          <div className="md:hidden border-t border-gray-200 px-4 pb-4 pt-3 bg-white">
            <div className="flex items-center w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 120)}
                placeholder="Search users, colleges, schools..."
                className="w-full bg-transparent px-2 text-sm text-gray-800 outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-gray-400 hover:text-gray-600 shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white px-3 py-4">
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = currentPage === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => handlePage(item.key)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg ${
                      active ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </span>
                    {item.badge && item.badge > 0 && (
                      <span className="text-xs bg-red-500 text-white rounded-full px-2 py-0.5">
                        {item.badge > 9 ? "9+" : item.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  router.push("/institutions/new");
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                <Plus className="w-5 h-5" />
                <span>New Institute</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onCreatePost();
                }}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                <span>Create Post</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t border-gray-200">
        <div className="grid grid-cols-5 px-1 py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handlePage(item.key)}
                className={`flex flex-col items-center justify-center py-2 rounded-md text-[11px] ${
                  active ? "text-blue-700 bg-blue-50" : "text-gray-600"
                }`}
              >
                <Icon className="w-4 h-4 mb-1" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default React.memo(Navbar);
