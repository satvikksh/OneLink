"use client";

import React, { useState, useCallback, useMemo } from "react";
import Feed from "../components/Feed";
import CreatePostModal from "../components/CreatePostModal";
import { Post, User, Connection } from "../components/types";

// Mock data
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

const initialConnections: Connection[] = [
  { id: 1, name: "John Doe", title: "Product Manager", avatar: "/avatars/john.jpg", online: true },
  { id: 2, name: "Sarah Wilson", title: "Data Scientist", avatar: "/avatars/sarah.jpg", online: false },
  { id: 3, name: "Alex Kumar", title: "DevOps Engineer", avatar: "/avatars/alex.jpg", online: true },
  { id: 4, name: "Maria Garcia", title: "Frontend Lead", avatar: "/avatars/maria.jpg", online: true },
];

const HomePage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [suggestions, setSuggestions] = useState<User[]>(suggestedUsers);
  const [connections, setConnections] = useState<Connection[]>(initialConnections);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "connections" | "popular">("all");

  // Memoized filtered posts
  const filteredPosts = useMemo(() => {
    let filtered = posts;
    
    if (searchQuery) {
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.user.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeFilter === "popular") {
      filtered = [...filtered].sort((a, b) => b.likes - a.likes);
    }

    return filtered;
  }, [posts, searchQuery, activeFilter]);

  // Optimized connection handlers
  const addConnection = useCallback((user: User) => {
    setSuggestions(prev => prev.filter(u => u.id !== user.id));
    setConnections(prev => [...prev, { 
      ...user, 
      online: true,
      id: Math.max(0, ...prev.map(c => c.id)) + 1
    }]);
  }, []);

  const removeConnection = useCallback((connectionId: number) => {
    setConnections(prev => prev.filter(conn => conn.id !== connectionId));
  }, []);

  // Post interaction handlers - FIXED
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
    // In a real app, you'd add the comment to a comments array
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, comments: post.comments + 1 }
        : post
    ));
    console.log(`Added comment to post ${postId}: ${comment}`);
  }, []);

  const sharePost = useCallback((postId: number) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, shares: post.shares + 1 }
        : post
    ));
    console.log(`Shared post ${postId}`);
  }, []);

  // Create post handler - FIXED
  const createPost = useCallback((newPost: Omit<Post, "id" | "timestamp" | "likes" | "comments" | "shares" | "isLiked">) => {
    const post: Post = {
      ...newPost,
      id: Math.max(0, ...posts.map(p => p.id)) + 1,
      timestamp: "Just now",
      likes: 0,
      comments: 0,
      shares: 0,
      isLiked: false
    };
    setPosts(prev => [post, ...prev]);
    setIsCreateModalOpen(false);
  }, [posts]);

  // Current user data
  const currentUser = useMemo(() => ({
    name: "You",
    title: "Software Developer",
    avatar: "/avatars/current-user.jpg",
  }), []);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto flex gap-6 px-4">
        {/* Left Sidebar - Profile & Connections */}
        <div className="w-80 flex-shrink-0 hidden lg:block space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="h-20 bg-gradient-to-r from-blue-500 to-blue-600"></div>
            <div className="px-4 pb-4">
              <div className="flex justify-center -mt-8 mb-4">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-16 h-16 rounded-full border-4 border-white"
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
                  <span className="font-semibold text-gray-900">42</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Impressions of your post</span>
                  <span className="font-semibold text-gray-900">128</span>
                </div>
              </div>
            </div>
          </div>

          {/* Connections Card */}
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
                      <img 
                        src={connection.avatar} 
                        alt={connection.name}
                        className="w-10 h-10 rounded-full"
                      />
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

            {connections.length > 5 && (
              <button className="w-full mt-4 text-center text-blue-500 hover:text-blue-600 text-sm font-medium py-2 border-t border-gray-100">
                Show all ({connections.length}) connections
              </button>
            )}
          </div>

          {/* Recent Hashtags */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Recent Hashtags</h3>
            <div className="space-y-2">
              {["#Programming", "#Tech", "#Career", "#WebDevelopment", "#JavaScript"].map((tag, index) => (
                <button
                  key={index}
                  className="block w-full text-left text-sm text-gray-600 hover:text-blue-500 hover:bg-gray-50 px-2 py-1 rounded transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Feed */}
        <div className="flex-1 max-w-2xl">
          {/* Create Post Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-12 h-12 rounded-full"
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

          {/* Feed Filters */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {[
              { key: "all", label: "All Posts" },
              { key: "popular", label: "Most Popular" },
              { key: "connections", label: "Connections" },
              { key: "following", label: "Following" },
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
          <Feed 
            posts={filteredPosts}
            onLike={handleLike}
            onComment={addComment}
            onShare={sharePost}
          />
        </div>

        {/* Right Sidebar - Suggestions */}
        <div className="w-80 flex-shrink-0 hidden lg:block">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">People you may know</h3>
            <div className="space-y-4">
              {suggestions.map(user => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-12 h-12 rounded-full"
                    />
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
                    className="text-blue-500 hover:text-blue-600 font-medium text-sm px-3 py-1 border border-blue-500 rounded-full hover:bg-blue-50 transition-colors"
                  >
                    Connect
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={createPost}
      />
    </div>
  );
};

export default HomePage;