import { Server } from "socket.io";

let io: Server | null = null;

export async function GET() {
  if (!io) {
    io = new Server(3001, {
      cors: { origin: "*" },
    });

    io.on("connection", (socket) => {
      console.log("User connected:", socket.id);

      socket.on("send-message", (msg) => {
        io?.emit("receive-message", msg);
      });

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
      });
    });
  }

  return new Response("Socket server running", { status: 200 });
}
