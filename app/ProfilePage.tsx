"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/* ======================================================
   DEVICE KEY + API WRAPPER
====================================================== */

function getDeviceKey() {
  try {
    return typeof window !== "undefined"
      ? localStorage.getItem("onelink_device_key") || ""
      : "";
  } catch {
    return "";
  }
}

async function apiFetch(url: string, opts: RequestInit = {}) {
  const headers = new Headers(opts.headers || {});
  const dk = getDeviceKey();
  if (dk) headers.set("x-device-key", dk);

  if (!headers.get("Content-Type") && opts.method !== "GET") {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, {
    credentials: "include",
    ...opts,
    headers,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {}

  return { ok: res.ok, status: res.status, data };
}

/* ======================================================
   TYPES
====================================================== */
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
};

type Post = {
  _id: string;
  title: string;
  body: string;
  createdAt?: string;
  updatedAt?: string;
};

/* ======================================================
   MAIN PAGE
====================================================== */

export default function ProfilePageClient() {
  const router = useRouter();

  const [user, setUser] = useState<UserResp["user"] | null>(null);
  const [loading, setLoading] = useState(true);

  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  /* ---------- Profile editing modal ---------- */
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    name: "",
    username: "",
    email: "",
    headline: "",
    about: "",
    profileImage: "",
  });

  /* ---------- Password modal ---------- */
  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwdState, setPwdState] = useState({
    current: "",
    next: "",
  });

  /* ======================================================
     FETCH CURRENT USER
  ======================================================= */

  useEffect(() => {
    (async () => {
      const res = await apiFetch("/api/auth/me");
      if (!res.ok || !res.data?.user) {
        router.replace("/login?next=/profile");
        return;
      }
      setUser(res.data.user);
      setLoading(false);
    })();
  }, [router]);

  /* ======================================================
     FETCH POSTS OF USER
  ======================================================= */

  useEffect(() => {
    if (!user?._id) return;
    loadPosts();
  }, [user]);

  async function loadPosts() {
    setPostsLoading(true);
    const res = await apiFetch(`/api/posts?userId=${user?._id}`);
    setPosts(res.data?.posts || []);
    setPostsLoading(false);
  }

  /* ======================================================
     EDIT PROFILE HANDLERS
  ======================================================= */

  function startEdit() {
    if (!user) return;
    setEditValues({
      name: user.name,
      username: user.username,
      email: user.email,
      headline: user.headline || "",
      about: user.about || "",
      profileImage: user.profileImage || "",
    });
    setEditing(true);
  }

  async function saveProfile() {
    const res = await apiFetch("/api/users", {
      method: "PUT",
      body: JSON.stringify(editValues),
    });

    if (!res.ok) {
      alert(res.data?.error || "Failed to update profile");
      return;
    }
    setUser(res.data.user);
    setEditing(false);
  }

  /* ======================================================
     CHANGE PASSWORD
  ======================================================= */

  async function changePassword() {
    const res = await apiFetch("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({
        currentPassword: pwdState.current,
        newPassword: pwdState.next,
      }),
    });

    if (!res.ok) {
      alert(res.data?.error || "Failed to change password");
      return;
    }

    alert("Password updated successfully");
    setPwdOpen(false);
    setPwdState({ current: "", next: "" });
  }

  /* ======================================================
     DELETE ACCOUNT
  ======================================================= */

  async function deleteAccount() {
    if (!confirm("This cannot be undone. Delete your account?")) return;

    const res = await apiFetch("/api/users", { method: "DELETE" });
    if (res.ok) {
      router.push("/login");
    } else {
      alert(res.data?.error || "Failed to delete account");
    }
  }

  /* ======================================================
     RENDER
  ======================================================= */

  if (loading)
    return <div className="p-10 text-center text-lg">Loading profile…</div>;

  if (!user)
    return <div className="p-10 text-center text-lg">Not authenticated.</div>;

  return (
    <div className="min-h-screen bg-gray-100 pb-20">

      {/* ======================================================
           COVER + HEADER CARD
      ======================================================= */}
      <div className="relative w-full h-52 bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg">
        {user.coverImage && (
          <img
            src={user.coverImage}
            className="w-full h-full object-cover opacity-90"
          />
        )}
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="-mt-16 bg-white rounded-xl shadow p-6 flex gap-6 items-center relative">
          <img
            src={user.profileImage || "/api/placeholder/200/200"}
            className="w-32 h-32 rounded-full border-4 border-white shadow object-cover"
          />

          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-500">@{user.username}</p>
            <p className="mt-2 text-gray-700">{user.headline}</p>
            {user.location && (
              <p className="text-sm text-gray-500 mt-1">{user.location}</p>
            )}
          </div>

          <div className="space-y-2">
            <button
              onClick={startEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
            >
              Edit Profile
            </button>
            <button
              onClick={() => setPwdOpen(true)}
              className="px-4 py-2 bg-gray-200 rounded-lg shadow hover:bg-gray-300"
            >
              Change Password
            </button>
            <button
              onClick={deleteAccount}
              className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* ABOUT */}
      <div className="max-w-4xl mx-auto mt-6 bg-white shadow rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-2">About</h3>
        <p className="text-gray-700 leading-relaxed">{user.about || "No bio added yet."}</p>
      </div>

      {/* ======================================================
           POSTS SECTION
      ======================================================= */}
      <div className="max-w-4xl mx-auto mt-6 bg-white shadow rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4">Your Posts</h3>

        {postsLoading && <p>Loading posts…</p>}
        {!postsLoading && posts.length === 0 && (
          <p className="text-gray-500">You haven't posted anything yet.</p>
        )}

        <div className="space-y-4">
          {posts.map((p) => (
            <div
              key={p._id}
              className="border rounded-lg p-4 hover:shadow transition"
            >
              <h4 className="font-semibold text-lg">{p.title}</h4>
              <p className="text-gray-700 mt-1">{p.body}</p>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(p.updatedAt || p.createdAt || "").toLocaleString()}
              </p>

              <div className="mt-2 flex gap-3">
                <button
                  onClick={() => router.push(`/posts/${p._id}/edit`)}
                  className="text-blue-600 text-sm hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteAccount()}
                  className="text-red-600 text-sm hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ======================================================
           EDIT PROFILE MODAL
      ======================================================= */}
      {editing && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white p-6 rounded-xl shadow max-w-xl w-full">
            <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>

            <div className="grid grid-cols-1 gap-3">
              {Object.keys(editValues).map((key) => (
                <label key={key} className="text-sm font-medium">
                  {key.replace(/([A-Z])/g, " $1")}
                  <input
                    className="w-full border mt-1 rounded px-2 py-1"
                    value={(editValues as any)[key]}
                    onChange={(e) =>
                      setEditValues((s) => ({ ...s, [key]: e.target.value }))
                    }
                  />
                </label>
              ))}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={saveProfile}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
           PASSWORD MODAL
      ======================================================= */}
      {pwdOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white p-6 rounded-xl shadow max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Change Password</h2>

            <label className="block text-sm">
              Current Password
              <input
                type="password"
                className="w-full border rounded mt-1 px-2 py-1"
                value={pwdState.current}
                onChange={(e) =>
                  setPwdState((s) => ({ ...s, current: e.target.value }))
                }
              />
            </label>

            <label className="block text-sm mt-3">
              New Password
              <input
                type="password"
                className="w-full border rounded mt-1 px-2 py-1"
                value={pwdState.next}
                onChange={(e) =>
                  setPwdState((s) => ({ ...s, next: e.target.value }))
                }
              />
            </label>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setPwdOpen(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={changePassword}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
