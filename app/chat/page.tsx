"use client";

import React, { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "other";
  timestamp: Date;
  read: boolean;
}

interface ChatUser {
  id: string;
  name: string;
  avatar: string;
  title: string;
  online: boolean;
  lastSeen?: Date;
}

const ChatPage: React.FC = () => {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState<{ [key: string]: Message[] }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock chat users
  const chatUsers: ChatUser[] = [
    {
      id: "1",
      name: "Sarah Wilson",
      avatar: "/avatars/sarah.jpg",
      title: "Product Manager at TechCorp",
      online: true
    },
    {
      id: "2",
      name: "Alex Johnson",
      avatar: "/avatars/alex.jpg",
      title: "Senior Designer",
      online: false,
      lastSeen: new Date(Date.now() - 30 * 60 * 1000)
    },
    {
      id: "3",
      name: "Mike Chen",
      avatar: "/avatars/mike.jpg",
      title: "Backend Developer",
      online: true
    }
  ];

  // Initialize with some mock messages
  useEffect(() => {
    const initialMessages: { [key: string]: Message[] } = {
      "1": [
        {
          id: "1-1",
          text: "Hey! How's the project going?",
          sender: "other",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          read: true
        },
        {
          id: "1-2",
          text: "It's going great! Just finished the main features.",
          sender: "user",
          timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
          read: true
        }
      ],
      "2": [
        {
          id: "2-1",
          text: "Hi there! I saw your design portfolio, it's amazing!",
          sender: "other",
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          read: true
        }
      ],
      "3": [
        {
          id: "3-1",
          text: "The API documentation is ready for review.",
          sender: "other",
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
          read: true
        }
      ]
    };
    setMessages(initialMessages);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, activeChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeChat) return;

    const newMessage: Message = {
      id: `${activeChat}-${Date.now()}`,
      text: messageInput,
      sender: "user",
      timestamp: new Date(),
      read: false
    };

    setMessages(prev => ({
      ...prev,
      [activeChat]: [...(prev[activeChat] || []), newMessage]
    }));

    setMessageInput("");

    // Simulate reply after 1-3 seconds
    setTimeout(() => {
      const replies = [
        "Thanks for your message!",
        "That's interesting, tell me more.",
        "I'll get back to you on that.",
        "Sounds good to me!",
        "Let me check and get back to you."
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];

      const replyMessage: Message = {
        id: `${activeChat}-${Date.now()}-reply`,
        text: randomReply,
        sender: "other",
        timestamp: new Date(),
        read: false
      };

      setMessages(prev => ({
        ...prev,
        [activeChat]: [...(prev[activeChat] || []), replyMessage]
      }));
    }, 1000 + Math.random() * 2000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getLastMessage = (userId: string) => {
    const userMessages = messages[userId];
    return userMessages?.[userMessages.length - 1]?.text || "No messages yet";
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-5 pb-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex h-[600px]">
            {/* Left Sidebar - Chat List */}
            <div className="w-1/3 border-r border-gray-200 bg-gray-50">
              <div className="p-4 border-b border-gray-200 bg-white">
                <h2 className="text-xl font-bold text-gray-900">Messages</h2>
                <div className="relative mt-3">
                  <input
                    type="text"
                    placeholder="Search messages..."
                    className="w-full px-4 py-2 pl-10 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Chat List */}
              <div className="overflow-y-auto h-full">
                {chatUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => setActiveChat(user.id)}
                    className={`w-full p-4 border-b border-gray-100 hover:bg-white transition-colors text-left ${
                      activeChat === user.id ? "bg-white border-l-4 border-l-blue-500" : ""
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-12 h-12 rounded-full"
                        />
                        {user.online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-gray-900 truncate">{user.name}</h3>
                          <span className="text-xs text-gray-500">
                            {messages[user.id]?.[messages[user.id]?.length - 1]?.timestamp && 
                              formatTime(messages[user.id][messages[user.id].length - 1].timestamp)
                            }
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{user.title}</p>
                        <p className="text-sm text-gray-500 truncate mt-1">
                          {getLastMessage(user.id)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Side - Chat Area */}
            <div className="flex-1 flex flex-col">
              {activeChat ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img
                          src={chatUsers.find(u => u.id === activeChat)?.avatar}
                          alt="User"
                          className="w-10 h-10 rounded-full"
                        />
                        {chatUsers.find(u => u.id === activeChat)?.online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {chatUsers.find(u => u.id === activeChat)?.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {chatUsers.find(u => u.id === activeChat)?.online ? "Online" : "Offline"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    <div className="space-y-4">
                      {messages[activeChat]?.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                              message.sender === "user"
                                ? "bg-blue-500 text-white rounded-br-none"
                                : "bg-white text-gray-900 rounded-bl-none border border-gray-200"
                            }`}
                          >
                            <p className="text-sm">{message.text}</p>
                            <p
                              className={`text-xs mt-1 ${
                                message.sender === "user" ? "text-blue-100" : "text-gray-500"
                              }`}
                            >
                              {formatTime(message.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200 bg-white text-black">
                    <form onSubmit={handleSendMessage} className="flex space-x-4">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="submit"
                        disabled={!messageInput.trim()}
                        className="bg-blue-500 text-white px-6 py-3 rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Send
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                /* Empty State */
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a conversation</h3>
                    <p className="text-gray-500">Choose a chat from the sidebar to start messaging</p>
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

export default ChatPage;