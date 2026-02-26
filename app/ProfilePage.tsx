"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface CurrentUser {
  _id: string;
  name: string;
  username: string;
  email: string;
  role?: "student" | "recruiter" | "creator";
  headline?: string;
  about?: string;
  avatar?: string;
  createdAt?: string;
}

interface PostItem {
  _id: string;
  user?: string;
  userName?: string | null;
  title: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
}

function getDeviceKey() {
  try {
    return typeof window !== "undefined"
      ? localStorage.getItem("onelink_device_key") || ""
      : "";
  } catch {
    return "";
  }
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<ApiResult<T>> {
  const headers = new Headers(options.headers || {});
  const deviceKey = getDeviceKey();
  if (deviceKey) headers.set("x-device-key", deviceKey);

  if (!headers.get("Content-Type") && (options.method || "GET").toUpperCase() !== "GET") {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    credentials: "include",
    cache: "no-store",
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, data };
}

export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  const [postsLoading, setPostsLoading] = useState(false);
  const [posts, setPosts] = useState<PostItem[]>([]);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editValues, setEditValues] = useState({
    name: "",
    username: "",
    email: "",
    headline: "",
    about: "",
    profileImage: "",
  });

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });

  const [editingPost, setEditingPost] = useState<PostItem | null>(null);
  const [postForm, setPostForm] = useState({ title: "", content: "" });

  const profileStats = useMemo(
    () => [
      { label: "Posts", value: posts.length },
      { label: "Role", value: currentUser?.role ? currentUser.role.toUpperCase() : "MEMBER" },
      { label: "Member Since", value: currentUser?.createdAt ? new Date(currentUser.createdAt).getFullYear() : "-" },
    ],
    [posts.length, currentUser?.role, currentUser?.createdAt]
  );

  useEffect(() => {
    if (!statusMessage) return;
    const timer = setTimeout(() => setStatusMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [statusMessage]);

  useEffect(() => {
    let active = true;
    (async () => {
      const meRes = await apiFetch<{ user: CurrentUser | null; error?: string }>("/api/auth/me");
      if (!active) return;

      if (!meRes.ok || !meRes.data?.user) {
        router.replace("/login?next=/?page=profile");
        return;
      }

      const user = meRes.data.user;
      setCurrentUser(user);
      setEditValues({
        name: user.name || "",
        username: user.username || "",
        email: user.email || "",
        headline: user.headline || "",
        about: user.about || "",
        profileImage: user.avatar || "",
      });
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!currentUser?._id) return;
    void loadPosts(currentUser._id);
  }, [currentUser?._id]);

  async function loadPosts(userId: string) {
    setPostsLoading(true);
    const res = await apiFetch<{ posts?: PostItem[]; error?: string }>(`/api/posts?userId=${encodeURIComponent(userId)}`);
    if (res.ok) {
      setPosts(Array.isArray(res.data?.posts) ? res.data!.posts : []);
    } else {
      setPosts([]);
    }
    setPostsLoading(false);
  }

  async function handleSaveProfile() {
    if (!editValues.name.trim() || !editValues.username.trim() || !editValues.email.trim()) {
      setStatusMessage("Name, username and email are required.");
      return;
    }

    setSaving(true);
    const res = await apiFetch<{ user?: CurrentUser; error?: string }>("/api/users", {
      method: "PUT",
      body: JSON.stringify(editValues),
    });

    if (!res.ok || !res.data?.user) {
      setSaving(false);
      setStatusMessage(res.data?.error || "Failed to update profile.");
      return;
    }

    setCurrentUser(res.data.user);
    setShowEditProfile(false);
    setSaving(false);
    setStatusMessage("Profile updated successfully.");
  }

  async function handleChangePassword() {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setStatusMessage("Both password fields are required.");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setStatusMessage("New password must be at least 6 characters.");
      return;
    }

    setSaving(true);
    const res = await apiFetch<{ ok?: boolean; error?: string }>("/api/users", {
      method: "PUT",
      body: JSON.stringify(passwordForm),
    });

    setSaving(false);
    if (!res.ok) {
      setStatusMessage(res.data?.error || "Failed to change password.");
      return;
    }

    setShowChangePassword(false);
    setPasswordForm({ currentPassword: "", newPassword: "" });
    alert("Password changed. Please sign in again.");
    router.push("/login");
  }

  async function handleDeleteAccount() {
    if (!window.confirm("Delete your account permanently?")) return;

    const res = await apiFetch<{ ok?: boolean; error?: string }>("/api/users", { method: "DELETE" });
    if (!res.ok) {
      setStatusMessage(res.data?.error || "Failed to delete account.");
      return;
    }
    router.push("/login");
  }

  function openEditPostModal(post: PostItem) {
    setEditingPost(post);
    setPostForm({ title: post.title || "", content: post.content || "" });
  }

  async function handleSavePost() {
    if (!editingPost) return;
    if (!postForm.title.trim() || !postForm.content.trim()) {
      setStatusMessage("Post title and content are required.");
      return;
    }

    const res = await apiFetch<{ post?: PostItem; error?: string }>(`/api/posts/${editingPost._id}`, {
      method: "PUT",
      body: JSON.stringify(postForm),
    });

    if (!res.ok) {
      setStatusMessage(res.data?.error || "Failed to update post.");
      return;
    }

    setPosts((prev) =>
      prev.map((item) => (item._id === editingPost._id ? { ...item, title: postForm.title, content: postForm.content } : item))
    );
    setEditingPost(null);
    setStatusMessage("Post updated.");
  }

  async function handleDeletePost(postId: string) {
    if (!window.confirm("Delete this post?")) return;

    const res = await apiFetch<{ ok?: boolean; error?: string }>(`/api/posts/${postId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      setStatusMessage(res.data?.error || "Failed to delete post.");
      return;
    }

    setPosts((prev) => prev.filter((item) => item._id !== postId));
    setStatusMessage("Post deleted.");
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-lg text-gray-700">Loading profile...</div>;
  }

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-100 pt-24 pb-10">
      <div className="max-w-5xl mx-auto px-4">
        <section className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          <div className="h-40 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500" />
          <div className="px-6 pb-6 -mt-14">
            <div className="w-28 h-28 rounded-full border-4 border-white bg-blue-600 text-white text-4xl font-bold flex items-center justify-center overflow-hidden">
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                currentUser.name.charAt(0).toUpperCase()
              )}
            </div>

            <div className="mt-4 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{currentUser.name}</h1>
                <p className="text-gray-600">@{currentUser.username}</p>
                <p className="mt-2 text-gray-800">{currentUser.headline || "Add a professional headline."}</p>
                <p className="mt-1 text-sm text-gray-600">{currentUser.email}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowEditProfile(true)}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => setShowChangePassword(true)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Change Password
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </section>

        {statusMessage && (
          <div className="mt-4 bg-blue-50 border border-blue-100 text-blue-700 rounded-lg px-4 py-3 text-sm">{statusMessage}</div>
        )}

        <section className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {profileStats.map((item) => (
            <div key={item.label} className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-500">{item.label}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{String(item.value)}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 bg-white rounded-xl border border-gray-200 shadow p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-gray-900">About</h2>
            <button
              onClick={() => setShowEditProfile(true)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Edit
            </button>
          </div>
          <p className="text-gray-700 whitespace-pre-wrap">{currentUser.about || "No about section yet."}</p>
        </section>

        <section className="mt-6 bg-white rounded-xl border border-gray-200 shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Posts</h2>

          {postsLoading && <p className="text-gray-600">Loading posts...</p>}
          {!postsLoading && posts.length === 0 && <p className="text-gray-500">No posts found.</p>}

          <div className="space-y-4">
            {posts.map((post) => (
              <article key={post._id} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-lg text-gray-900">{post.title}</h3>
                <p className="text-gray-700 mt-2 whitespace-pre-wrap">{post.content}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Updated {new Date(post.updatedAt || post.createdAt || Date.now()).toLocaleString()}
                </p>
                <div className="mt-3 flex gap-3">
                  <button
                    onClick={() => openEditPostModal(post)}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeletePost(post._id)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {showEditProfile && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-xl bg-white rounded-xl shadow-xl p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Edit Profile</h3>
            <div className="space-y-3">
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Name"
                value={editValues.name}
                onChange={(e) => setEditValues((prev) => ({ ...prev, name: e.target.value }))}
              />
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Username"
                value={editValues.username}
                onChange={(e) => setEditValues((prev) => ({ ...prev, username: e.target.value.toLowerCase() }))}
              />
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Email"
                value={editValues.email}
                onChange={(e) => setEditValues((prev) => ({ ...prev, email: e.target.value.toLowerCase() }))}
              />
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Headline"
                value={editValues.headline}
                onChange={(e) => setEditValues((prev) => ({ ...prev, headline: e.target.value }))}
              />
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Profile Image URL"
                value={editValues.profileImage}
                onChange={(e) => setEditValues((prev) => ({ ...prev, profileImage: e.target.value }))}
              />
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-28"
                placeholder="About"
                value={editValues.about}
                onChange={(e) => setEditValues((prev) => ({ ...prev, about: e.target.value }))}
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowEditProfile(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showChangePassword && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Change Password</h3>
            <div className="space-y-3">
              <input
                type="password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Current Password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
              />
              <input
                type="password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="New Password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowChangePassword(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {editingPost && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Edit Post</h3>
            <div className="space-y-3">
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Post title"
                value={postForm.title}
                onChange={(e) => setPostForm((prev) => ({ ...prev, title: e.target.value }))}
              />
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-36"
                placeholder="Post content"
                value={postForm.content}
                onChange={(e) => setPostForm((prev) => ({ ...prev, content: e.target.value }))}
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setEditingPost(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePost}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Save Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
