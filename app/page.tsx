// src/app/page.tsx
"use client";

import React, { useState } from "react";
// import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Feed from "./Feed";

interface Post {
  id: number;
  user: string;
  title: string;
  content: string;
  avatar: string;
  timestamp: string;
}

interface User {
  id: number;
  name: string;
  title: string;
  avatar: string;
}

const postsData: Post[] = [
  { id: 1, user: "Alice Johnson", title: "Excited to start my new role!", content: "Today I joined XYZ Corp as a Software Engineer.", avatar: "/avatars/alice.jpg", timestamp: "2h ago" },
  { id: 2, user: "Bob Smith", title: "Project Launch", content: "Our team successfully launched the new feature.", avatar: "/avatars/bob.jpg", timestamp: "5h ago" },
];

const suggestedUsers: User[] = [
  { id: 1, name: "Charlie Brown", title: "UI/UX Designer", avatar: "/avatars/charlie.jpg" },
  { id: 2, name: "David Lee", title: "Backend Developer", avatar: "/avatars/david.jpg" },
];

const HomePage: React.FC = () => {
  const [posts] = useState<Post[]>(postsData);
  const [suggestions, setSuggestions] = useState<User[]>(suggestedUsers);

  const addConnection = (user: User) => {
    setSuggestions(suggestions.filter((u) => u.id !== user.id));
    alert(`${user.name} added to connections!`);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* <Navbar /> */}
      <main className="max-w-6xl mx-auto mt-6 flex gap-6">
        <Feed posts={posts} />
        <Sidebar suggestions={suggestions} addConnection={addConnection} />
      </main>
    </div>
  );
};

export default HomePage;
