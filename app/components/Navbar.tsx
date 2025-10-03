"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface NavbarProps {
  onPageChange: (page: string) => void;
  currentPage: string;
  onSearch: (query: string) => void;
  onCreatePost: () => void;
  userStats?: {
    totalPosts: number;
    totalLikes: number;
    totalConnections: number;
  };
}

const Navbar: React.FC<NavbarProps> = ({ 
  onPageChange, 
  currentPage, 
  onSearch, 
  onCreatePost,
  userStats 
}) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const navItems = [
    { key: "home", icon: "🏠", label: "Home" },
    { key: "network", icon: "👥", label: "My Network" },
    { key: "jobs", icon: "💼", label: "Jobs" },
    { key: "messaging", icon: "💬", label: "Messaging" },
    { key: "notifications", icon: "🔔", label: "Notifications" },
  ];

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  const handleProfileClick = () => {
    onPageChange("profile");
  };

  const handleBusinessClick = () => {
    alert("Business features coming soon!");
  };

  const handleLearningClick = () => {
    alert("Learning center opening soon!");
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-50">
      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Left Section - Logo & Search */}
          <div className="flex items-center space-x-4 flex-1">
            {/* Logo */}
            <button 
              onClick={() => onPageChange("home")}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-sm flex items-center justify-center">
                <span className="text-white font-bold text-lg">in</span>
              </div>
            </button>
            
            {/* Search Bar - Functional */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search posts, people, jobs..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="w-full px-4 py-2 pl-10 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all hover:bg-gray-200"
                />
              </div>
            </div>
          </div>

          {/* Center Section - Navigation (Functional) */}
          <div className="flex items-center justify-center space-x-1 flex-1">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => onPageChange(item.key)}
                className={`flex flex-col items-center px-4 py-2 rounded-md min-w-16 transition-all ${
                  currentPage === item.key
                    ? "text-gray-900"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="text-xl mb-1">{item.icon}</span>
                <span className="text-xs font-medium">{item.label}</span>
                {currentPage === item.key && (
                  <div className="w-full h-0.5 bg-gray-900 mt-1 rounded-full"></div>
                )}
              </button>
            ))}
          </div>

          {/* Right Section - Functional Elements */}
          <div className="flex items-center space-x-2 flex-1 justify-end">
            {/* For Business Button */}
            <button 
              onClick={handleBusinessClick}
              className="flex flex-col items-center px-3 py-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors min-w-16"
            >
              <span className="text-lg mb-1">🏢</span>
              <span className="text-xs font-medium">For Business</span>
            </button>

            {/* Learning Button */}
            <button 
              onClick={handleLearningClick}
              className="flex flex-col items-center px-3 py-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors min-w-16"
            >
              <span className="text-lg mb-1">📚</span>
              <span className="text-xs font-medium">Learning</span>
            </button>

            {/* Create Post Button - Functional */}
            <button
              onClick={onCreatePost}
              className="bg-blue-600 text-white px-4 py-1.5 rounded-full hover:bg-blue-700 transition-colors text-sm font-medium flex items-center space-x-1"
            >
              <span>+</span>
              <span>Post</span>
            </button>

            {/* User Profile - Functional */}
            <button 
              onClick={handleProfileClick}
              className="flex items-center space-x-2 ml-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                Y
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-6">
              <div className="text-gray-600 flex items-center space-x-1">
                <span>👁️</span>
                <span>Profile views: <strong>42</strong></span>
              </div>
              <div className="text-gray-600 flex items-center space-x-1">
                <span>👥</span>
                <span>Connections: <strong>{userStats?.totalConnections || 423}</strong></span>
              </div>
              <div className="text-gray-600 flex items-center space-x-1">
                <span>⭐</span>
                <span>Premium Member</span>
              </div>
            </div>
            <div className="text-green-600 flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Online • Last active: 2m ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;