"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Feed from "../components/Feed";
import CreatePostModal from "../components/CreatePostModal";
import Navbar from "../components/Navbar";
import { Post, User, Connection } from "../components/types";
import Footer from "../components/Footer";

// Mock data - Only posts and suggestions remain predefined

const initialPosts: Post[] = [
  { 
    id: 1, 
    user: "Alice Johnson", 
    title: "Excited to start my new role!", 
    content: "Today I joined XYZ Corp as a Software Engineer. Looking forward to this new journey and working with amazing colleagues! 🚀", 
    avatar: "/avatars/alice.jpg", 
    timestamp: "2h ago",
    likes: 15,
    comments: 3,
    shares: 2,
    isLiked: false
  },
  { 
    id: 2, 
    user: "Bob Smith", 
    title: "Project Launch Success!", 
    content: "Our team successfully launched the new AI-powered feature. Great collaboration everyone! The feedback has been incredible so far.", 
    avatar: "/avatars/bob.jpg", 
    timestamp: "5h ago",
    likes: 24,
    comments: 7,
    shares: 4,
    isLiked: true
  },
  { 
    id: 3, 
    user: "Sarah Chen", 
    title: "Just completed an amazing course!", 
    content: "Finished the Advanced React Patterns course. Highly recommend it for anyone looking to level up their frontend skills! #Learning #React", 
    avatar: "/avatars/sarah.jpg", 
    timestamp: "1d ago",
    likes: 42,
    comments: 12,
    shares: 8,
    isLiked: false
  },
];

const suggestedUsers: User[] = [
  { id: 1, name: "Charlie Brown", title: "UI/UX Designer at TechCorp", avatar: "/avatars/charlie.jpg", mutualConnections: 4 },
  { id: 2, name: "David Lee", title: "Backend Developer", avatar: "/avatars/david.jpg", mutualConnections: 2 },
  { id: 3, name: "Eva Garcia", title: "Frontend Developer", avatar: "/avatars/eva.jpg", mutualConnections: 6 },
  { id: 4, name: "Mike Wilson", title: "Product Manager", avatar: "/avatars/mike.jpg", mutualConnections: 3 },
];

const HomePage: React.FC = () => {
  const router = useRouter();
  
  // State for user profile - initially empty
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    title: string;
    avatar: string;
    profileViews: number;
    postImpressions: number;
  } | null>(null);

  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [suggestions, setSuggestions] = useState<User[]>(suggestedUsers);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "connections" | "popular">("all");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    title: "",
    avatar: "*"
  });

  // Add this state for current page
  const [currentPage, setCurrentPage] = useState("home");

  // Search handler - connect Navbar search to HomePage
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Page change handler with router navigation
  const handlePageChange = useCallback((page: string) => {
    setCurrentPage(page);
    
    switch(page) {
      case "home":
        router.push("/");
        break;
      case "network":
        router.push(`/?page=${page}`, { scroll: false });
        break;
      case "jobs":
        router.push(`/?page=${page}`, { scroll: false });
        break;
      case "chat":
        router.push(`/?page=${page}`, { scroll: false });
        break;
      case "notifications":
        router.push(`/?page=${page}`, { scroll: false });
        break;
      case "profile":
        router.push(`/?page=${page}`, { scroll: false });
        break;
      default:
        router.push("/");
    }

    // Reset to home view when switching to home
    if (page === "home") {
      setSearchQuery("");
      setActiveFilter("all");
    }
  }, [router]);

  // Create post handler from Navbar
  const handleCreatePost = useCallback(() => {
    if (!currentUser) {
      alert("Please create your profile first to post");
      return;
    }
    setIsCreateModalOpen(true);
  }, [currentUser]);

  // User stats for Navbar
  const userStats = useMemo(() => {
    if (!currentUser) return undefined;
    
    return {
      totalPosts: posts.filter(post => post.user === currentUser.name).length,
      totalLikes: posts.reduce((sum, post) => sum + post.likes, 0),
      totalConnections: connections.length
    };
  }, [posts, connections, currentUser]);

  // Initialize user profile from localStorage or show empty state
  useEffect(() => {
    const savedUser = localStorage.getItem('userProfile');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Error parsing saved user profile:", error);
        localStorage.removeItem('userProfile');
      }
    }
    
    // Initialize connections from localStorage or empty
    const savedConnections = localStorage.getItem('userConnections');
    if (savedConnections) {
      try {
        setConnections(JSON.parse(savedConnections));
      } catch (error) {
        console.error("Error parsing saved connections:", error);
        localStorage.removeItem('userConnections');
      }
    }
  }, []);

  // Save connections to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('userConnections', JSON.stringify(connections));
  }, [connections]);

  // Save user profile to localStorage when it changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('userProfile', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  // Memoized filtered posts
  const filteredPosts = useMemo(() => {
    let filtered = posts;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.user.toLowerCase().includes(query)
      );
    }

    if (activeFilter === "connections" && currentUser) {
      // Filter to show only posts from connections (excluding current user's own posts)
      const connectionNames = connections.map(conn => conn.name);
      filtered = filtered.filter(post => 
        connectionNames.includes(post.user) && post.user !== currentUser.name
      );
    }

    if (activeFilter === "popular") {
      filtered = [...filtered].sort((a, b) => b.likes - a.likes);
    }

    return filtered;
  }, [posts, searchQuery, activeFilter, connections, currentUser]);

  // Optimized connection handlers
  const addConnection = useCallback((user: User) => {
    if (!currentUser) {
      alert("Please create your profile first to connect with others");
      return;
    }

    setSuggestions(prev => prev.filter(u => u.id !== user.id));
    const newConnection: Connection = {
      ...user, 
      online: true,
      id: connections.length > 0 ? Math.max(...connections.map(c => c.id)) + 1 : 1
    };
    setConnections(prev => [...prev, newConnection]);
  }, [connections, currentUser]);

  const removeConnection = useCallback((connectionId: number) => {
    const removedConnection = connections.find(conn => conn.id === connectionId);
    if (removedConnection) {
      setConnections(prev => prev.filter(conn => conn.id !== connectionId));
      // Add back to suggestions if it was in the original suggestions
      if (suggestedUsers.some(user => user.id === removedConnection.id)) {
        setSuggestions(prev => [...prev, removedConnection]);
      }
    }
  }, [connections]);

  // Post interaction handlers
  const handleLike = useCallback((postId: number) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            isLiked: !post.isLiked 
          }
        : post
    ));
  }, []);

  const addComment = useCallback((postId: number, comment: string) => {
    if (!comment.trim()) return;
    
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, comments: post.comments + 1 }
        : post
    ));
  }, []);

  const sharePost = useCallback((postId: number) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, shares: post.shares + 1 }
        : post
    ));
  }, []);

  // Fixed createPost handler - matches CreatePostModal's expected signature
  const createPost = useCallback((postData: { title: string; content: string }) => {
    if (!currentUser) return;
    
    const newPost: Post = {
      id: posts.length > 0 ? Math.max(...posts.map(p => p.id)) + 1 : 1,
      user: currentUser.name,
      avatar: currentUser.avatar,
      title: postData.title,
      content: postData.content,
      timestamp: "Just now",
      likes: 0,
      comments: 0,
      shares: 0,
      isLiked: false
    };
    
    setPosts(prev => [newPost, ...prev]);
    setIsCreateModalOpen(false);

    // Update user's post impressions
    setCurrentUser(prev => prev ? {
      ...prev,
      postImpressions: prev.postImpressions + 1
    } : null);
  }, [posts, currentUser]);

  // Profile management
  const handleSaveProfile = useCallback(() => {
    if (!profileForm.name.trim() || !profileForm.title.trim()) {
      alert("Please fill in name and title");
      return;
    }

    const newUser = {
      ...profileForm,
      profileViews: currentUser?.profileViews || 0,
      postImpressions: currentUser?.postImpressions || 0
    };
    
    setCurrentUser(newUser);
    setIsEditingProfile(false);
    
    // Reset form only if we're creating a new profile (not editing)
    if (!currentUser) {
      setProfileForm({ name: "", title: "", avatar: "*" });
    }
  }, [profileForm, currentUser]);

  const handleEditProfile = useCallback(() => {
    if (currentUser) {
      setProfileForm({
        name: currentUser.name,
        title: currentUser.title,
        avatar: currentUser.avatar
      });
    }
    setIsEditingProfile(true);
  }, [currentUser]);

  const handleCancelEdit = useCallback(() => {
    setIsEditingProfile(false);
    if (!currentUser) {
      setProfileForm({ name: "", title: "", avatar: "*" });
    }
  }, [currentUser]);

  // Profile creation/editing modal
  const ProfileModal: React.FC = () => {
    if (!isEditingProfile) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg w-full max-w-md mx-auto p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {currentUser ? "Edit Profile" : "Create Your Profile"}
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name *
              </label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={50}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Title *
              </label>
              <input
                type="text"
                value={profileForm.title}
                onChange={(e) => setProfileForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Software Developer"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={100}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg border border-gray-300 hover:border-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
              disabled={!profileForm.name.trim() || !profileForm.title.trim()}
            >
              {currentUser ? "Update Profile" : "Create Profile"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Empty profile state component
  const EmptyProfileCard: React.FC = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="h-20 bg-gradient-to-r from-gray-400 to-gray-600"></div>
      <div className="px-4 pb-4 text-center">
        <div className="flex justify-center -mt-8 mb-4">
          <div className="w-16 h-16 bg-gray-300 rounded-full border-4 border-white flex items-center justify-center">
            <span className="text-gray-600 text-2xl">?</span>
          </div>
        </div>
        <h2 className="font-bold text-lg text-gray-900 mb-2">Complete Your Profile</h2>
        <p className="text-gray-600 text-sm mb-4">Create your profile to start connecting and sharing</p>
        <button
          onClick={() => setIsEditingProfile(true)}
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Create Profile
        </button>
      </div>
    </div>
  );

  // Render different content based on current page
  const renderPageContent = () => {
    switch (currentPage) {
      case "home":
        return (
          <>
            {/* Left Sidebar - Profile & Connections */}
            <div className="w-80 flex-shrink-0 hidden lg:block space-y-6">
              {/* Profile Card - Dynamic */}
              {currentUser ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="h-20 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                  <div className="px-4 pb-4">
                    <div className="flex justify-center -mt-8 mb-4">
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-16 h-16 rounded-full border-4 border-white bg-gray-200"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          // target.src = "/avatars/default-user.jpg";
                        }}
                      />
                    </div>
                    
                    <div className="text-center mb-4">
                      <h2 className="font-bold text-lg text-gray-900">{currentUser.name}</h2>
                      <p className="text-gray-600 text-sm">{currentUser.title}</p>
                    </div>

                    {/* Profile Stats */}
                    <div className="border-t border-gray-100 pt-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Who viewed your profile</span>
                        <span className="font-semibold text-gray-900">{currentUser.profileViews}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Impressions of your post</span>
                        <span className="font-semibold text-gray-900">{currentUser.postImpressions}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleEditProfile}
                      className="w-full mt-4 text-center text-blue-500 hover:text-blue-600 text-sm font-medium py-2 border-t border-gray-100"
                    >
                      Edit Profile
                    </button>
                  </div>
                </div>
              ) : (
                <EmptyProfileCard />
              )}

              {/* Connections Card - Only show if user has profile */}
              {currentUser && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-900">Your Connections</h3>
                    <span className="text-blue-500 text-sm font-medium">{connections.length}</span>
                  </div>
                  
                  <div className="space-y-3">
                    {connections.slice(0, 5).map(connection => (
                      <div key={connection.id} className="flex items-center justify-between group">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {connection.name.charAt(0)}
                            </div>
                            {connection.online && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900 truncate">{connection.name}</p>
                            <p className="text-xs text-gray-500 truncate">{connection.title}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeConnection(connection.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                          title="Remove connection"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>

                  {connections.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">
                      No connections yet. Start connecting with people!
                    </p>
                  )}

                  {connections.length > 5 && (
                    <button className="w-full mt-4 text-center text-blue-500 hover:text-blue-600 text-sm font-medium py-2 border-t border-gray-100">
                      Show all ({connections.length}) connections
                    </button>
                  )}
                </div>
              )}

              {/* Recent Hashtags */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Trending Hashtags</h3>
                <div className="space-y-2">
                  {["#Programming", "#Tech", "#Career", "#WebDevelopment", "#JavaScript"].map((tag, index) => (
                    <button
                      key={index}
                      className="block w-full text-left text-sm text-gray-600 hover:text-blue-500 hover:bg-gray-50 px-2 py-1 rounded transition-colors"
                      onClick={() => setSearchQuery(tag.replace('#', ''))}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Feed */}
            <div className="flex-1 max-w-2xl">
              {/* Create Post Card - Only show if user has profile */}
              {currentUser ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-12 h-12 rounded-full bg-gray-200"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        // target.src = "/avatars/default-user.jpg";
                      }}
                    />
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="flex-1 text-left px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
                    >
                      Start a post...
                    </button>
                  </div>
                  
                  <div className="flex justify-around border-t border-gray-100 pt-3">
                    {[
                      { icon: "📷", label: "Photo" },
                      { icon: "🎥", label: "Video" },
                      { icon: "📄", label: "Document" },
                      { icon: "📊", label: "Poll" },
                    ].map((item, index) => (
                      <button
                        key={index}
                        className="flex items-center space-x-2 px-4 py-2 text-gray-500 hover:bg-gray-50 rounded-md transition-colors"
                      >
                        <span>{item.icon}</span>
                        <span className="text-sm font-medium">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 text-center">
                  <h3 className="font-semibold text-gray-900 mb-2">Create your profile to start posting</h3>
                  <p className="text-gray-600 text-sm mb-4">Join the conversation by setting up your profile</p>
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Create Profile
                  </button>
                </div>
              )}

              {/* Feed Filters */}
              <div className="flex gap-2 mb-6 overflow-x-auto">
                {[
                  { key: "all", label: "All Posts" },
                  { key: "popular", label: "Most Popular" },
                  { key: "connections", label: "Connections" },
                ].map(filter => (
                  <button
                    key={filter.key}
                    onClick={() => setActiveFilter(filter.key as any)}
                    className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                      activeFilter === filter.key
                        ? "bg-blue-500 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Feed Component */}
              {filteredPosts.length > 0 ? (
                <Feed 
                  posts={filteredPosts}
                  onLike={handleLike}
                  onComment={addComment}
                  onShare={sharePost}
                />
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                  <p className="text-gray-500">
                    {searchQuery 
                      ? `No posts found for "${searchQuery}"`
                      : activeFilter === "connections" 
                        ? "No posts from your connections yet"
                        : "No posts available"
                    }
                  </p>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="mt-4 text-blue-500 hover:text-blue-600"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Right Sidebar - Suggestions */}
            <div className="w-80 flex-shrink-0 hidden lg:block">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-24">
                <h3 className="font-semibold text-gray-900 mb-4">People you may know</h3>
                <div className="space-y-4">
                  {suggestions.map(user => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">{user.name}</p>
                          <p className="text-xs text-gray-500 truncate">{user.title}</p>
                          {user.mutualConnections && (
                            <p className="text-xs text-blue-500">{user.mutualConnections} mutual connections</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => addConnection(user)}
                        disabled={!currentUser}
                        className={`text-blue-500 hover:text-blue-600 font-medium text-sm px-3 py-1 border border-blue-500 rounded-full hover:bg-blue-50 transition-colors ${
                          !currentUser ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        Connect
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        );

      default:
        // For other pages, show a simple placeholder or redirect
        return (
          <div className="flex-1 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Page Content</h2>
              <p className="text-gray-500 mb-4">This is the {currentPage} page. Content would be loaded based on the route.</p>
              <div className="text-4xl mb-4">
                {currentPage === "network" && "👥"}
                {currentPage === "jobs" && "💼"}
                {currentPage === "chat" && "💬"}
                {currentPage === "notifications" && "🔔"}
                {currentPage === "profile" && "👤"}
              </div>
              <button
                onClick={() => handlePageChange("home")}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Add Navbar */}
      <Navbar
        onPageChange={handlePageChange}
        currentPage={currentPage}
        onSearch={handleSearch}
        onCreatePost={handleCreatePost}
        userStats={userStats}
      />

      {/* Add padding top to account for fixed navbar */}
      <main style={{ paddingTop: `${ 16}px` }} className="max-w-7xl mx-auto flex gap-6 px-4">
        {renderPageContent()}
      </main>
  <Footer />

      {/* Create Post Modal */}
      {currentUser && (
        <CreatePostModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={createPost}
          currentUser={currentUser}
        />
      )}

      {/* Profile Creation/Editing Modal */}
      <ProfileModal />
    </div>
  );
};

export default HomePage;