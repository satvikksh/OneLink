"use client";

import React, { useState } from "react";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import NetworkPage from "./pages/NetworkPage";
import JobsPage from "./jobs/page";
import ChatPage from "./chat/page";
import ProfilePage from "./pages/ProfilePage";

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <HomePage />;
      case "network":
        return <NetworkPage />;
      case "jobs":
        return <JobsPage />;
      case "messaging":
        return <ChatPage />;
      case "profile":
        return <ProfilePage />;
      default:
        return <HomePage />;
    }
  };

  // Mock user stats
  const userStats = {
    totalPosts: 15,
    totalLikes: 124,
    totalConnections: 423
  };

  const handleCreatePost = () => {
    setIsCreateModalOpen(true);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // You can pass this to HomePage or handle search globally
    console.log("Search query:", query);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Functional Navbar */}
      <Navbar 
        onPageChange={setCurrentPage} 
        currentPage={currentPage}
        onSearch={handleSearch}
        onCreatePost={handleCreatePost}
        userStats={userStats}
      />
      
      {/* Scrollable Content Area */}
      <div className="pt-28">
        {renderPage()}
      </div>
    </div>
  );
};

export default App;