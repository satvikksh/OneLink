// app/pages/NetworkPage.tsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import Navbar from "./components/Navbar";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  title?: string;
  avatar?: string;
  mutualConnections?: number;
  company?: string;
  location?: string;
}

interface Connection {
  id: string;
  name: string;
  title: string;
  avatar: string;
  online: boolean;
  connectedDate: string;
}

interface Invitation {
  id: string;
  name: string;
  title: string;
  avatar: string;
  mutualConnections: number;
  message?: string;
}

/** --- Device key + safe apiFetch helper (adds x-device-key & credentials) --- **/
function getDeviceKey(): string {
  try {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("onelink_device_key") || "";
  } catch {
    return "";
  }
}

async function apiFetch(url: string, opts: RequestInit = {}) {
  const headers = new Headers(opts.headers || {});
  try {
    const dk = getDeviceKey();
    if (dk) headers.set("x-device-key", dk);
  } catch {}

  // only set content-type for non-GET to avoid interfering with file uploads, etc.
  if (!headers.get("Content-Type") && (opts.method || "GET").toUpperCase() !== "GET") {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, { credentials: "include", ...opts, headers });

  const ct = res.headers.get("content-type") || "";

  // handle non-ok responses and include parsed body if possible
  if (!res.ok) {
    let body: any = null;
    if (ct.includes("application/json")) {
      try { body = await res.json(); } catch { body = null; }
    } else {
      try { body = await res.text(); } catch { body = null; }
    }
    const err: any = new Error(`Request failed ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  if (res.status === 204) return null;
  if (!ct.includes("application/json")) return null;

  try {
    return await res.json();
  } catch {
    return null;
  }
}

/* ---------------- Main Component ---------------- */
const NetworkPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"connections" | "invitations" | "people">("connections");
  const [connections, setConnections] = useState<Connection[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [suggestedPeople, setSuggestedPeople] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState("network");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const router = useRouter();

  // --- Mock / initial data (keeps UI working if API isn't ready)
  const initialConnections: Connection[] = [
    { id: "1", name: "Sarah Wilson", title: "Product Manager at OneLink", avatar: "/avatars/sarah.jpg", online: true, connectedDate: "2 weeks ago" },
    { id: "2", name: "Satvik Kushwaha", title: "Senior Designer", avatar: "/avatars/alex.jpg", online: false, connectedDate: "1 month ago" },
    { id: "3", name: "Mike Chen", title: "Backend Developer", avatar: "/avatars/mike.jpg", online: true, connectedDate: "3 days ago" },
  ];

  const initialInvitations: Invitation[] = [
    { id: "1", name: "John Martinez", title: "Engineering Manager", avatar: "/avatars/john.jpg", mutualConnections: 4, message: "We worked together on the React conference project" },
    { id: "2", name: "Priya Patel", title: "Full Stack Developer", avatar: "/avatars/priya.jpg", mutualConnections: 2, message: "Interested in connecting" },
  ];

  const initialSuggestedPeople: User[] = [
    { id: "s1", name: "Michael Taylor", title: "Senior Software Engineer", avatar: "/avatars/michael.jpg", mutualConnections: 8, company: "Google", location: "San Francisco, CA" },
    { id: "s2", name: "Sophia Garcia", title: "Product Designer", avatar: "/avatars/sophia.jpg", mutualConnections: 3, company: "Facebook", location: "New York, NY" },
  ];

  // Initialize local UI first
  useEffect(() => {
    setConnections(initialConnections);
    setInvitations(initialInvitations);
    setSuggestedPeople(initialSuggestedPeople);
  }, []);

  // AUTH CHECK: ensure user is logged in, else redirect
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await apiFetch("/api/auth/me", { cache: "no-store", method: "GET" });
        // if ok, do nothing (user remains)
      } catch (err) {
        if (!active) return;
        // redirect to login if unauthorized/error
        router.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      }
    })();
    return () => { active = false; };
  }, [router]);

  // Fetch real registered users for "People you may know"
  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingUsers(true);
      try {
        const data = await apiFetch("/api/users", { cache: "no-store", method: "GET" });

        if (!active) return;

        // data could be null, an array, or an object { users: [...] }
        const usersArr: any[] = Array.isArray(data) ? data : (Array.isArray(data?.users) ? data.users : []);

        if (!Array.isArray(usersArr) || usersArr.length === 0) {
          // keep local mocks — nothing to replace
          setLoadingUsers(false);
          return;
        }

        const mapped: User[] = usersArr.map((u: any, idx: number) => {
          const id = u._id ?? u.id ?? String(u.username ?? `u-${idx}-${Date.now()}`);
          const name = u.name ?? u.fullName ?? u.username ?? "Unknown";
          const roleOrTitle = (() => {
            if (u.title) return u.title;
            if (u.role) return typeof u.role === "string" ? (u.role.charAt(0).toUpperCase() + u.role.slice(1)) : String(u.role);
            if (u.username) return u.username;
            return "Member";
          })();

          return {
            id,
            name,
            title: roleOrTitle,
            avatar: u.avatar ?? u.profilePhoto ?? undefined,
            mutualConnections: u.mutualConnections ?? Math.floor(Math.random() * 6) + 1,
            company: u.company ?? undefined,
            location: u.location ?? undefined,
          } as User;
        });

        setSuggestedPeople(mapped);
      } catch (err: any) {
        console.error("Failed to load users (safeJsonFetch):", err?.message ?? err, { status: err?.status, body: err?.body ?? null });
        // keep mocks (do not remove existing local suggestions)
      } finally {
        if (active) setLoadingUsers(false);
      }
    })();

    return () => { active = false; };
  }, []);

  // Filter logic
  const filteredConnections = useMemo(() => {
    return connections.filter(connection =>
      connection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      connection.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [connections, searchQuery]);

  const filteredInvitations = useMemo(() => {
    return invitations.filter(invitation =>
      invitation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invitation.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [invitations, searchQuery]);

  const filteredSuggestedPeople = useMemo(() => {
    return suggestedPeople.filter(person =>
      person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (person.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (person.company || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [suggestedPeople, searchQuery]);

  // Handlers
  const handleAcceptInvitation = (invitationId: string) => {
    const invitation = invitations.find(inv => inv.id === invitationId);
    if (!invitation) return;
    const newConnection: Connection = {
      id: `conn-${Date.now()}`,
      name: invitation.name,
      title: invitation.title,
      avatar: invitation.avatar,
      online: true,
      connectedDate: "Just now"
    };
    setConnections(prev => [newConnection, ...prev]);
    setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    alert(`Connected with ${invitation.name}`);
  };

  const handleIgnoreInvitation = (invitationId: string) => {
    setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
  };

  const handleConnect = (personId: string) => {
    const person = suggestedPeople.find(p => p.id === personId);
    if (!person) return;
    setSuggestedPeople(prev => prev.filter(p => p.id !== personId));
    const newInvitation: Invitation = {
      id: `inv-${Date.now()}`,
      name: person.name,
      title: person.title ?? "Member",
      mutualConnections: person.mutualConnections ?? 0,
      avatar: ""
    };
    setInvitations(prev => [newInvitation, ...prev]);
    alert(`Invitation sent to ${person.name}`);
  };

  const handleRemoveConnection = (connectionId: string) => {
    const connection = connections.find(conn => conn.id === connectionId);
    if (connection && window.confirm(`Remove ${connection.name} from your connections?`)) {
      setConnections(prev => prev.filter(conn => conn.id !== connectionId));
    }
  };

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    if (page === "home") router.push("/");
    else router.push(`/?page=${page}`, { scroll: false });
  };

  const handleSearch = (q: string) => setSearchQuery(q);

  const userStats = {
    totalPosts: 15,
    totalLikes: 124,
    totalConnections: connections.length
  };

  return (
    <div className="min-h-screen bg-gray-200 ">
      <Navbar
        onPageChange={handlePageChange}
        currentPage={currentPage}
        onSearch={handleSearch}
        onCreatePost={() => console.log("Create post clicked")}
        userStats={userStats}
      />

      <div className="pb-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Network</h1>
            <div className="flex items-center space-x-6 text-sm text-gray-700">
              <span><strong>{connections.length}</strong> connections</span>
              <span><strong>{invitations.length}</strong> pending invitations</span>
              <span><strong>{suggestedPeople.length}</strong> people you may know</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-300 mb-6">
            <div className="border-b border-gray-200">
              <div className="flex space-x-8 px-6">
                {[
                  { key: "connections", label: "Connections", count: connections.length },
                  { key: "invitations", label: "Invitations", count: invitations.length },
                  { key: "people", label: "People You May Know", count: suggestedPeople.length }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`py-4 border-b-2 transition-colors flex items-center space-x-2 ${activeTab === tab.key ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                  >
                    <span>{tab.label}</span>
                    {tab.count > 0 && <span className="bg-gray-200 text-gray-700 text-xs rounded-full px-2 py-1">{tab.count}</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {/* Connections */}
              {activeTab === "connections" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {connections.length === 0 ? (
                    <div className="col-span-full text-center py-8"><p className="text-gray-500">No connections found.</p></div>
                  ) : connections.map(connection => (
                    <div key={connection.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">{connection.name.charAt(0)}</div>
                          {connection.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{connection.name}</h3>
                          <p className="text-sm text-gray-600 truncate">{connection.title}</p>
                          <p className="text-xs text-gray-500">Connected {connection.connectedDate}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="flex-1 bg-blue-400 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm">Message</button>
                        <button onClick={() => handleRemoveConnection(connection.id)} className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm" title="Remove connection">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Invitations */}
              {activeTab === "invitations" && (
                <div className="space-y-4">
                  {invitations.length === 0 ? <div className="text-center py-8"><p className="text-gray-500">No pending invitations.</p></div> : invitations.map(invitation => (
                    <div key={invitation.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">{invitation.name.charAt(0)}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900">{invitation.name}</h3>
                          <p className="text-sm text-gray-600">{invitation.title}</p>
                          <p className="text-sm text-blue-500">{invitation.mutualConnections} mutual connections</p>
                          {invitation.message && <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-2 rounded">{invitation.message}</p>}
                        </div>
                        <div className="flex flex-col space-y-2">
                          <button onClick={() => handleAcceptInvitation(invitation.id)} className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-colors text-sm font-medium">Accept</button>
                          <button onClick={() => handleIgnoreInvitation(invitation.id)} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-50 transition-colors text-sm">Ignore</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* People (suggested) */}
              {activeTab === "people" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {loadingUsers ? (
                    <div className="col-span-full text-center py-8">Loading users…</div>
                  ) : filteredSuggestedPeople.length === 0 ? (
                    <div className="col-span-full text-center py-8"><p className="text-gray-500">No users found.</p></div>
                  ) : (
                    filteredSuggestedPeople.map(person => (
                      <div key={person.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="text-center mb-4">
                          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold text-xl mx-auto mb-3">
                            {person.name ? person.name.charAt(0) : "U"}
                          </div>
                          <h3 className="font-semibold text-gray-900">{person.name}</h3>
                          <p className="text-sm text-gray-600">{person.title}</p>
                          {person.company && <p className="text-sm text-gray-500">{person.company}</p>}
                          {person.location && <p className="text-xs text-gray-500">{person.location}</p>}
                          <p className="text-sm text-blue-500 mt-2">{person.mutualConnections ?? 0} mutual connections</p>
                        </div>
                        <button onClick={() => handleConnect(person.id)} className="w-full bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-colors text-sm font-medium">Connect</button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Network Statistics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Network Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{connections.length}</div>
                <div className="text-sm text-gray-600">Total Connections</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{connections.filter(c => c.online).length}</div>
                <div className="text-sm text-gray-600">Online Now</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{invitations.length}</div>
                <div className="text-sm text-gray-600">Pending Invitations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{suggestedPeople.length}</div>
                <div className="text-sm text-gray-600">Suggestions</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default NetworkPage;
