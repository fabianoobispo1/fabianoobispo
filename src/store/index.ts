"use client";

import { FilteredUser } from "@/lib/types";
import { create } from "zustand";

type Store = {
  authUser: FilteredUser | null;
  requestLoading: boolean;
  token: string | null ;
  setAuthUser: (user: FilteredUser | null) => void;
  setRequestLoading: (isLoading: boolean) => void;
  setToken: (token: string) => void;
  reset: () => void;
};

const useStore = create<Store>((set) => ({ 
  authUser: null,
  requestLoading: false,
  token: null,
  setAuthUser: (user) => set((state) => ({ ...state, authUser: user })),
  setRequestLoading: (isLoading) =>  set((state) => ({ ...state, requestLoading: isLoading })),
  setToken: (token) => set((state) => ({ ...state, token: token })),
  reset: () => set({  authUser: null, requestLoading: false, token: null }),
}));

export default useStore;
