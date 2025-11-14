"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

type PageKey = "home" | "network" | "jobs" | "chat" | "profile" | "notifications";

const HomePage     = dynamic(() => import("./HomePage"));
const NetworkPage  = dynamic(() => import("./NetworkPage"));
const JobsPage     = dynamic(() => import("./jobs/page"));
const ChatPage     = dynamic(() => import("./chat/page"));
const ProfilePage  = dynamic(() => import("./ProfilePage"));
const Notification = dynamic(() => import("./Notification"));

const PAGE_COMPONENTS: Record<PageKey, React.ComponentType> = {
  home: HomePage,
  network: NetworkPage,
  jobs: JobsPage,
  chat: ChatPage,
  profile: ProfilePage,
  notifications: Notification,
};

function OneSecondLoader() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-500 border-dashed rounded-full animate-spin" />
      <p className="mt-3 text-blue-600 font-semibold">Loading…</p>
    </div>
  );
}

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

  // 🔐 Auth gate — cookie-based current user
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

 useEffect(() => {
  let active = true;
  (async () => {
    try {
      const res = await fetch("/api/auth/me", {
        cache: "no-store",
        credentials: "include", // 👈 cookie bhejo
      });
      const data = await res.json().catch(() => ({}));
      if (!active) return;

      if (!res.ok || !data?.user) {
        const next =
          typeof window !== "undefined"
            ? window.location.pathname + window.location.search
            : "/";
        router.replace(`/login?next=${encodeURIComponent(next)}`);
        return;
      }

      setCurrentUser(data.user);
    } catch (e) {
      const next =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : "/";
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    } finally {
      if (active) setAuthLoading(false);
    }
  })();
  return () => {
    active = false;
  };
}, [router]);

  // Read ?page= and sanitize
  const rawPage = (searchParams.get("page") || "home").toLowerCase();
  const currentPage: PageKey = useMemo(() => {
    const allowed: PageKey[] = ["home", "network", "jobs", "chat", "profile", "notifications"];
    return (allowed.includes(rawPage as PageKey) ? rawPage : "home") as PageKey;
  }, [rawPage]);

  // 🛠 Normalize URL — keep query so tabs work
  useEffect(() => {
    const allowed = new Set(["home", "network", "jobs", "chat", "profile", "notifications"]);
    if (!allowed.has(rawPage)) {
      router.replace("/", { scroll: false }); // ← IMPORTANT: include ?page=home
    }
  }, [rawPage, router]);

  // 1s loader between page changes
  const [showLoader, setShowLoader] = useState(true);
  useEffect(() => {
    setShowLoader(true);
    const t = setTimeout(() => setShowLoader(false), 1000);
    return () => clearTimeout(t);
  }, [currentPage]);

  const handlePageChange = (page: string) => {
    router.push(`/?page=${page}`, { scroll: false });
  };
  const handleCreatePost = () => console.log("Create post clicked");
  const handleSearch = (query: string) => console.log("Search query:", query);

  const userStats = { totalPosts: 15, totalLikes: 124, totalConnections: 423 };
  const ActivePage = PAGE_COMPONENTS[currentPage];

  // Show loader while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-5  0 flex items-center justify-center">
        <OneSecondLoader />
      </div>
    );
  }

  // If unauthenticated we already redirected
  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        onPageChange={handlePageChange}
        currentPage={currentPage}
        onSearch={handleSearch}
        onCreatePost={handleCreatePost}
        userStats={userStats}
        // currentUser={currentUser} // pass if Navbar supports
      />

      <Suspense fallback={<PageSkeleton />}>
        {showLoader ? <OneSecondLoader /> : <ActivePage /* currentUser={currentUser} */ />}
      </Suspense>

      <Footer />
    </div>
  );
};

export default App;
