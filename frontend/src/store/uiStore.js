import { create } from "zustand";
export const useUIStore = create((set) => ({ activeTab: "dashboard", setActiveTab: (tab) => set({ activeTab: tab }) }));
