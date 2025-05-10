import { create } from "zustand";

// Type definitions for the store
export interface InventoryItem {
  // Define item properties according to your needs
  id: string;
  name: string;
  type: string;
  [key: string]: any;
}

export interface BattlepassLevel {
  required_xp: number;
  level: number;
  coins: number;
}

export interface UserBattlepass {
  xp: number;
  season_id: string;
  claimed_levels: number[];
  unlocked_levels: number[];
}

export interface ActiveBattlepass {
  levels: BattlepassLevel[];
  season: string;
  name: string;
  end_date: string;
  start_date: string;
}

export interface InventoryState {
  // State
  items: InventoryItem[];
  userBattlepass: UserBattlepass;
  activeBattlepass: ActiveBattlepass;
  isLoading: boolean;
  error: string | null;

  // Actions
  setItems: (items: InventoryItem[]) => void;
  setUserBattlepass: (battlepass: UserBattlepass) => void;
  setActiveBattlepass: (battlepass: ActiveBattlepass) => void;
  claimLevel: (level: number) => void;
  unlockLevel: (level: number) => void;
  addXp: (amount: number) => void;
  setInventoryFromApi: (data: any) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

// Create the store
export const useInventoryStore = create<InventoryState>((set) => ({
  // Initial state
  items: [],
  userBattlepass: {
    xp: 0,
    season_id: "",
    claimed_levels: [],
    unlocked_levels: [],
  },
  activeBattlepass: {
    levels: [],
    season: "",
    name: "",
    end_date: "",
    start_date: "",
  },
  isLoading: false,
  error: null,

  // Actions
  setItems: (items) => set({ items }),

  setUserBattlepass: (battlepass) => set({ userBattlepass: battlepass }),

  setActiveBattlepass: (battlepass) => set({ activeBattlepass: battlepass }),

  claimLevel: (level) =>
    set((state) => ({
      userBattlepass: {
        ...state.userBattlepass,
        claimed_levels: state.userBattlepass.claimed_levels.includes(level)
          ? state.userBattlepass.claimed_levels
          : [...state.userBattlepass.claimed_levels, level],
      },
    })),

  unlockLevel: (level) =>
    set((state) => ({
      userBattlepass: {
        ...state.userBattlepass,
        unlocked_levels: state.userBattlepass.unlocked_levels.includes(level)
          ? state.userBattlepass.unlocked_levels
          : [...state.userBattlepass.unlocked_levels, level],
      },
    })),

  addXp: (amount) =>
    set((state) => ({
      userBattlepass: {
        ...state.userBattlepass,
        xp: state.userBattlepass.xp + amount,
      },
    })),

  setInventoryFromApi: (data) =>
    set({
      items: data.items || [],
      userBattlepass: data.user_battlepass || {
        xp: 0,
        season_id: "",
        claimed_levels: [],
        unlocked_levels: [],
      },
      activeBattlepass: data.active_battlepass || {
        levels: [],
        season: "",
        name: "",
        end_date: "",
        start_date: "",
      },
    }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),
}));
