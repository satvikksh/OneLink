"use client";

import React, { useState, useMemo, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: "connection" | "message" | "post" | "job" | "reaction" | "mention" | "system";
  title: string;
  message: string;
  sender?: {
    name: string;
    avatar: string;
    id: string;
  };
  target?: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  image?: string;
}

const NotificationsPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "connections" | "messages" | "jobs">("all");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentPage, setCurrentPage] = useState("notifications");
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // Mock notification data
  const initialNotifications: Notification[] = [
    {
      id: "1",
      type: "connection",
      title: "Connection Request",
      message: "Sarah Wilson wants to connect with you",
      sender: {
        name: "Sarah Wilson",
        avatar: "/avatars/sarah.jpg",
        id: "user1"
      },
      timestamp: "5 minutes ago",
      read: false,
      actionUrl: "/network"
    },
    {
      id: "2",
      type: "reaction",
      title: "Post Reaction",
      message: "Alex Johnson liked your post about React best practices",
      sender: {
        name: "Alex Johnson",
        avatar: "/avatars/alex.jpg",
        id: "user2"
      },
      timestamp: "1 hour ago",
      read: false,
      target: "post123"
    },
    {
      id: "3",
      type: "message",
      title: "New Message",
      message: "Mike Chen sent you a message: 'Hey, let's connect about the project'",
      sender: {
        name: "Mike Chen",
        avatar: "/avatars/mike.jpg",
        id: "user3"
      },
      timestamp: "2 hours ago",
      read: true,
      actionUrl: "/chat"
    },
    {
      id: "4",
      type: "job",
      title: "Job Recommendation",
      message: "Based on your profile, we think you'd be a great fit for Senior Frontend Developer at TechCorp",
      timestamp: "5 hours ago",
      read: false,
      actionUrl: "/jobs"
    },
    {
      id: "5",
      type: "mention",
      title: "You were mentioned",
      message: "Emily Davis mentioned you in a comment: 'What do you think about this approach, John?'",
      sender: {
        name: "Emily Davis",
        avatar: "/avatars/emily.jpg",
        id: "user4"
      },
      timestamp: "1 day ago",
      read: true,
      target: "post456"
    },
    {
      id: "6",
      type: "connection",
      title: "Connection Accepted",
      message: "David Brown accepted your connection request",
      sender: {
        name: "David Brown",
        avatar: "/avatars/david.jpg",
        id: "user5"
      },
      timestamp: "1 day ago",
      read: true
    },
    {
      id: "7",
      type: "post",
      title: "New Post from Connection",
      message: "Lisa Wang shared an article about AI in web development",
      sender: {
        name: "Lisa Wang",
        avatar: "/avatars/lisa.jpg",
        id: "user6"
      },
      timestamp: "2 days ago",
      read: true
    },
    {
      id: "8",
      type: "system",
      title: "Profile Strength",
      message: "Your profile is 85% complete. Add more skills to increase your visibility",
      timestamp: "3 days ago",
      read: true,
      actionUrl: "/profile"
    },
    {
      id: "9",
      type: "job",
      title: "Application Update",
      message: "Your application for Product Manager at InnovateLabs has been viewed by the hiring team",
      timestamp: "3 days ago",
      read: false,
      actionUrl: "/jobs/applications"
    },
    {
      id: "10",
      type: "reaction",
      title: "Post Reaction",
      message: "Michael Taylor and 5 others commented on your post",
      sender: {
        name: "Michael Taylor",
        avatar: "/avatars/michael.jpg",
        id: "user7"
      },
      timestamp: "4 days ago",
      read: true,
      target: "post789"
    }
  ];

  // Initialize data
  useEffect(() => {
    setNotifications(initialNotifications);
  }, []);

  // Handle page navigation
  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    
    switch(page) {
      case "home":
        router.push("/");
        break;
      case "network":
        router.push(`/?page=${page}`, { scroll: false });
        break;
      case "jobs":
        router.push(`/?page=${page}`, { scroll: false });
        break;
      case "chat":
        router.push(`/?page=${page}`, { scroll: false });
        break;
      case "notifications":
       router.push(`/?page=${page}`, { scroll: false });
        break;
      case "profile":
       router.push(`/?page=${page}`, { scroll: false });
        break;
      default:
        router.push("/");
    }
  };

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Filter by type
    if (activeFilter !== "all") {
      switch(activeFilter) {
        case "unread":
          filtered = filtered.filter(notification => !notification.read);
          break;
        case "connections":
          filtered = filtered.filter(notification => notification.type === "connection");
          break;
        case "messages":
          filtered = filtered.filter(notification => notification.type === "message");
          break;
        case "jobs":
          filtered = filtered.filter(notification => notification.type === "job");
          break;
      }
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(notification =>
        notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.sender?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [notifications, activeFilter, searchQuery]);

  // Mark notification as read
  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  // Delete notification
  const deleteNotification = (notificationId: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  // Handle notification action
  const handleNotificationAction = (notification: Notification) => {
    // Mark as read first
    markAsRead(notification.id);

    // Navigate or perform action based on type
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    } else if (notification.target) {
      // Handle post/comment navigation
      console.log("Navigate to target:", notification.target);
    } else if (notification.type === "connection" && notification.sender) {
      // Handle connection request
      router.push(`/profile/${notification.sender.id}`);
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch(type) {
      case "connection":
        return "👥";
      case "message":
        return "💬";
      case "post":
        return "📝";
      case "job":
        return "💼";
      case "reaction":
        return "❤️";
      case "mention":
        return "📍";
      case "system":
        return "⚙️";
      default:
        return "🔔";
    }
  };

  // Get notification color based on type
  const getNotificationColor = (type: string) => {
    switch(type) {
      case "connection":
        return "bg-blue-100 text-blue-600";
      case "message":
        return "bg-green-100 text-green-600";
      case "post":
        return "bg-purple-100 text-purple-600";
      case "job":
        return "bg-orange-100 text-orange-600";
      case "reaction":
        return "bg-red-100 text-red-600";
      case "mention":
        return "bg-indigo-100 text-indigo-600";
      case "system":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  // Get unread count
  const unreadCount = useMemo(() => {
    return notifications.filter(notification => !notification.read).length;
  }, [notifications]);

  // Get counts by type
  const notificationCounts = useMemo(() => {
    return {
      all: notifications.length,
      unread: unreadCount,
      connections: notifications.filter(n => n.type === "connection").length,
      messages: notifications.filter(n => n.type === "message").length,
      jobs: notifications.filter(n => n.type === "job").length
    };
  }, [notifications, unreadCount]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCreatePost = () => {
    console.log("Create post clicked");
  };

  // Mock user stats
  const userStats = {
    totalPosts: 15,
    totalLikes: 124,
    totalConnections: 423
  };

  return (
    <div className="min-h-screen bg-gray-200">
      <Navbar 
        onPageChange={handlePageChange}
        currentPage={currentPage}
        onSearch={handleSearch}
        onCreatePost={handleCreatePost}
        userStats={userStats}
      />
      
      <div className="pt-5 pb-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
              
                <p className="text-gray-700">
                  {unreadCount > 0 
                    ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                    : "All caught up!"
                  }
                </p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-300 transition-colors text-sm font-medium"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2 sticky top-24">Notifications</h1>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-44">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
                
                {/* Filter Options */}
                <div className="space-y-2">
                  {[
                    { key: "all", label: "All Notifications", count: notificationCounts.all },
                    { key: "unread", label: "Unread", count: notificationCounts.unread },
                    { key: "connections", label: "Connections", count: notificationCounts.connections },
                    { key: "messages", label: "Messages", count: notificationCounts.messages },
                    { key: "jobs", label: "Jobs", count: notificationCounts.jobs }
                  ].map(filter => (
                    <button
                      key={filter.key}
                      onClick={() => setActiveFilter(filter.key as any)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                        activeFilter === filter.key
                          ? "bg-blue-50 text-blue-600 font-medium"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <span>{filter.label}</span>
                      {filter.count > 0 && (
                        <span className={`text-xs rounded-full px-2 py-1 ${
                          activeFilter === filter.key
                            ? "bg-blue-200 text-blue-800"
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          {filter.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Quick Actions */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h4>
                  <div className="space-y-2">
                    <button
                      onClick={markAllAsRead}
                      className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      Mark all as read
                    </button>
                    <button
                      onClick={() => setNotifications([])}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Clear all notifications
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Notifications List */}
            <div className="lg:col-span-3">
              {/* Search Bar */}
              {/* <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div> */}

              {/* Notifications */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🔔</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
                    <p className="text-gray-500">
                      {activeFilter === "unread" 
                        ? "You're all caught up!" 
                        : "No notifications match your current filters."
                      }
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredNotifications.map(notification => (
                      <div
                        key={notification.id}
                        className={`p-6 hover:bg-gray-50 transition-colors ${
                          !notification.read ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                        }`}
                      >
                        <div className="flex items-start space-x-4">
                          {/* Notification Icon */}
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg ${getNotificationColor(notification.type)}`}>
                            {getNotificationIcon(notification.type)}
                          </div>

                          {/* Notification Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className={`font-semibold ${!notification.read ? "text-gray-900" : "text-gray-700"}`}>
                                  {notification.title}
                                </h3>
                                <p className="text-gray-600 mt-1">{notification.message}</p>
                                
                                {/* Sender Info */}
                                {notification.sender && (
                                  <div className="flex items-center space-x-2 mt-2">
                                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                      {notification.sender.name.charAt(0)}
                                    </div>
                                    <span className="text-sm text-gray-500">{notification.sender.name}</span>
                                  </div>
                                )}

                                {/* Timestamp */}
                                <p className="text-xs text-gray-400 mt-2">{notification.timestamp}</p>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center space-x-2 ml-4">
                                {!notification.read && (
                                  <button
                                    onClick={() => markAsRead(notification.id)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                    title="Mark as read"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteNotification(notification.id)}
                                  className="text-gray-400 hover:text-red-600 transition-colors"
                                  title="Delete notification"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            {(notification.actionUrl || notification.type === "connection") && (
                              <div className="flex space-x-3 mt-4">
                                <button
                                  onClick={() => handleNotificationAction(notification)}
                                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                                >
                                  {notification.type === "connection" ? "View Profile" : 
                                   notification.type === "job" ? "View Job" :
                                   notification.type === "message" ? "Reply" : "View"}
                                </button>
                                
                                {notification.type === "connection" && (
                                  <button
                                    onClick={() => deleteNotification(notification.id)}
                                    className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                                  >
                                    Ignore
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notification Stats */}
              {filteredNotifications.length > 0 && (
                <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{notificationCounts.all}</div>
                      <div className="text-sm text-gray-600">Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{notificationCounts.unread}</div>
                      <div className="text-sm text-gray-600">Unread</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{notificationCounts.connections}</div>
                      <div className="text-sm text-gray-600">Connections</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{notificationCounts.jobs}</div>
                      <div className="text-sm text-gray-600">Jobs</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;