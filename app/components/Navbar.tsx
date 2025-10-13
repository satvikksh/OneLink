"use client";

import React, { useState, useCallback, useMemo } from "react";

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
}> = ({ value, onChange, className = "", autoFocus = false, onClose }) => (
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
  </div>
);

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
      className={`flex flex-col items-center px-4 py-2 rounded-md min-w-16 transition-all ${
        isActive ? "text-gray-900" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
      }`}
      aria-current={isActive ? "page" : undefined}
    >
      <span className="text-xl mb-1" aria-hidden="true">{item.icon}</span>
      <span className="text-xs font-medium">{item.label}</span>
      {isActive && (
        <div className="w-full h-0.5 bg-gray-900 mt-1 rounded-full" aria-hidden="true" />
      )}
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

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-50">
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
              <NavButton
                key={item.key}
                item={item}
                isActive={currentPage === item.key}
                onClick={() => handlePageChange(item.key)}
              />
            ))}
          </div>

          {/* Right Section - Desktop */}
          <div className="hidden lg:flex items-center space-x-2 flex-1 justify-end">
            {ADDITIONAL_ACTIONS.map((action) => (
              <button
                key={action.key}
                onClick={() => handleActionClick(action.message)}
                className="flex flex-col items-center px-3 py-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors min-w-16"
              >
                <span className="text-lg mb-1" aria-hidden="true">{action.icon}</span>
                <span className="text-xs font-medium">{action.label}</span>
              </button>
            ))}

            <button
              onClick={onCreatePost}
              className="bg-blue-600 text-white px-4 py-1.5 rounded-full hover:bg-blue-700 transition-colors text-sm font-medium flex items-center space-x-1"
            >
              <span aria-hidden="true">+</span>
              <span>Post</span>
            </button>

            <UserAvatar 
              initial={userInitial}
              onClick={() => handlePageChange("profile")}
              className="ml-2"
            />
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
              onClick={() => handlePageChange("profile")}
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
                  onClick={onCreatePost}
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