"use client";
import { authFetch } from"./src/lib/authFetch";
import React, { useCallback, useEffect, useMemo, useState, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  Types (unchanged)                                                 */
/* ------------------------------------------------------------------ */
type UIPost = {
  mongoId: string;
  id: number;
  user: string;
  avatar: string;
  title: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  createdAt?: string;
};

type SuggestUser = { id: number; name: string; title: string; avatar?: string; mutual?: number };
type Connection = SuggestUser & { online?: boolean };
type Profile = { name: string; title: string; avatar: string; profileViews: number; postImpressions: number };

/* ------------------------------------------------------------------ */
/*  Data (unchanged)                                                  */
/* ------------------------------------------------------------------ */
const SUGGESTED: SuggestUser[] = [
  { id: 1, name: "Charlie Brown", title: "UI/UX Designer", mutual: 4 },
  { id: 2, name: "David Lee", title: "Backend Developer", mutual: 2 },
  { id: 3, name: "Eva Garcia", title: "Frontend Dev", mutual: 6 },
  { id: 4, name: "Mike Wilson", title: "Product Manager", mutual: 3 },
];

/* ------------------------------------------------------------------ */
/*  Utils (unchanged)                                                 */
/* ------------------------------------------------------------------ */
const roleToTitle = (role?: string) =>
  role === "recruiter" ? "Recruiter" : role === "creator" ? "Creator" : role === "student" ? "Student" : "Professional";

export async function safeJsonFetch(url: string, opts: RequestInit = {}) {
  const headers = new Headers(opts.headers || {});

  // ✅ add device-key header from localStorage
  try {
    if (typeof window !== "undefined") {
      const dk = localStorage.getItem("onelink_device_key");
      if (dk) headers.set("x-device-key", dk);
    }
  } catch {
    // ignore
  }

  const res = await fetch(url, { ...opts, credentials: "include", headers });
  const ct = res.headers.get("content-type") || "";

  // 🔐 special case: 401 → logout + redirect
  if (res.status === 401) {
    let data: any = null;
    if (ct.includes("application/json")) {
      data = await res.json().catch(() => null);
    }

    // local device key clear
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("onelink_device_key");
      }
    } catch {}

    // redirect to login (front-end)
    if (typeof window !== "undefined") {
      const next = window.location.pathname + window.location.search;
      window.location.href = `/login?next=${encodeURIComponent(next)}`;
    }

    throw new Error(data?.error || data?.message || "Unauthorized");
  }

  // other non-OK
  if (!res.ok) {
    if (ct.includes("application/json")) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || err?.message || `Request failed ${res.status}`);
    }
    throw new Error(`Request failed ${res.status}`);
  }

  if (res.status === 204) return null;
  if (!ct.includes("application/json")) return null;

  try {
    return await res.json();
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  UI kit (internal only)                                            */
/* ------------------------------------------------------------------ */
const Avatar = ({ letter, size = 40 }: { letter: string; size?: number }) => (
  <div
    className="rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-semibold select-none"
    style={{ width: size, height: size, fontSize: Math.max(12, size / 2.5) }}
  >
    {letter ? letter.toUpperCase() : "?"}
  </div>
);

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow ${className}`}
  >
    {children}
  </div>
);

const Button = ({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "soft";
  disabled?: boolean;
  className?: string;
}) => {
  const base = "px-4 py-2 rounded-lg text-sm font-medium transition active:scale-97";
  const styles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100",
    soft: "bg-gray-100 text-gray-800 hover:bg-gray-200",
  }[variant];
  return (
    <button className={`${base} ${styles} ${className}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
};

const Input = ({ value, onChange, placeholder, maxLength }: any) => (
  <div>
    <input
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      maxLength={maxLength}
    />
    {maxLength && (
      <div className="text-xs text-gray-400 mt-1 text-right">
        {value.length}/{maxLength}
      </div>
    )}
  </div>
);

const TextArea = ({ value, onChange, placeholder, rows = 4, maxLength }: any) => (
  <div>
    <textarea
      rows={rows}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 resize-none"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      maxLength={maxLength}
    />
    {maxLength && (
      <div className="text-xs text-gray-400 mt-1 text-right">
        {value.length}/{maxLength}
      </div>
    )}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Toast banner (non-blocking)                                       */
/* ------------------------------------------------------------------ */
const useToast = () => {
  const [toasts, setToasts] = useState<{ id: number; message: string; type: "success" | "error" }[]>([]);
  const toast = (message: string, type: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  };
  const ToastContainer = () => (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`px-4 py-2 rounded-lg text-white shadow-lg text-sm ${t.type === "success" ? "bg-green-500" : "bg-red-500"}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
  return { toast, ToastContainer };
};

/* ------------------------------------------------------------------ */
/*  Main component (drop-in)                                          */
/* ------------------------------------------------------------------ */
export default function HomePage() {
  const router = useRouter();
  const { toast, ToastContainer } = useToast();

  /* ------------------ auth & data (unchanged) ------------------ */
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestUser[]>(SUGGESTED);
  const [posts, setPosts] = useState<UIPost[]>([]);
  const [loading, setLoading] = useState(true);

  /* ------------------ modals (unchanged) ------------------ */
  const [createOpen, setCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createBody, setCreateBody] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editTitle, setEditTitle] = useState("");

  /* ------------------ auth effect (unchanged) ------------------ */
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await safeJsonFetch("/api/auth/me", { cache: "no-store", method: "GET" });
        if (!active) return;
        if (!data?.user) {
          const next = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
          router.replace(`/login?next=${encodeURIComponent(next)}`);
          return;
        }
        setCurrentUser(data.user);
        const name: string = data.user.name || "User";
        const title: string = data.user.title || data.user.headline || roleToTitle(data.user.role);
        setProfile(prev => ({
          name,
          title,
          avatar: "*",
          profileViews: prev?.profileViews ?? 0,
          postImpressions: prev?.postImpressions ?? 0,
        }));
      } catch {
        const next = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
        router.replace(`/login?next=${encodeURIComponent(next)}`);
      } finally {
        if (active) setAuthLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  /* ------------------ posts effect (unchanged) ------------------ */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await safeJsonFetch("/api/posts", { cache: "no-store", method: "GET" });
        if (!mounted) return;
        const postsFromApi: any[] = Array.isArray(data) ? data : Array.isArray(data?.posts) ? data.posts : [];
        const mapped: UIPost[] = postsFromApi.map((d: any, i: number) => ({
          mongoId: d._id ?? d.id ?? `temp-${i}`,
          id: i + 1,
          user: d.user ?? d.author?.name ?? d.author ?? "Unknown",
          avatar: d.avatar ?? d.author?.avatar ?? "",
          title: d.title ?? "",
          content: d.content ?? d.body ?? "",
          timestamp: new Date(d.createdAt ?? d.created_at ?? Date.now()).toLocaleString(),
          likes: typeof d.likes === "number" ? d.likes : 0,
          comments: Array.isArray(d.comments) ? d.comments.length : typeof d.comments === "number" ? d.comments : 0,
          shares: typeof d.shares === "number" ? d.shares : 0,
          isLiked: false,
          createdAt: d.createdAt ?? d.created_at,
        }));
        setPosts(mapped);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  /* ------------------ stats (unchanged) ------------------ */
  const stats = useMemo(() => {
    if (!profile) return { posts: 0, likes: 0, conns: 0 };
    return {
      posts: posts.filter(p => p.user === profile.name).length,
      likes: posts.reduce((s, p) => s + p.likes, 0),
      conns: connections.length,
    };
  }, [posts, profile, connections.length]);

  /* ------------------ actions (unchanged) ------------------ */
  const openCreate = useCallback(() => {
    if (!profile) {
      setEditName("");
      setEditTitle("");
      setEditOpen(true);
      return;
    }
    setCreateTitle("");
    setCreateBody("");
    setCreateOpen(true);
  }, [profile]);

const submitCreate = useCallback(async () => {
  if (!profile || !createTitle.trim() || !createBody.trim()) return;

  const tempId = Date.now();
  const optimistic: UIPost = {
    mongoId: `temp-${tempId}`,
    id: posts.length ? Math.max(...posts.map(p => p.id)) + 1 : 1,
    user: profile.name,
    avatar: profile.avatar,
    title: createTitle.trim(),
    content: createBody.trim(),
    timestamp: "Just now",
    likes: 0,
    comments: 0,
    shares: 0,
    isLiked: false,
  };

  setPosts(prev => [optimistic, ...prev]);
  setCreateOpen(false);

  try {
    const createdRaw: any = await authFetch("/api/posts", {
      method: "POST",
      body: JSON.stringify({
        user: profile.name,
        title: optimistic.title,
        content: optimistic.content,
        avatar: profile.avatar,
      }),
    });

    const created = createdRaw?.post ?? createdRaw;
    if (!created) return;

    setPosts(prev => {
      const others = prev.filter(p => p.mongoId !== optimistic.mongoId);
      return [
        {
          mongoId: created._id ?? created.id ?? `created-${Date.now()}`,
          id: optimistic.id,
          user: created.user ?? profile.name,
          avatar: created.avatar ?? profile.avatar,
          title: created.title ?? optimistic.title,
          content: created.content ?? optimistic.content,
          timestamp: new Date(created.createdAt ?? Date.now()).toLocaleString(),
          likes: created.likes ?? 0,
          comments: Array.isArray(created.comments) ? created.comments.length : 0,
          shares: created.shares ?? 0,
          isLiked: false,
          createdAt: created.createdAt,
        },
        ...others,
      ];
    });
  } catch (err: any) {
    // 401 case me safeJsonFetch already redirect kar dega
    console.error("create post failed:", err);
    setPosts(prev => prev.filter(p => p.mongoId !== optimistic.mongoId));
    if (err?.message !== "Unauthorized") {
      alert(err?.message || "Failed to publish post");
    }
  }
}, [profile, createTitle, createBody, posts.length]);


  const onLike = useCallback(
    async (postId: number) => {
      const target = posts.find(p => p.id === postId);
      if (!target) return;
      setPosts(prev => prev.map(p => (p.id === postId ? { ...p, likes: p.isLiked ? p.likes - 1 : p.likes + 1, isLiked: !p.isLiked } : p)));
      try {
        await safeJsonFetch(`/api/posts/${target.mongoId}/like`, { method: "POST" });
      } catch (error) {
        console.error("Failed to like:", error);
      }
    },
    [posts]
  );

  const onComment = useCallback(
    async (postId: number, text: string) => {
      if (!text.trim()) return;
      const target = posts.find(p => p.id === postId);
      if (!target) return;
      setPosts(prev => prev.map(p => (p.id === postId ? { ...p, comments: p.comments + 1 } : p)));
      try {
        await safeJsonFetch(`/api/posts/${target.mongoId}/comments`, {
          method: "POST",
          body: JSON.stringify({ text }),
        });
      } catch (error) {
        console.error("Failed to comment:", error);
      }
    },
    [posts]
  );

  const onShare = useCallback(
    (postId: number) => {
      setPosts(prev => prev.map(p => (p.id === postId ? { ...p, shares: p.shares + 1 } : p)));
      const url = `${typeof window !== "undefined" ? window.location.origin : ""}/post/${postId}`;
      navigator.clipboard.writeText(url);
      toast("Link copied to clipboard");
    },
    [toast]
  );

  const connectUser = useCallback(
    (u: SuggestUser) => {
      if (!profile) {
        setEditOpen(true);
        return;
      }
      setSuggestions(prev => prev.filter(x => x.id !== u.id));
      setConnections(prev => [...prev, { ...u, online: true }]);
    },
    [profile]
  );

  const removeConn = useCallback((id: number) => {
    setConnections(prev => prev.filter(c => c.id !== id));
  }, []);

  const saveProfile = useCallback(() => {
    if (!editName.trim() || !editTitle.trim()) return;
    setProfile({
      name: editName.trim(),
      title: editTitle.trim(),
      avatar: "*",
      profileViews: profile?.profileViews || 0,
      postImpressions: profile?.postImpressions || 0,
    });
    setEditOpen(false);
    toast("Profile updated");
  }, [editName, editTitle, profile, toast]);

  /* ------------------ feed item (unchanged) ------------------ */
  const FeedItem = React.memo(({ p }: { p: UIPost }) => {
    const [commentVal, setCommentVal] = useState("");
    return (
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <Avatar letter={(p.user || "?")[0]} size={42} />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900 leading-tight">{p.user}</div>
                <div className="text-xs text-gray-500">{p.timestamp}</div>
              </div>
            </div>

            <h3 className="mt-2 font-semibold text-gray-900">{p.title}</h3>
            <p className="text-gray-700 mt-1 whitespace-pre-wrap">{p.content}</p>

            <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
              <button
                onClick={() => onLike(p.id)}
                className={`flex items-center gap-1 hover:text-blue-600 transition ${p.isLiked ? "text-blue-600 font-medium" : ""}`}
              >
                <span className={p.isLiked ? "scale-125" : ""}>👍</span> {p.likes}
              </button>
              <span className="flex items-center gap-1">💬 {p.comments}</span>
              <button onClick={() => onShare(p.id)} className="flex items-center gap-1 hover:text-blue-600 transition">
                ↗ Share ({p.shares})
              </button>
            </div>

            <div className="mt-3 flex gap-2">
              <input
                value={commentVal}
                onChange={e => setCommentVal(e.target.value)}
                onKeyPress={e => e.key === "Enter" && commentVal.trim() && (onComment(p.id, commentVal), setCommentVal(""))}
                placeholder="Write a comment…"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
              />
              <Button
                variant="soft"
                onClick={() => {
                  if (commentVal.trim()) {
                    onComment(p.id, commentVal);
                    setCommentVal("");
                  }
                }}
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  });
  FeedItem.displayName = "FeedItem";

  /* ------------------ keyboard shortcuts ------------------ */
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCreateOpen(false);
        setEditOpen(false);
      }
      if (e.metaKey && e.key === "Enter" && createOpen) {
        submitCreate();
      }
    };
    window.addEventListener("keydown", down as any);
    return () => window.removeEventListener("keydown", down as any);
  });

  /* ------------------ skeletons ------------------ */
  const Skeleton = ({ h }: { h: string }) => <div className={`animate-pulse bg-gray-200 rounded-xl ${h}`} />;

  /* ------------------ empty states ------------------ */
  const EmptyState = ({ children }: { children: React.ReactNode }) => (
    <Card className="p-8 text-center text-gray-500 flex flex-col items-center gap-3">
      <span className="text-4xl">🍃</span>
      <div>{children}</div>
    </Card>
  );

  /* ------------------ render ------------------ */
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)_300px] gap-6">
          <div className="space-y-6">
            <Skeleton h="h-32" />
            <Skeleton h="h-48" />
          </div>
          <div className="space-y-4">
            <Skeleton h="h-24" />
            <Skeleton h="h-48" />
            <Skeleton h="h-48" />
          </div>
          <Skeleton h="h-64" />
        </div>
      </div>
    );
  }
  if (!currentUser) return null;

  return (
    <>
      <ToastContainer />
      <div className="min-h-screen bg-gray-60">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)_300px] gap-6">
          {/* ---------- left ---------- */}
          <aside className="space-y-6">
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <Avatar letter={(profile?.name ?? "?")[0]} size={56} />
                <div>
                  <div className="font-semibold text-gray-900">{profile?.name ?? "Guest"}</div>
                  <div className="text-sm text-gray-550">{profile?.title ?? "Create your profile"}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-xs text-gray-510">Views</div>
                  <div className="font-semibold">{profile?.profileViews ?? 0}</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-xs text-gray-500">Impr.</div>
                  <div className="font-semibold">{profile?.postImpressions ?? 0}</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-xs text-gray-500">Conn.</div>
                  <div className="font-semibold">{connections.length}</div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                <span>
                  Posts: <b>{stats.posts}</b>
                </span>
                <span>
                  Likes: <b>{stats.likes}</b>
                </span>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  variant="primary"
                  onClick={() => {
                    setEditName(profile?.name ?? "");
                    setEditTitle(profile?.title ?? "");
                    setEditOpen(true);
                  }}
                >
                  {profile ? "Edit Profile" : "Create Profile"}
                </Button>
                <Button variant="soft" onClick={openCreate}>
                  New Post
                </Button>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Connections</h3>
                <span className="text-xs text-gray-500">{connections.length}</span>
              </div>
              {connections.length === 0 ? (
                <EmptyState>No connections yet</EmptyState>
              ) : (
                <div className="space-y-3">
                  {connections.slice(0, 6).map(c => (
                    <div key={c.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar letter={c.name[0]} size={36} />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{c.name}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[150px]">{c.title}</div>
                        </div>
                      </div>
                      <Button variant="ghost" onClick={() => removeConn(c.id)}>
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </aside>

          {/* ---------- center ---------- */}
          <main>
            <Card className="p-4 mb-4">
              <div className="flex items-center gap-3">
                <Avatar letter={(profile?.name ?? "?")[0]} size={44} />
                <button onClick={openCreate} className="flex-1 text-left px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition">
                  {profile ? "Start a post…" : "Create your profile to post"}
                </button>
                <Button variant="soft" onClick={openCreate}>
                  Write
                </Button>
              </div>
            </Card>

            {loading ? (
              <div className="space-y-4">
                <Skeleton h="h-48" />
                <Skeleton h="h-48" />
              </div>
            ) : posts.length > 0 ? (
              <div className="space-y-4">{posts.map(p => <FeedItem key={`${p.mongoId}-${p.id}`} p={p} />)}</div>
            ) : (
              <EmptyState>Be the first to post something ✨</EmptyState>
            )}
          </main>

          {/* ---------- right ---------- */}
          <aside>
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">People you may know</h3>
              {suggestions.length === 0 ? (
                <EmptyState>All caught up</EmptyState>
              ) : (
                <div className="space-y-3">
                  {suggestions.map(u => (
                    <div key={u.id} className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar letter={u.name[0]} size={36} />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{u.name}</div>
                          <div className="text-xs text-gray-500 truncate">{u.title}</div>
                          {u.mutual ? <div className="text-xs text-blue-600">{u.mutual} mutual</div> : null}
                        </div>
                      </div>
                      <Button variant="soft" onClick={() => connectUser(u)}>
                        Connect
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </aside>
        </div>
      </div>

      {/* ---------- modals ---------- */}
      {createOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Avatar letter={(profile?.name ?? "?")[0]} size={40} />
              <div>
                <div className="font-semibold text-gray-900">{profile?.name ?? "Guest"}</div>
                <div className="text-xs text-gray-500">{profile?.title ?? ""}</div>
              </div>
            </div>

            <Input
              placeholder="Title"
              value={createTitle}
              onChange={(e: any) => setCreateTitle(e.target.value)}
              maxLength={120}
            />
            <TextArea
              placeholder="What do you want to talk about?"
              value={createBody}
              onChange={(e: any) => setCreateBody(e.target.value)}
              rows={5}
              maxLength={2000}
            />

            <div className="mt-3 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submitCreate} disabled={!createTitle.trim() || !createBody.trim()}>
                Publish
              </Button>
            </div>
            <div className="text-xs text-gray-400 mt-2 text-right">⌘+Enter to publish</div>
          </Card>
        </div>
      )}

      {editOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{profile ? "Edit profile" : "Create profile"}</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Name</label>
                <Input value={editName} onChange={(e: any) => setEditName(e.target.value)} placeholder="Your full name" />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Title</label>
                <Input value={editTitle} onChange={(e: any) => setEditTitle(e.target.value)} placeholder="e.g., Software Developer" />
              </div>
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveProfile} disabled={!editName.trim() || !editTitle.trim()}>
                {profile ? "Update" : "Create"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}