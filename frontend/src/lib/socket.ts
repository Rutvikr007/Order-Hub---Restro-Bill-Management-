import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "./api";

let socket: Socket | null = null;

/**
 * Returns a shared Socket.IO client instance. socket.io-client already
 * retries with exponential backoff out of the box; we just configure
 * sane bounds and surface connection state through the listeners below.
 */
export function getSocket(): Socket {
  if (socket) return socket;

  socket = io(API_BASE_URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    transports: ["websocket", "polling"],
  });

  return socket;
}

/** Joins the room for a store so this client only receives that store's events. */
export function joinStoreRoom(storeId: string) {
  if (!storeId) return;
  getSocket().emit("join_store", storeId);
}

export function leaveStoreRoom(storeId: string) {
  if (!storeId) return;
  getSocket().emit("leave_store", storeId);
}
