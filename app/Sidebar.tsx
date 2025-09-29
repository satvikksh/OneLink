// src/components/Sidebar.tsx
import React from "react";

interface User {
  id: number;
  name: string;
  title: string;
  avatar: string;
}

interface SidebarProps {
  suggestions: User[];
  addConnection: (user: User) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ suggestions, addConnection }) => {
  return (
    <aside className="w-80 space-y-4">
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-2">Profile</h2>
        <div className="flex items-center gap-3">
          <img src="/avatars/user.jpg" alt="Your Avatar" className="w-12 h-12 rounded-full" />
          <div>
            <p className="font-semibold">Your Name</p>
            <p className="text-sm text-gray-500">Your Title</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-2">People You May Know</h2>
        <div className="space-y-2">
          {suggestions.map((user) => (
            <div key={user.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                <div>
                  <p className="font-semibold text-sm">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.title}</p>
                </div>
              </div>
              <button
                onClick={() => addConnection(user)}
                className="text-blue-700 text-xs font-semibold hover:underline"
              >
                Connect
              </button>
            </div>
          ))}
          {suggestions.length === 0 && <p className="text-gray-500 text-xs">No suggestions</p>}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
