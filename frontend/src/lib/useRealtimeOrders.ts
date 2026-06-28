"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getSocket, joinStoreRoom, leaveStoreRoom } from "@/lib/socket";
import { useAppStore } from "@/store/useAppStore";
import { Order } from "@/types";

/**
 * Joins the room for `storeId`, then on order:new / order:status_updated
 * invalidates the orders list query so React Query refetches it -
 * keeping pagination/sorting logic in one place instead of hand-rolling
 * an optimistic cache merge.
 */
export function useRealtimeOrders(storeId: string) {
  const queryClient = useQueryClient();
  const setSocketStatus = useAppStore((s) => s.setSocketStatus);

  useEffect(() => {
    if (!storeId) return;

    const socket = getSocket();

    const handleConnect = () => {
      setSocketStatus("connected");
      joinStoreRoom(storeId);
    };
    const handleDisconnect = () => setSocketStatus("disconnected");
    const handleConnecting = () => setSocketStatus("connecting");

    const handleOrderEvent = (_order: Order) => {
      queryClient.invalidateQueries({ queryKey: ["orders", storeId] });
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("reconnect_attempt", handleConnecting);
    socket.on("order:new", handleOrderEvent);
    socket.on("order:status_updated", handleOrderEvent);

    if (socket.connected) handleConnect();

    return () => {
      leaveStoreRoom(storeId);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("reconnect_attempt", handleConnecting);
      socket.off("order:new", handleOrderEvent);
      socket.off("order:status_updated", handleOrderEvent);
    };
  }, [storeId, queryClient, setSocketStatus]);
}
