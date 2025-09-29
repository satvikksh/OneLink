// File: src/app/network/page.tsx
"use client";

import React, { useState } from "react";

// Mock data for connections
interface User {
  id: number;
  name: string;
  title: string;
  avatar: string;
}

const suggestedUsers: User[] = [
  { id: 1, name: "Alice Johnson", title: "Software Engineer", avatar: "/avatars/alice.jpg" },
  { id: 2, name: "Bob Smith", title: "Product Manager", avatar: "/avatars/bob.jpg" },
  { id: 3, name: "Charlie Brown", title: "UI/UX Designer", avatar: "/avatars/charlie.jpg" },
];

const currentConnections: User[] = [
  { id: 4, name: "David Lee", title: "Backend Developer", avatar: "/avatars/david.jpg" },
  { id: 5, name: "Eva Green", title: "Frontend Developer", avatar: "/avatars/eva.jpg" },
];

const MyNetworkPage: React.FC = () => {
  const [suggestions, setSuggestions] = useState<User[]>(suggestedUsers);
  const [connections, setConnections] = useState<User[]>(currentConnections);

  const addConnection = (user: User) => {
    setConnections([...connections, user]);
    setSuggestions(suggestions.filter((u) => u.id !== user.id));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">My Network</h1>

      {/* Connection Suggestions */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">People You May Know</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {suggestions.map((user) => (
            <div
              key={user.id}
              className="border p-4 rounded shadow flex flex-col items-center"
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-20 h-20 rounded-full mb-2"
              />
              <h3 className="font-semibold">{user.name}</h3>
              <p className="text-sm text-gray-500">{user.title}</p>
              <button
                onClick={() => addConnection(user)}
                className="mt-2 bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
              >
                Connect
              </button>
            </div>
          ))}
          {suggestions.length === 0 && <p>No new suggestions</p>}
        </div>
      </section>

      {/* Current Connections */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Your Connections</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {connections.map((user) => (
            <div
              key={user.id}
              className="border p-4 rounded shadow flex flex-col items-center"
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-20 h-20 rounded-full mb-2"
              />
              <h3 className="font-semibold">{user.name}</h3>
              <p className="text-sm text-gray-500">{user.title}</p>
              <span className="mt-2 text-green-600 font-semibold">Connected</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default MyNetworkPage;
