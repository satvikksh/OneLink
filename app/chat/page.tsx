"use client";

import { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:3000"); // socket server ka URL

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<string[]>([]);
  const [username, setUsername] = useState("");
  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    socket.on("receive-message", (msg) => {
      setChat((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("receive-message");
    };
  }, []);

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("send-message", `${username}: ${message}`);
      setMessage("");
    }
  };

  const joinChat = () => {
    if (username.trim()) {
      setIsJoined(true);
    }
  };

  return (
    <div className="p-6">
      {!isJoined ? (
        <div>
          <h1 className="text-xl font-bold mb-4">Join Chat</h1>
          <input
            type="text"
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border p-2 rounded mr-2"
          />
          <button
            onClick={joinChat}
            className="bg-blue-600 text-gray px-4 py-2 rounded"
          >
            Join
          </button>
        </div>
      ) : (
        <div>
          <h1 className="text-xl font-bold mb-4">Chat Room</h1>
          <div className="border h-64 p-2 mb-4 overflow-y-auto bg-black-100 rounded">
            {chat.map((msg, i) => (
              <div key={i} className="mb-1">{msg}</div>
            ))}
          </div>
          <div className="flex">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="border p-2 flex-1 rounded mr-2"
              placeholder="Type a message..."
            />
            <button
              onClick={sendMessage}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
