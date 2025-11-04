"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// ---------- Types ----------
type PageKey = "home" | "network" | "jobs" | "chat" | "profile" | "notifications";

// ---------- Lazy pages (code-splitting) ----------
const HomePage        = dynamic(() => import("./pages/HomePage"));
const NetworkPage     = dynamic(() => import("./pages/NetworkPage"));
const JobsPage        = dynamic(() => import("./jobs/page"));            // if this is a route, prefer moving to components later
const ChatPage        = dynamic(() => import("./chat/page"));            // same note as above
const ProfilePage     = dynamic(() => import("./pages/ProfilePage"));
const Notification    = dynamic(() => import("./pages/Notification"));

// ---------- Registry ----------
const PAGE_COMPONENTS: Record<PageKey, React.ComponentType> = {
  home: HomePage,
  network: NetworkPage,
  jobs: JobsPage,
  chat: ChatPage,
  profile: ProfilePage,
  notifications: Notification,
};

// ---------- Mini 1s Loader ----------
function OneSecondLoader() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-500 border-dashed rounded-full animate-spin" />
      <p className="mt-3 text-blue-600 font-semibold">Loading…</p>
    </div>
  );
}

// Skeleton like Next.js loading.tsx style
function PageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="h-28 bg-gray-200 rounded" />
          <div className="h-28 bg-gray-200 rounded" />
          <div className="h-28 bg-gray-200 rounded" />
        </div>
        <div className="space-y-4">
          <div className="h-20 bg-gray-200 rounded" />
          <div className="h-20 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

const App: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read ?page=… and sanitize
  const rawPage = (searchParams.get("page") || "home").toLowerCase();
  const currentPage: PageKey = useMemo(() => {
    const allowed: PageKey[] = ["home", "network", "jobs", "chat", "profile", "notifications"];
    return (allowed.includes(rawPage as PageKey) ? rawPage : "home") as PageKey;
  }, [rawPage]);

  // Normalize URL if invalid
  useEffect(() => {
    const allowed = new Set(["home", "network", "jobs", "chat", "profile", "notifications"]);
    if (!allowed.has(rawPage)) {
      router.replace("/?page=home", { scroll: false });
    }
  }, [rawPage, router]);

  // 1-second page-change loader
  const [showLoader, setShowLoader] = useState(true);
  useEffect(() => {
    setShowLoader(true);
    const t = setTimeout(() => setShowLoader(false), 1000);
    return () => clearTimeout(t);
  }, [currentPage]);

  // Handlers for Navbar
  const handlePageChange = (page: string) => {
    router.push(`/?page=${page}`, { scroll: false });
  };
  const handleCreatePost = () => {
    console.log("Create post clicked");
  };
  const handleSearch = (query: string) => {
    console.log("Search query:", query);
  };

  // Mock user stats
  const userStats = {
    totalPosts: 15,
    totalLikes: 124,
    totalConnections: 423,
  };

  const ActivePage = PAGE_COMPONENTS[currentPage];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        onPageChange={handlePageChange}
        currentPage={currentPage}
        onSearch={handleSearch}
        onCreatePost={handleCreatePost}
        userStats={userStats}
      />

      <Suspense fallback={<PageSkeleton />}>
        {showLoader ? <OneSecondLoader /> : <ActivePage />}
      </Suspense>

      <Footer />
    </div>
  );
};

export default App;
