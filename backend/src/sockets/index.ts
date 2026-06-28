import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";

let io: Server | null = null;

const storeRoom = (storeId: string) => `store:${storeId}`;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: (process.env.CORS_ORIGIN ?? "*").split(","),
      methods: ["GET", "POST"],
    },
    // Helps clients detect a dropped connection quickly so their own
    // reconnect logic (handled client-side) can kick in promptly.
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  io.on("connection", (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Store-based event filtering: a client joins the room for the
    // store(s) it cares about and only receives events for those stores.
    socket.on("join_store", (storeId: string) => {
      if (typeof storeId === "string" && storeId.length > 0) {
        socket.join(storeRoom(storeId));
        socket.emit("joined_store", storeId);
      }
    });

    socket.on("leave_store", (storeId: string) => {
      if (typeof storeId === "string") {
        socket.leave(storeRoom(storeId));
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}

export function getIo(): Server {
  if (!io) {
    throw new Error("Socket.IO has not been initialised yet. Call initSocket() first.");
  }
  return io;
}

export function emitOrderCreated(storeId: string, order: unknown) {
  getIo().to(storeRoom(storeId)).emit("order:new", order);
}

export function emitOrderStatusUpdated(storeId: string, order: unknown) {
  getIo().to(storeRoom(storeId)).emit("order:status_updated", order);
}
