"use client";

import { useState } from "react";
import LoadingWrapper from "../loading-wrapper";

interface Notification {
  id: number;
  message: string;
  time: string;
  isRead: boolean;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, message: "John Doe sent you a connection request.", time: "2m ago", isRead: false },
    { id: 2, message: "Your job application was viewed.", time: "10m ago", isRead: false },
    { id: 3, message: "Anna liked your post.", time: "1h ago", isRead: true },
  ]);

  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  return (
    <LoadingWrapper>
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Notifications</h1>
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <p className="text-gray-500">No notifications yet</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 rounded shadow cursor-pointer ${
                  n.isRead ? "bg-gray-100" : "bg-blue-50"
                }`}
                onClick={() => markAsRead(n.id)}
              >
                <p className="text-gray-800">{n.message}</p>
                <span className="text-xs text-gray-500">{n.time}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </LoadingWrapper>
  );
}
