"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Feed from "../components/Feed";
import CreatePostModal from "../components/CreatePostModal";
import Navbar from "../components/Navbar";
import { Post, User, Connection } from "../components/types";
import Footer from "../components/Footer";
import styles from "./HomePage.module.css";

// ============================================================================
// TYPES
// ============================================================================

interface CurrentUser {
  name: string;
  title: string;
  avatar: string;
  profileViews: number;
  postImpressions: number;
}

interface ProfileForm {
  name: string;
  title: string;
  avatar: string;
}

type FilterType = "all" | "connections" | "popular";
type PageType = "home" | "network" | "jobs" | "chat" | "notifications" | "profile";

// ============================================================================
// CONSTANTS
// ============================================================================

const INITIAL_POSTS: Post[] = [
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

const SUGGESTED_USERS: User[] = [
  { id: 1, name: "Charlie Brown", title: "UI/UX Designer at TechCorp", avatar: "/avatars/charlie.jpg", mutualConnections: 4 },
  { id: 2, name: "David Lee", title: "Backend Developer", avatar: "/avatars/david.jpg", mutualConnections: 2 },
  { id: 3, name: "Eva Garcia", title: "Frontend Developer", avatar: "/avatars/eva.jpg", mutualConnections: 6 },
  { id: 4, name: "Mike Wilson", title: "Product Manager", avatar: "/avatars/mike.jpg", mutualConnections: 3 },
];

const TRENDING_HASHTAGS = ["#Programming", "#Tech", "#Career", "#WebDevelopment", "#JavaScript"];

const FILTER_OPTIONS = [
  { key: "all" as const, label: "All Posts" },
  { key: "popular" as const, label: "Most Popular" },
  { key: "connections" as const, label: "Connections" },
];

const POST_ACTIONS = [
  { icon: "📷", label: "Photo" },
  { icon: "🎥", label: "Video" },
  { icon: "📄", label: "Document" },
  { icon: "📊", label: "Poll" },
];

const PAGE_ICONS: Record<PageType, string> = {
  home: "🏠",
  network: "👥",
  jobs: "💼",
  chat: "💬",
  notifications: "🔔",
  profile: "👤"
};

// ============================================================================
// UTILITY HOOKS
// ============================================================================

const useLocalStorage = <T,>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      localStorage.removeItem(key);
    }
  }, [key]);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const EmptyProfileCard: React.FC<{ onCreateProfile: () => void }> = ({ onCreateProfile }) => (
  <div className="card">
    <div className="h-20 bg-gradient-to-r from-gray-400 to-gray-600" />
    <div className="px-4 pb-4 text-center">
      <div className="flex justify-center -mt-8 mb-4">
        <div className="w-16 h-16 bg-gray-300 rounded-full border-4 border-white flex items-center justify-center">
          <span className="text-gray-600 text-2xl">?</span>
        </div>
      </div>
      <h2 className="font-bold text-lg text-gray-900 mb-2">Complete Your Profile</h2>
      <p className="text-gray-600 text-sm mb-4">Create your profile to start connecting and sharing</p>
      <button onClick={onCreateProfile} className="w-full btn btn-primary">
        Create Profile
      </button>
    </div>
  </div>
);

const ProfileCard: React.FC<{ 
  user: CurrentUser; 
  onEdit: () => void;
}> = ({ user, onEdit }) => (
  <div className={`card sticky top-24 ${styles.sidebarCard}`}>
    <div className={`h-20 ${styles.profileGradientBlue}`} />
    <div className="px-4 pb-4">
      <div className="flex justify-center -mt-8 mb-4">
        <div className="avatar-placeholder w-16 h-16 text-white text-lg font-semibold">
          {user.name.charAt(0)}
        </div>
      </div>
      
      <div className="text-center mb-4">
        <h2 className="font-bold text-lg text-gray-900">{user.name}</h2>
        <p className="text-gray-600 text-sm">{user.title}</p>
      </div>

      <div className="border-t border-gray-100 pt-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Profile Views</span>
          <span className="font-semibold text-gray-900">{user.profileViews}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Post Impressions</span>
          <span className="font-semibold text-gray-900">{user.postImpressions}</span>
        </div>
      </div>

      <button
        onClick={onEdit}
        className="w-full mt-4 text-center text-blue-500 hover:text-blue-600 text-sm font-medium py-2 border-t border-gray-100"
      >
        Edit Profile
      </button>
    </div>
  </div>
);

const ConnectionsCard: React.FC<{
  connections: Connection[];
  onRemove: (id: number) => void;
}> = ({ connections, onRemove }) => (
  <div className={`card sticky top-112 ${styles.sidebarCard}`}>
    <div className="flex justify-between items-center mb-4">
      <h3 className="font-semibold text-gray-900">Your Connections</h3>
      <span className="text-blue-500 text-sm font-medium">{connections.length}</span>
    </div>
    
    <div className="space-y-3">
      {connections.slice(0, 5).map(connection => (
        <div key={connection.id} className="flex items-center justify-between group">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="avatar-placeholder w-10 h-10 text-white text-sm">
                {connection.name.charAt(0)}
              </div>
              {connection.online && (
                <div className={`absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white ${styles.connectionOnline}`} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-900 truncate">{connection.name}</p>
              <p className="text-xs text-gray-500 truncate">{connection.title}</p>
            </div>
          </div>
          <button
            onClick={() => onRemove(connection.id)}
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
            title="Remove connection"
            aria-label={`Remove ${connection.name}`}
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
);

const TrendingHashtags: React.FC<{ onTagClick: (tag: string) => void }> = ({ onTagClick }) => (
  <div className={`card sticky top-145 ${styles.sidebarCard}`}>
    <h3 className="font-semibold text-gray-900 mb-3">Trending Hashtags</h3>
    <div className="space-y-2">
      {TRENDING_HASHTAGS.map((tag, index) => (
        <button
          key={index}
          className="tag"
          onClick={() => onTagClick(tag.replace('#', ''))}
        >
          {tag}
        </button>
      ))}
    </div>
  </div>
);

const SuggestionsCard: React.FC<{
  suggestions: User[];
  onConnect: (user: User) => void;
  disabled: boolean;
}> = ({ suggestions, onConnect, disabled }) => (
  <div className={`card sticky top-24 ${styles.sidebarCard}`}>
    <h3 className="font-semibold text-gray-900 mb-4">People you may know</h3>
    <div className="space-y-4">
      {suggestions.map(user => (
        <div key={user.id} className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="avatar-placeholder w-12 h-12 text-white text-sm font-semibold">
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
            onClick={() => onConnect(user)}
            disabled={disabled}
            className={`btn btn-ghost ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Connect
          </button>
        </div>
      ))}
    </div>
  </div>
);

const ProfileModal: React.FC<{
  isOpen: boolean;
  form: ProfileForm;
  onFormChange: (form: ProfileForm) => void;
  onSave: () => void;
  onCancel: () => void;
  isEdit: boolean;
}> = ({ isOpen, form, onFormChange, onSave, onCancel, isEdit }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-auto p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {isEdit ? "Edit Profile" : "Create Your Profile"}
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => onFormChange({ ...form, name: e.target.value })}
              placeholder="Enter your name"
              className="input"
              maxLength={50}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => onFormChange({ ...form, title: e.target.value })}
              placeholder="e.g., Software Developer"
              className="input"
              maxLength={100}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={onSave}
            className="btn btn-primary disabled:bg-blue-300 disabled:cursor-not-allowed"
            disabled={!form.name.trim() || !form.title.trim()}
          >
            {isEdit ? "Update Profile" : "Create Profile"}
          </button>
        </div>
      </div>
    </div>
  );
};

const CreatePostPrompt: React.FC<{
  user: CurrentUser | null;
  onCreateClick: () => void;
}> = ({ user, onCreateClick }) => {
  if (!user) {
    return (
      <div className="card mb-6 text-center">
        <h3 className="font-semibold text-gray-900 mb-2">Create your profile to start posting</h3>
        <p className="text-gray-600 text-sm mb-4">Join the conversation by setting up your profile</p>
        <button onClick={onCreateClick} className="btn btn-primary">
          Create Profile
        </button>
      </div>
    );
  }

  return (
    <div className="card mb-6">
      <div className="flex items-center space-x-4 mb-4">
        <div className="avatar-placeholder w-13 h-13 text-white">
          {user.name.charAt(0)}
        </div>
        <button
          onClick={onCreateClick}
          className="flex-1 text-left px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-full text-gray-600 transition-colors"
        >
          Start a post...
        </button>
      </div>
      
      <div className="flex justify-around border-t border-gray-200 pt-3">
        {POST_ACTIONS.map((item, index) => (
          <button
            key={index}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-60 rounded-md transition-colors"
          >
            <span>{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const HomePage: React.FC = () => {
  const router = useRouter();
  
  // State management
  const [currentUser, setCurrentUser] = useLocalStorage<CurrentUser | null>('userProfile', null);
  const [connections, setConnections] = useLocalStorage<Connection[]>('userConnections', []);
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [suggestions, setSuggestions] = useState<User[]>(SUGGESTED_USERS);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    name: "",
    title: "",
    avatar: "*"
  });
  const [currentPage, setCurrentPage] = useState<PageType>("home");

  // Navigation handler
  const handlePageChange = useCallback((page: string) => {
    const pageType = page as PageType;
    setCurrentPage(pageType);
    
    const url = pageType === "home" ? "/" : `/?page=${pageType}`;
    router.push(url, { scroll: false });

    if (pageType === "home") {
      setSearchQuery("");
      setActiveFilter("all");
    }
  }, [router]);

  // Search handler
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Create post handler
  const handleCreatePost = useCallback(() => {
    if (!currentUser) {
      alert("Please create your profile first to post");
      setIsEditingProfile(true);
      return;
    }
    setIsCreateModalOpen(true);
  }, [currentUser]);

  // User stats
  const userStats = useMemo(() => {
    if (!currentUser) return undefined;
    
    return {
      totalPosts: posts.filter(post => post.user === currentUser.name).length,
      totalLikes: posts.reduce((sum, post) => sum + post.likes, 0),
      totalConnections: connections.length
    };
  }, [posts, connections, currentUser]);

  // Filtered posts
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

  // Connection handlers
  const handleAddConnection = useCallback((user: User) => {
    if (!currentUser) {
      alert("Please create your profile first to connect with others");
      setIsEditingProfile(true);
      return;
    }

    setSuggestions(prev => prev.filter(u => u.id !== user.id));
    const newConnection: Connection = {
      ...user, 
      online: true,
      id: connections.length > 0 ? Math.max(...connections.map(c => c.id)) + 1 : 1
    };
    setConnections(prev => [...prev, newConnection]);
  }, [connections, currentUser, setConnections]);

  const handleRemoveConnection = useCallback((connectionId: number) => {
    const removedConnection = connections.find(conn => conn.id === connectionId);
    if (removedConnection) {
      setConnections(prev => prev.filter(conn => conn.id !== connectionId));
      if (SUGGESTED_USERS.some(user => user.id === removedConnection.id)) {
        setSuggestions(prev => [...prev, removedConnection]);
      }
    }
  }, [connections, setConnections]);

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

  const handleComment = useCallback((postId: number, comment: string) => {
    if (!comment.trim()) return;
    
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, comments: post.comments + 1 }
        : post
    ));
  }, []);

  const handleShare = useCallback((postId: number) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, shares: post.shares + 1 }
        : post
    ));
  }, []);

  // Create post
  const handleSubmitPost = useCallback((postData: { title: string; content: string }) => {
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

    setCurrentUser(prev => prev ? {
      ...prev,
      postImpressions: prev.postImpressions + 1
    } : null);
  }, [posts, currentUser, setCurrentUser]);

  // Profile management
  const handleSaveProfile = useCallback(() => {
    if (!profileForm.name.trim() || !profileForm.title.trim()) {
      alert("Please fill in name and title");
      return;
    }

    const newUser: CurrentUser = {
      ...profileForm,
      profileViews: currentUser?.profileViews || 0,
      postImpressions: currentUser?.postImpressions || 0
    };
    
    setCurrentUser(newUser);
    setIsEditingProfile(false);
    
    if (!currentUser) {
      setProfileForm({ name: "", title: "", avatar: "*" });
    }
  }, [profileForm, currentUser, setCurrentUser]);

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

  // Render page content
  const renderPageContent = () => {
    if (currentPage !== "home") {
      return (
        <div className="flex-1 max-w-4xl mx-auto">
          <div className="card p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {currentPage.charAt(0).toUpperCase() + currentPage.slice(1)} Page
            </h2>
            <p className="text-gray-500 mb-4">
              This is the {currentPage} page. Content would be loaded based on the route.
            </p>
            <div className="text-4xl mb-4">{PAGE_ICONS[currentPage]}</div>
            <button onClick={() => handlePageChange("home")} className="btn btn-primary">
              Back to Home
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.mainGrid}>
        {/* Left Sidebar */}
        <aside className="w-80 flex-shrink-0 hidden lg:block space-y-6">
          {currentUser ? (
            <>
              <ProfileCard user={currentUser} onEdit={handleEditProfile} />
              <ConnectionsCard connections={connections} onRemove={handleRemoveConnection} />
            </>
          ) : (
            <EmptyProfileCard onCreateProfile={() => setIsEditingProfile(true)} />
          )}
          <TrendingHashtags onTagClick={setSearchQuery} />
        </aside>

        {/* Main Feed */}
        <main className="flex-1 max-w-2xl">
          <CreatePostPrompt
            user={currentUser}
            onCreateClick={currentUser ? handleCreatePost : () => setIsEditingProfile(true)}
          />

          <div className="flex gap-2 mb-6 overflow-x-auto">
            {FILTER_OPTIONS.map(filter => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
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

          {filteredPosts.length > 0 ? (
            <div className="space-y-6">
              {filteredPosts.map(post => (
                <div key={post.id} className={styles.feedItem}>
                  <Feed 
                    posts={[post]}
                    onLike={handleLike}
                    onComment={handleComment}
                    onShare={handleShare}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
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
        </main>

        {/* Right Sidebar */}
        <aside className="w-80 flex-shrink-0 hidden lg:block">
          <SuggestionsCard
            suggestions={suggestions}
            onConnect={handleAddConnection}
            disabled={!currentUser}
          />
        </aside>
      </div>
    );
  };

  return (
    <div className={styles.homepageContainer}>
      <Navbar
        onPageChange={handlePageChange}
        currentPage={currentPage}
        onSearch={handleSearch}
        onCreatePost={handleCreatePost}
        userStats={userStats}
      />

      <main style={{ paddingTop: '64px' }} className="max-w-7xl mx-auto flex gap-6 px-4">
        {renderPageContent()}
      </main>

      <Footer />

      {currentUser && (
        <CreatePostModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleSubmitPost}
          currentUser={currentUser}
        />
      )}

      <ProfileModal
        isOpen={isEditingProfile}
        form={profileForm}
        onFormChange={setProfileForm}
        onSave={handleSaveProfile}
        onCancel={handleCancelEdit}
        isEdit={!!currentUser}
      />
    </div>
  );
};

export default HomePage;