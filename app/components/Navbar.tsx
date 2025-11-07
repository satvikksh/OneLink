"use client";

import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface NavItem {
  key: string;
  icon: string;
  label: string;
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

// ============================================================================
// CONSTANTS
// ============================================================================

const NAV_ITEMS: NavItem[] = [
  { key: "home", icon: "🏠", label: "Home" },
  { key: "network", icon: "👥", label: "My Network" },
  { key: "jobs", icon: "💼", label: "Jobs" },
  { key: "chat", icon: "💬", label: "Messaging" },
  { key: "notifications", icon: "🔔", label: "Notifications" },
];

const ADDITIONAL_ACTIONS = [
  { key: "business", icon: "🏢", label: "Business", message: "Business features coming soon!" },
  { key: "learning", icon: "📚", label: "Learning", message: "Learning center opening soon!" },
];

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const Logo: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
    aria-label="Go to home"
  >
    <div className="w-10 h-10 flex items-center justify-center rounded-sm overflow-hidden">
      <img
        src="/logo.png"
        alt="OneLink Logo"
        className="w-full h-full object-cover"
      />
    </div>
    <span className="hidden sm:block text-xl font-bold text-gray-900">
      OneLink
    </span>
  </button>
);

const SearchBar: React.FC<{
  value: string;
  onChange: (value: string) => void;
  className?: string;
  autoFocus?: boolean;
  onClose?: () => void;
}> = ({ value, onChange, className = "", autoFocus = false, onClose }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  useEffect(() => {
    // small demo suggestion logic (non-blocking)
    if (!value.trim()) return setSuggestions([]);
    const q = value.toLowerCase();
    setSuggestions(
      ["React", "Next.js", "TypeScript", "Node.js", "UI/UX", "OpenAI"]
        .filter(s => s.toLowerCase().includes(q))
        .slice(0, 5)
    );
  }, [value]);

  return (
    <div className={`relative w-full ${className}`}>
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <input
        type="text"
        placeholder="Search posts, people, jobs..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 pl-10 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all hover:bg-gray-200"
        autoFocus={autoFocus}
        aria-label="Search"
      />
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          aria-label="Close search"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* suggestions dropdown */}
      {suggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-md shadow-md z-30">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onChange(s)}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const NavButton: React.FC<{
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
  isMobile?: boolean;
}> = ({ item, isActive, onClick, isMobile = false }) => {
  if (isMobile) {
    return (
      <button
        onClick={onClick}
        className={`flex items-center space-x-3 w-full px-3 py-2 rounded-md text-left transition-colors ${
          isActive ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
        }`}
        aria-current={isActive ? "page" : undefined}
      >
        <span className="text-lg w-6" aria-hidden="true">{item.icon}</span>
        <span className="font-medium">{item.label}</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center px-4 py-2 rounded-md min-w-16 transition-all relative group ${
        isActive ? "text-gray-900" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
      }`}
      aria-current={isActive ? "page" : undefined}
      title={item.label}
    >
      <span className={`text-xl mb-1 transition-transform ${isActive ? "scale-110" : "group-hover:scale-105"}`} aria-hidden="true">
        {item.icon}
      </span>
      <span className="text-xs font-medium">{item.label}</span>

      {/* animated active indicator */}
      <span
        aria-hidden="true"
        className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0.5 h-0.5 rounded-full transition-all ${
          isActive ? "bg-blue-600 w-8 h-0.5 mt-1" : "bg-transparent"
        }`}
      />
    </button>
  );
};

const UserAvatar: React.FC<{ 
  initial: string; 
  onClick: () => void;
  className?: string;
}> = ({ initial, onClick, className = "" }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors ${className}`}
    aria-label="View profile"
  >
    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
      {initial}
    </div>
  </button>
);

const StatsBar: React.FC<{ stats: UserStats }> = ({ stats }) => (
  <div className="hidden md:block bg-gray-50 border-t border-gray-100">
    <div className="max-w-7xl mx-auto px-4 py-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-6">
          <div className="text-gray-600 flex items-center space-x-1">
            <span aria-hidden="true">👁️</span>
            <span>Profile views: <strong>42</strong></span>
          </div>
          <div className="text-gray-600 flex items-center space-x-1">
            <span aria-hidden="true">👥</span>
            <span>Connections: <strong>{stats.totalConnections}</strong></span>
          </div>
          <div className="text-gray-600 flex items-center space-x-1">
            <span aria-hidden="true">⭐</span>
            <span>Premium Member</span>
          </div>
        </div>
        <div className="text-green-600 flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full" aria-hidden="true" />
          <span>Online • Last active: 2m ago</span>
        </div>
      </div>
    </div>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const Navbar: React.FC<NavbarProps> = ({
  onPageChange,
  currentPage,
  onSearch,
  onCreatePost,
  userStats,
  userInitial = "Y",
}) => {
  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const navRef = useRef<HTMLElement | null>(null);

  // Memoized handlers
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    onSearch(query);
  }, [onSearch]);

  const handlePageChange = useCallback((page: string) => {
    onPageChange(page);
    setIsMobileMenuOpen(false);
  }, [onPageChange]);

  const handleActionClick = useCallback((message: string) => {
    alert(message);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  const toggleSearch = useCallback(() => {
    setIsSearchExpanded(prev => !prev);
  }, []);

  // Memoized default stats
  const defaultStats = useMemo(() => ({
    totalPosts: 0,
    totalLikes: 0,
    totalConnections: userStats?.totalConnections ?? 423,
  }), [userStats?.totalConnections]);

  const statsToDisplay = userStats || defaultStats;

  // set padding-top on main so fixed nav doesn't overlap content
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const height = el.getBoundingClientRect().height;
    // set CSS var
    document.documentElement.style.setProperty("--onelink-navbar-height", `${height}px`);
    // apply to first main if exists (so other files need not change)
    const main = document.querySelector("main");
    if (main) {
      (main as HTMLElement).style.paddingTop = `${height + 12}px`; // +12 for small breathing room
    }
    // cleanup on unmount or resize
    const ro = new ResizeObserver(() => {
      const h = el.getBoundingClientRect().height;
      document.documentElement.style.setProperty("--onelink-navbar-height", `${h}px`);
      const m = document.querySelector("main");
      if (m) (m as HTMLElement).style.paddingTop = `${h + 12}px`;
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty("--onelink-navbar-height");
      const m = document.querySelector("main");
      if (m) (m as HTMLElement).style.paddingTop = "";
    };
  }, []);

  // close avatar menu on outside click
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target) return;
      const menu = document.getElementById("onelink-avatar-menu");
      const avatar = document.getElementById("onelink-avatar-btn");
      if (!menu || !avatar) return;
      if (!menu.contains(target) && !avatar.contains(target)) {
        setShowAvatarMenu(false);
      }
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  return (
    <nav ref={navRef} className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-50">
      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Left Section */}
          <div className="flex items-center space-x-4 flex-1">
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Logo onClick={() => handlePageChange("home")} />
          </div>

          {/* Center Section - Search (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <SearchBar value={searchQuery} onChange={handleSearch} />
          </div>

          {/* Center Section - Navigation (Desktop) */}
          <div className="hidden lg:flex items-center justify-center space-x-1 flex-1">
            {NAV_ITEMS.map((item) => (
              <div key={item.key} className="relative group">
                <NavButton
                  item={item}
                  isActive={currentPage === item.key}
                  onClick={() => handlePageChange(item.key)}
                />
                {/* small tooltip on hover */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-[-2.25rem] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded-md">
                    {item.label}
                  </div>
                </div>
                {/* notifications badge for notifications item */}
                {item.key === "notifications" && unreadNotifications > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                    {unreadNotifications}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right Section - Desktop */}
          <div className="hidden lg:flex items-center space-x-2 flex-1 justify-end">
            {ADDITIONAL_ACTIONS.map((action) => (
              <button
                key={action.key}
                onClick={() => handleActionClick(action.message)}
                className="flex flex-col items-center px-3 py-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors min-w-16"
                title={action.label}
              >
                <span className="text-lg mb-1" aria-hidden="true">{action.icon}</span>
                <span className="text-xs font-medium">{action.label}</span>
              </button>
            ))}

            <button
              onClick={onCreatePost}
              className="bg-blue-600 text-white px-4 py-1.5 rounded-full hover:bg-blue-700 transition-colors text-sm font-medium flex items-center space-x-1"
              title="Create a post"
            >
              <span aria-hidden="true">+</span>
              <span>Post</span>
            </button>

            <div className="relative">
              <UserAvatar
                initial={userInitial}
                onClick={() => setShowAvatarMenu(v => !v)}
                className="ml-2"
              />
              {/* Avatar menu */}
              {showAvatarMenu && (
                <div
                  id="onelink-avatar-menu"
                  className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-md shadow-lg z-40"
                >
                  <button
                    onClick={() => { handlePageChange("profile"); setShowAvatarMenu(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={() => { alert("Settings coming soon"); setShowAvatarMenu(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50"
                  >
                    Settings
                  </button>
                  <div className="border-t border-gray-100" />
                  <button
                    onClick={() => { alert("Logged out (demo)"); setShowAvatarMenu(false); }}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Section - Mobile */}
          <div className="flex lg:hidden items-center space-x-2">
            <button
              onClick={toggleSearch}
              className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              aria-label="Toggle search"
              aria-expanded={isSearchExpanded}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            <UserAvatar 
              initial={userInitial}
              onClick={() => setShowAvatarMenu(v => !v)}
            />
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isSearchExpanded && (
          <div className="lg:hidden px-4 pb-3 border-t border-gray-200">
            <SearchBar
              value={searchQuery}
              onChange={handleSearch}
              autoFocus
              onClose={toggleSearch}
            />
          </div>
        )}

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <div className="px-2 py-3 space-y-1">
              {NAV_ITEMS.map((item) => (
                <NavButton
                  key={item.key}
                  item={item}
                  isActive={currentPage === item.key}
                  onClick={() => handlePageChange(item.key)}
                  isMobile
                />
              ))}

              <div className="border-t border-gray-200 pt-3 mt-3">
                {ADDITIONAL_ACTIONS.map((action) => (
                  <button
                    key={action.key}
                    onClick={() => handleActionClick(action.message)}
                    className="flex items-center space-x-3 w-full px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
                  >
                    <span className="text-lg w-6" aria-hidden="true">{action.icon}</span>
                    <span className="font-medium">{action.label}</span>
                  </button>
                ))}
                <button
                  onClick={() => { onCreatePost(); setIsMobileMenuOpen(false); }}
                  className="flex items-center space-x-3 w-full px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
                >
                  <span className="text-lg w-6" aria-hidden="true">+</span>
                  <span className="font-medium">Create Post</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <StatsBar stats={statsToDisplay} />
    </nav>
  );
};

export default Navbar;
