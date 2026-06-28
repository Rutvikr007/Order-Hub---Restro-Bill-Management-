import { create } from "zustand";

interface AppState {
  storeId: string;
  setStoreId: (id: string) => void;
  socketStatus: "connecting" | "connected" | "disconnected";
  setSocketStatus: (status: AppState["socketStatus"]) => void;
  theme: "light" | "dark";
  setTheme: (theme: AppState["theme"]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  storeId: "store-1",
  setStoreId: (id) => set({ storeId: id }),
  socketStatus: "connecting",
  setSocketStatus: (status) => set({ socketStatus: status }),
  theme: "light",
  setTheme: (theme) => set({ theme }),
}));
