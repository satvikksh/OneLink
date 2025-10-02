import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const httpServer = createServer(app);

// ✅ Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000", // tumhara Next.js frontend
    methods: ["GET", "POST"],
  },
});

// ✅ Jab user connect ho
io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  // Message receive karke broadcast karna
  socket.on("sendMessage", (msg) => {
    console.log("📩 Message:", msg);
    io.emit("receiveMessage", msg);
  });

  // Jab user disconnect ho
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// ✅ Server run karo
httpServer.listen(4000, () => {
  console.log("🚀 Socket.IO server running on http://localhost:4000");
});
