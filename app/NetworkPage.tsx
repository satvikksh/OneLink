"use client";

import React, { useEffect, useMemo, useState } from "react";

type TabKey = "connections" | "invitations" | "people";

interface Person {
  id: string;
  name: string;
  title: string;
  company?: string;
  location?: string;
  mutualConnections: number;
}

interface Connection extends Person {
  connectedDate: string;
  online: boolean;
}

interface Invitation extends Person {
  message?: string;
}

interface ApiUser {
  _id?: string;
  id?: string;
  username?: string;
  name?: string;
  role?: string;
  headline?: string | null;
}

const INITIAL_CONNECTIONS: Connection[] = [
  {
    id: "conn-1",
    name: "Sarah Wilson",
    title: "Product Manager",
    company: "OneLink",
    location: "Austin, TX",
    mutualConnections: 6,
    connectedDate: "2 weeks ago",
    online: true,
  },
  {
    id: "conn-2",
    name: "Satvik Kushwaha",
    title: "Senior Designer",
    company: "Design Hub",
    location: "Seattle, WA",
    mutualConnections: 3,
    connectedDate: "1 month ago",
    online: false,
  },
];

const INITIAL_INVITATIONS: Invitation[] = [
  {
    id: "inv-1",
    name: "John Martinez",
    title: "Engineering Manager",
    company: "ByteWorks",
    location: "San Jose, CA",
    mutualConnections: 4,
    message: "Would like to connect and collaborate.",
  },
];

const INITIAL_SUGGESTIONS: Person[] = [
  {
    id: "s-1",
    name: "Priya Patel",
    title: "Full Stack Developer",
    company: "CloudLine",
    location: "New York, NY",
    mutualConnections: 2,
  },
  {
    id: "s-2",
    name: "Michael Taylor",
    title: "Software Engineer",
    company: "Northstar",
    location: "San Francisco, CA",
    mutualConnections: 5,
  },
];

function normalizeRole(value?: string): string {
  if (!value) return "Member";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function NetworkPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("people");
  const [query, setQuery] = useState("");
  const [connections, setConnections] = useState<Connection[]>(INITIAL_CONNECTIONS);
  const [invitations, setInvitations] = useState<Invitation[]>(INITIAL_INVITATIONS);
  const [suggestedPeople, setSuggestedPeople] = useState<Person[]>(INITIAL_SUGGESTIONS);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setFeedback(""), 2500);
    return () => clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await fetch("/api/users", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json().catch(() => ({}));
        if (!active) return;
        if (!res.ok) return;

        const users: ApiUser[] = Array.isArray(data?.users) ? data.users : [];
        if (users.length === 0) return;

        const mapped = users
          .map((user, index) => {
            const id = String(user._id ?? user.id ?? `user-${index}`);
            const name = user.name || user.username || "Unknown User";
            const title = user.headline || normalizeRole(user.role);
            return {
              id,
              name,
              title,
              mutualConnections: (index % 8) + 1,
            } as Person;
          })
          .filter((user) => !connections.some((conn) => conn.id === user.id))
          .filter((user) => !invitations.some((inv) => inv.id === user.id));

        if (mapped.length > 0) {
          setSuggestedPeople(mapped);
        }
      } finally {
        if (active) setLoadingUsers(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [connections, invitations]);

  const search = query.trim().toLowerCase();

  const filteredConnections = useMemo(() => {
    if (!search) return connections;
    return connections.filter(
      (item) =>
        item.name.toLowerCase().includes(search) ||
        item.title.toLowerCase().includes(search) ||
        (item.company || "").toLowerCase().includes(search)
    );
  }, [connections, search]);

  const filteredInvitations = useMemo(() => {
    if (!search) return invitations;
    return invitations.filter(
      (item) =>
        item.name.toLowerCase().includes(search) ||
        item.title.toLowerCase().includes(search) ||
        (item.company || "").toLowerCase().includes(search)
    );
  }, [invitations, search]);

  const filteredSuggestions = useMemo(() => {
    if (!search) return suggestedPeople;
    return suggestedPeople.filter(
      (item) =>
        item.name.toLowerCase().includes(search) ||
        item.title.toLowerCase().includes(search) ||
        (item.company || "").toLowerCase().includes(search)
    );
  }, [suggestedPeople, search]);

  const handleConnect = (id: string) => {
    const person = suggestedPeople.find((item) => item.id === id);
    if (!person) return;

    setSuggestedPeople((prev) => prev.filter((item) => item.id !== id));
    setInvitations((prev) => [
      { ...person, id: `inv-${id}`, message: "Invitation sent by you" },
      ...prev,
    ]);
    setFeedback(`Invitation sent to ${person.name}`);
  };

  const handleAcceptInvitation = (id: string) => {
    const invitation = invitations.find((item) => item.id === id);
    if (!invitation) return;

    const newConnection: Connection = {
      ...invitation,
      id: `conn-${invitation.id}`,
      connectedDate: "Just now",
      online: true,
    };

    setInvitations((prev) => prev.filter((item) => item.id !== id));
    setConnections((prev) => [newConnection, ...prev]);
    setFeedback(`Connected with ${invitation.name}`);
  };

  const handleIgnoreInvitation = (id: string) => {
    setInvitations((prev) => prev.filter((item) => item.id !== id));
  };

  const handleRemoveConnection = (id: string) => {
    setConnections((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Network</h1>
          <p className="text-gray-600 mt-1">Manage your connections and discover new people.</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-sm text-gray-500">Connections</p>
              <p className="text-2xl font-bold text-blue-600">{connections.length}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-sm text-gray-500">Online now</p>
              <p className="text-2xl font-bold text-green-600">{connections.filter((c) => c.online).length}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-sm text-gray-500">Invitations</p>
              <p className="text-2xl font-bold text-orange-600">{invitations.length}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-sm text-gray-500">Suggestions</p>
              <p className="text-2xl font-bold text-purple-600">{suggestedPeople.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="border-b border-gray-200 px-4 py-4 flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("people")}
                className={`px-3 py-2 rounded-lg text-sm ${
                  activeTab === "people" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                People You May Know
              </button>
              <button
                onClick={() => setActiveTab("invitations")}
                className={`px-3 py-2 rounded-lg text-sm ${
                  activeTab === "invitations" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Invitations
              </button>
              <button
                onClick={() => setActiveTab("connections")}
                className={`px-3 py-2 rounded-lg text-sm ${
                  activeTab === "connections" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Connections
              </button>
            </div>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people, title, company..."
              className="md:ml-auto w-full md:w-72 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {feedback && (
            <div className="px-4 py-3 text-sm bg-green-50 text-green-700 border-b border-green-100">{feedback}</div>
          )}

          <div className="p-4 md:p-6">
            {activeTab === "people" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loadingUsers ? (
                  <p className="col-span-full text-gray-500">Loading suggestions...</p>
                ) : filteredSuggestions.length === 0 ? (
                  <p className="col-span-full text-gray-500">No suggested people found.</p>
                ) : (
                  filteredSuggestions.map((person) => (
                    <div key={person.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-lg mb-3">
                        {person.name.charAt(0)}
                      </div>
                      <h3 className="font-semibold text-gray-900">{person.name}</h3>
                      <p className="text-sm text-gray-600">{person.title}</p>
                      {person.company && <p className="text-sm text-gray-500">{person.company}</p>}
                      {person.location && <p className="text-xs text-gray-500 mt-1">{person.location}</p>}
                      <p className="text-sm text-blue-600 mt-2">{person.mutualConnections} mutual connections</p>
                      <button
                        onClick={() => handleConnect(person.id)}
                        className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg py-2"
                      >
                        Connect
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "invitations" && (
              <div className="space-y-3">
                {filteredInvitations.length === 0 ? (
                  <p className="text-gray-500">No pending invitations.</p>
                ) : (
                  filteredInvitations.map((invitation) => (
                    <div key={invitation.id} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900">{invitation.name}</h3>
                      <p className="text-sm text-gray-600">{invitation.title}</p>
                      {invitation.company && <p className="text-sm text-gray-500">{invitation.company}</p>}
                      <p className="text-sm text-blue-600 mt-2">
                        {invitation.mutualConnections} mutual connections
                      </p>
                      {invitation.message && <p className="text-sm text-gray-600 mt-2">{invitation.message}</p>}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleAcceptInvitation(invitation.id)}
                          className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleIgnoreInvitation(invitation.id)}
                          className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Ignore
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "connections" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredConnections.length === 0 ? (
                  <p className="text-gray-500">No connections found.</p>
                ) : (
                  filteredConnections.map((connection) => (
                    <div key={connection.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{connection.name}</h3>
                          <p className="text-sm text-gray-600">{connection.title}</p>
                          {connection.company && <p className="text-sm text-gray-500">{connection.company}</p>}
                          <p className="text-xs text-gray-500 mt-1">Connected {connection.connectedDate}</p>
                        </div>
                        {connection.online && <span className="text-xs text-green-600 font-medium">Online</span>}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm">Message</button>
                        <button
                          onClick={() => handleRemoveConnection(connection.id)}
                          className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
