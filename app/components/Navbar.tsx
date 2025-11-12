"use client";

import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Search, Home, Users, Briefcase, MessageSquare, Bell, Menu, X, Plus, ChevronDown, User, Settings, LogOut } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface NavItem {
  key: string;
  icon: React.ElementType;
  label: string;
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

// ============================================================================
// CONSTANTS
// ============================================================================

const NAV_ITEMS: NavItem[] = [
  { key: "home", icon: Home, label: "Home" },
  { key: "network", icon: Users, label: "Network", badge: 12 },
  { key: "jobs", icon: Briefcase, label: "Jobs" },
  { key: "chat", icon: MessageSquare, label: "Messages", badge: 5 },
  { key: "notifications", icon: Bell, label: "Alerts", badge: 3 },
];

const SEARCH_SUGGESTIONS = [
  "React Hooks Tutorial",
  "JavaScript ES6",
  "Frontend Jobs",
  "UI/UX Design",
  "TypeScript Tips",
];

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

const useClickOutside = (callback: () => void) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [callback]);

  return ref;
};

const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// ============================================================================
// MEMOIZED COMPONENTS
// ============================================================================

const Logo = React.memo<{ onClick: () => void }>(({ onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 hover:opacity-90 transition-opacity"
    aria-label="Go to home"
  >
    <div className="w-9 h-9 bg-gradient-to-br rounded-lg flex items-center justify-center shadow-lg">
   <img src="/logo.png" alt="logo" width={90} height={60} />
    </div>
    <span className="hidden sm:block text-xl font-bold bg-gradient-to-r bg-clip-text text-transparent">
      OneLink
    </span>
  </button>
));
Logo.displayName = 'Logo';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClose?: () => void;
  autoFocus?: boolean;
}

const SearchBar = React.memo<SearchBarProps>(({ value, onChange, onClose, autoFocus }) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const debouncedValue = useDebounce(value, 150);
  
  const filteredSuggestions = useMemo(() => {
    if (!debouncedValue.trim()) return SEARCH_SUGGESTIONS;
    return SEARCH_SUGGESTIONS.filter(s => 
      s.toLowerCase().includes(debouncedValue.toLowerCase())
    );
  }, [debouncedValue]);

  const showSuggestions = isFocused && filteredSuggestions.length > 0;

  const handleSuggestionClick = useCallback((suggestion: string) => {
    onChange(suggestion);
    inputRef.current?.focus();
  }, [onChange]);

  const handleClear = useCallback(() => {
    onChange('');
    inputRef.current?.focus();
  }, [onChange]);

  return (
    <div className="relative w-full">
      <div className={`relative transition-all duration-200 ${isFocused ? 'scale-[1.01]' : ''}`}>
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-all duration-200 ${
          isFocused ? 'text-blue-600 scale-110' : 'text-gray-500'
        }`} />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          autoFocus={autoFocus}
          className={`w-full px-4 py-2.5 pl-10 pr-10 rounded-lg text-sm outline-none transition-all duration-200 ${
            isFocused 
              ? 'bg-white ring-2 ring-blue-500 shadow-xl shadow-blue-100/50' 
              : 'bg-gray-100 hover:bg-gray-150'
          }`}
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full p-1 transition-all"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          <div className="p-2 space-y-1">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
              Suggested Searches
            </div>
            {filteredSuggestions.map((item) => (
              <button
                key={item}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg text-left transition-colors group"
                onClick={() => handleSuggestionClick(item)}
              >
                <Search className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">{item}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {onClose && (
        <button
          onClick={onClose}
          className="absolute -right-10 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-2"
          aria-label="Close search"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
});
SearchBar.displayName = 'SearchBar';

interface NavButtonProps {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
  isMobile?: boolean;
}

const NavButton = React.memo<NavButtonProps>(({ item, isActive, onClick, isMobile }) => {
  const Icon = item.icon;

  const badgeContent = useMemo(() => 
    item.badge && item.badge > 9 ? '9+' : item.badge?.toString(), 
  [item.badge]);

  if (isMobile) {
    return (
      <button
        onClick={onClick}
        className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-left transition-all ${
          isActive 
            ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600" 
            : "text-gray-700 hover:bg-gray-50"
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5" />
          <span className="font-medium">{item.label}</span>
        </div>
        {item.badge && (
          <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {badgeContent}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center px-3 py-2 rounded-lg min-w-[70px] transition-all group ${
        isActive ? "text-gray-900" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
      }`}
    >
      <div className="relative">
        <Icon className={`w-6 h-6 mb-1 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
        {item.badge && (
          <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
            {badgeContent}
          </span>
        )}
      </div>
      <span className="text-xs font-medium">{item.label}</span>
      {isActive && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-900 rounded-t-full" />
      )}
    </button>
  );
});
NavButton.displayName = 'NavButton';

interface UserDropdownProps {
  userInitial: string;
  userName?: string;
  onProfileClick: () => void;
  onSettingsClick: () => void;
  onLogoutClick: () => void;
}

const UserDropdown = React.memo<UserDropdownProps>(({ 
  userInitial, 
  userName, 
  onProfileClick, 
  onSettingsClick, 
  onLogoutClick 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useClickOutside(() => setIsOpen(false));

  const handleAction = useCallback((action: () => void) => {
    action();
    setIsOpen(false);
  }, []);

  const toggleDropdown = useCallback(() => setIsOpen(prev => !prev), []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
        aria-expanded={isOpen}
        aria-label="User menu"
      >
        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md">
          {userInitial}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fade-in">
          {/* User Info Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                {userInitial}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 text-sm truncate">
                  {userName || 'User'}
                </div>
                <div className="text-xs text-gray-600">View Profile</div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={() => handleAction(onProfileClick)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
            >
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">My Profile</span>
            </button>
            
            <button
              onClick={() => handleAction(onSettingsClick)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
            >
              <Settings className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">Settings</span>
            </button>
          </div>

          {/* Logout */}
          <div className="border-t border-gray-100">
            <button
              onClick={() => handleAction(onLogoutClick)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-left"
            >
              <LogOut className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-600 font-medium">Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
UserDropdown.displayName = 'UserDropdown';

// ============================================================================
// MAIN NAVBAR
// ============================================================================

const Navbar: React.FC<NavbarProps> = ({
  onPageChange,
  currentPage,
  onSearch,
  onCreatePost,
  userStats,
  userName = "User",
  userInitial = "U",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  // Debounced search to reduce unnecessary API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  useEffect(() => {
    onSearch(debouncedSearchQuery);
  }, [debouncedSearchQuery, onSearch]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handlePageChange = useCallback((page: string) => {
    onPageChange(page);
    setIsMobileMenuOpen(false);
  }, [onPageChange]);

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      alert('Logout failed. Please try again.');
    }
  }, []);

  const handleSettings = useCallback(() => {
    alert('Settings coming soon!');
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  const toggleSearchExpanded = useCallback(() => {
    setIsSearchExpanded(prev => !prev);
  }, []);

  // Memoized navigation items to prevent unnecessary re-renders
  const navItems = useMemo(() => 
    NAV_ITEMS.map((item) => (
      <NavButton
        key={item.key}
        item={item}
        isActive={currentPage === item.key}
        onClick={() => handlePageChange(item.key)}
      />
    )), [currentPage, handlePageChange]
  );

  const mobileNavItems = useMemo(() => 
    NAV_ITEMS.map((item) => (
      <NavButton
        key={item.key}
        item={item}
        isActive={currentPage === item.key}
        onClick={() => handlePageChange(item.key)}
        isMobile
      />
    )), [currentPage, handlePageChange]
  );

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm z-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 h-16 px-4">
          {/* Left Section */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Logo onClick={() => handlePageChange("home")} />
            
            {/* Desktop Search */}
            <div className="hidden md:block w-64">
              <SearchBar value={searchQuery} onChange={handleSearch} />
            </div>
          </div>

          {/* Center Navigation */}
          <div className="hidden lg:flex items-center justify-center gap-1 flex-1">
            {navItems}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            <button
              onClick={onCreatePost}
              className="hidden md:flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-full hover:shadow-lg hover:scale-105 transition-all font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Post</span>
            </button>

            <button
              onClick={toggleSearchExpanded}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all"
              aria-label="Toggle search"
            >
              <Search className="w-5 h-5" />
            </button>

            <UserDropdown
              userInitial={userInitial}
              userName={userName}
              onProfileClick={() => handlePageChange("profile")}
              onSettingsClick={handleSettings}
              onLogoutClick={handleLogout}
            />
          </div>
        </div>

        {/* Mobile Search */}
        {isSearchExpanded && (
          <div className="lg:hidden px-4 pb-4 border-t border-gray-200 bg-white">
            <div className="pt-3">
              <SearchBar
                value={searchQuery}
                onChange={handleSearch}
                autoFocus
                onClose={toggleSearchExpanded}
              />
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <div className="px-3 py-4 space-y-2">
              {mobileNavItems}
              <div className="border-t border-gray-200 pt-3 mt-3">
                <button
                  onClick={() => {
                    onCreatePost();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg transition-all"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Create Post</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default React.memo(Navbar);