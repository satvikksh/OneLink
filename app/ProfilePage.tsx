'use client';

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/* ---------- Types ---------- */
type UserResp = {
  user: {
    _id: string;
    name: string;
    username: string;
    email: string;
    headline?: string;
    location?: string;
    about?: string;
    profileImage?: string;
    coverImage?: string;
  } | null;
  error?: string;
};

type Post = {
  _id: string;
  title: string;
  body: string;
  createdAt?: string;
  updatedAt?: string;
  author: { _id: string; name: string; username: string };
};

/* ---------- Helpers ---------- */

function getDeviceKeyHeader() {
  try {
    const dk = (typeof window !== 'undefined') ? localStorage.getItem('onelink_device_key') : "";
    return dk || "";
  } catch {
    return "";
  }
}

async function apiFetch(path: string, opts: RequestInit = {}) {
  const headers = new Headers(opts.headers || {});
  const dk = getDeviceKeyHeader();
  if (dk) headers.set('x-device-key', dk);
  headers.set('Content-Type', headers.get('Content-Type') || 'application/json');

  const res = await fetch(path, {
    credentials: 'include',
    ...opts,
    headers,
  });

  let data;
  try { data = await res.json(); } catch { data = {}; }
  return { ok: res.ok, status: res.status, data };
}

/* ---------- Component ---------- */

export default function ProfilePageClient() {
  const router = useRouter();

  const [user, setUser] = useState<UserResp["user"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // edit profile modal
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    name: "",
    username: "",
    email: "",
    headline: "",
    about: "",
    profileImage: "",
  });
  const [saving, setSaving] = useState(false);

  // change password modal
  const [pwdOpen, setPwdOpen] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  // posts
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  // edit post state
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingPostBody, setEditingPostBody] = useState<{ title: string; body: string }>({ title: "", body: "" });
  const [postSaving, setPostSaving] = useState(false);

  // fetch current user
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    (async () => {
      const res = await apiFetch("/api/auth/me", { method: "GET" });
      if (!mounted) return;
      if (!res.ok) {
        setError(res.data?.error || "Not authenticated");
        setUser(null);
        setLoading(false);
        // redirect to login if unauth
        if (res.status === 401) router.push(`/login?next=/profile`);
        return;
      }
      setUser(res.data.user);
      setLoading(false);
    })();

    return () => { mounted = false; };
  }, [router]);

  // fetch user's posts once user is loaded
  useEffect(() => {
    if (!user || !user._id) return;
    fetchPosts(user._id);
  }, [user]);

  async function fetchPosts(userId: string) {
    setPostsLoading(true);
    setPostError(null);
    const res = await apiFetch(`/api/posts?userId=${encodeURIComponent(userId)}`, { method: "GET" });
    if (!res.ok) {
      setPostError(res.data?.error || "Failed to load posts");
      setPosts([]);
      setPostsLoading(false);
      return;
    }
    setPosts(res.data.posts || []);
    setPostsLoading(false);
  }

  /* ---------- Profile Edit Handlers ---------- */

  function openEditModal() {
    if (!user) return;
    setEditValues({
      name: user.name || "",
      username: user.username || "",
      email: user.email || "",
      headline: user.headline || "",
      about: user.about || "",
      profileImage: user.profileImage || "",
    });
    setEditing(true);
  }

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    const payload = { ...editValues };
    const res = await apiFetch("/api/users", {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      alert(res.data?.error || "Failed to update profile");
      setSaving(false);
      return;
    }

    setUser(res.data.user || { ...user, ...payload });
    setEditing(false);
    setSaving(false);
  }

  /* ---------- Change Password ---------- */

  async function changePassword() {
    setPwdLoading(true);
    const res = await apiFetch("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
    });

    if (!res.ok) {
      alert(res.data?.error || "Failed to change password");
      setPwdLoading(false);
      return;
    }
    alert("Password changed successfully");
    setPwdOpen(false);
    setCurrentPwd("");
    setNewPwd("");
    setPwdLoading(false);
  }

  /* ---------- Delete Account ---------- */

  async function deleteAccount() {
    if (!confirm("Are you sure you want to delete your account? This action is irreversible.")) return;
    const res = await apiFetch("/api/users", { method: "DELETE" });
    if (!res.ok) {
      alert(res.data?.error || "Failed to delete account");
      return;
    }
    // on success redirect to login or home
    router.push("/login");
  }

  /* ---------- Posts: edit/delete ---------- */

  function startEditPost(p: Post) {
    setEditingPostId(p._id);
    setEditingPostBody({ title: p.title, body: p.body });
  }

  async function savePostEdit() {
    if (!editingPostId) return;
    setPostSaving(true);
    const res = await apiFetch(`/api/posts/${editingPostId}`, {
      method: "PUT",
      body: JSON.stringify(editingPostBody),
    });
    if (!res.ok) {
      alert(res.data?.error || "Failed to update post");
      setPostSaving(false);
      return;
    }
    // update local posts list
    setPosts(prev => prev.map(p => (p._id === editingPostId ? { ...p, ...editingPostBody, updatedAt: new Date().toISOString() } : p)));
    setEditingPostId(null);
    setPostSaving(false);
  }

  async function deletePost(id: string) {
    if (!confirm("Delete this post?")) return;
    const res = await apiFetch(`/api/posts/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert(res.data?.error || "Failed to delete post");
      return;
    }
    setPosts(prev => prev.filter(p => p._id !== id));
  }

  /* ---------- Render ---------- */

  if (loading) return <div className="p-8">Loading profile...</div>;
  if (!user) return <div className="p-8">Not authenticated.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-4">
          <img src={user.profileImage || "/api/placeholder/150/150"} alt="avatar" className="w-24 h-24 rounded-full object-cover" />
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">{user.name}</h1>
            <p className="text-sm text-gray-600">@{user.username}</p>
            <p className="mt-2 text-gray-700">{user.headline}</p>
            <p className="mt-2 text-sm text-gray-500">{user.location}</p>
          </div>
          <div className="flex flex-col gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={openEditModal}>Edit Profile</button>
            <button className="px-4 py-2 border rounded" onClick={() => setPwdOpen(true)}>Change Password</button>
            <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={deleteAccount}>Delete Account</button>
          </div>
        </div>
        <div className="mt-4 text-gray-700">{user.about}</div>
      </div>

      {/* Main area: posts + right column */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Posts column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold text-lg">Your Posts</h2>
            {postsLoading && <div className="mt-2">Loading posts...</div>}
            {postError && <div className="text-sm text-red-500 mt-2">{postError}</div>}
            {!postsLoading && posts.length === 0 && <div className="mt-2 text-sm text-gray-500">You have not posted anything yet.</div>}

            <div className="space-y-4 mt-4">
              {posts.map(p => (
                <div key={p._id} className="border rounded p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{p.title}</h3>
                      <p className="text-sm text-gray-600">{p.body}</p>
                      <p className="text-xs text-gray-400 mt-2">Updated: {p.updatedAt ? new Date(p.updatedAt).toLocaleString() : p.createdAt ? new Date(p.createdAt).toLocaleString() : ""}</p>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <button className="text-sm text-blue-600" onClick={() => startEditPost(p)}>Edit</button>
                      <button className="text-sm text-red-600" onClick={() => deletePost(p._id)}>Delete</button>
                    </div>
                  </div>

                  {/* inline edit area */}
                  {editingPostId === p._id && (
                    <div className="mt-3 space-y-2">
                      <input className="w-full border rounded px-2 py-1" value={editingPostBody.title} onChange={(e)=>setEditingPostBody(s=>({ ...s, title: e.target.value }))} />
                      <textarea className="w-full border rounded px-2 py-1" rows={4} value={editingPostBody.body} onChange={(e)=>setEditingPostBody(s=>({ ...s, body: e.target.value }))} />
                      <div className="flex gap-2 justify-end">
                        <button onClick={()=>setEditingPostId(null)} className="px-3 py-1 border rounded">Cancel</button>
                        <button onClick={savePostEdit} disabled={postSaving} className="px-3 py-1 bg-blue-600 text-white rounded">{postSaving ? "Saving..." : "Save"}</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column (profile details + actions) */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold">Contact</h3>
            <p className="mt-2 text-sm"><strong>Email:</strong> {user.email}</p>
            <p className="mt-1 text-sm"><strong>Username:</strong> @{user.username}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold">Shortcuts</h3>
            <div className="mt-2 flex flex-col gap-2">
              <Link href="/posts/create" className="px-3 py-2 border rounded text-sm text-center">Create New Post</Link>
              <Link href="/settings" className="px-3 py-2 border rounded text-sm text-center">Account Settings</Link>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Edit Profile Modal ---------- */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl p-6">
            <h3 className="text-lg font-semibold">Edit Profile</h3>
            <div className="mt-4 grid grid-cols-1 gap-3">
              <label className="text-sm">Name
                <input className="w-full border rounded px-2 py-1" value={editValues.name} onChange={(e)=>setEditValues(s=>({ ...s, name: e.target.value }))} />
              </label>
              <label className="text-sm">Username
                <input className="w-full border rounded px-2 py-1" value={editValues.username} onChange={(e)=>setEditValues(s=>({ ...s, username: e.target.value }))} />
              </label>
              <label className="text-sm">Email
                <input className="w-full border rounded px-2 py-1" value={editValues.email} onChange={(e)=>setEditValues(s=>({ ...s, email: e.target.value }))} />
              </label>
              <label className="text-sm">Headline
                <input className="w-full border rounded px-2 py-1" value={editValues.headline} onChange={(e)=>setEditValues(s=>({ ...s, headline: e.target.value }))} />
              </label>
              <label className="text-sm">About
                <textarea className="w-full border rounded px-2 py-1" rows={4} value={editValues.about} onChange={(e)=>setEditValues(s=>({ ...s, about: e.target.value }))} />
              </label>
              <label className="text-sm">Profile Image URL
                <input className="w-full border rounded px-2 py-1" value={editValues.profileImage} onChange={(e)=>setEditValues(s=>({ ...s, profileImage: e.target.value }))} />
              </label>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={()=>setEditing(false)} className="px-3 py-2 border rounded">Cancel</button>
              <button onClick={saveProfile} disabled={saving} className="px-3 py-2 bg-blue-600 text-white rounded">{saving ? "Saving..." : "Save changes"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Change Password Modal ---------- */}
      {pwdOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold">Change Password</h3>
            <div className="mt-4 space-y-3">
              <label className="text-sm">Current Password
                <input type="password" className="w-full border rounded px-2 py-1" value={currentPwd} onChange={e=>setCurrentPwd(e.target.value)} />
              </label>
              <label className="text-sm">New Password
                <input type="password" className="w-full border rounded px-2 py-1" value={newPwd} onChange={e=>setNewPwd(e.target.value)} />
              </label>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={()=>setPwdOpen(false)} className="px-3 py-2 border rounded">Cancel</button>
              <button onClick={changePassword} disabled={pwdLoading} className="px-3 py-2 bg-blue-600 text-white rounded">{pwdLoading ? "Saving..." : "Change password"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
