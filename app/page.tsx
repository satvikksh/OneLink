"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import NetworkPage from "./pages/NetworkPage";
import JobsPage from "./jobs/page";
import ChatPage from "./chat/page";
import ProfilePage from "./pages/ProfilePage";
import Notification from "./pages/Notification";
const App: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get current page from URL or default to 'home'
  const currentPage = searchParams.get('page') || 'home';

  const handlePageChange = (page: string) => {
    // Update URL without reloading the page
    router.push(`/?page=${page}`, { scroll: false });
  };

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <HomePage />;
      case "network":
        return <NetworkPage />;
      case "jobs":
        return <JobsPage />;
      case "chat":
        return <ChatPage />;
      case "profile":
        return <ProfilePage />;
         case "notifications":
        return <Notification />;
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
    // This will be handled by the HomePage component
    console.log("Create post clicked");
  };

  const handleSearch = (query: string) => {
    console.log("Search query:", query);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        onPageChange={handlePageChange} 
        currentPage={currentPage}
        onSearch={handleSearch}
        onCreatePost={handleCreatePost}
        userStats={userStats}
      />
      
      <div>
        {renderPage()}
      </div>
    </div>
  );
};

export default App;