export type ChainKind = "evm" | "sol" | "tron";

export interface UserData {
  address: string;
  chain: ChainKind;
  points: number;
  completedTasks: string[];
  lastLogin: string; // ISO date string
  consecutiveLogins: number;
  socialConnections: {
    twitter: boolean;
    discord: boolean;
  };
}

export interface RewardsState {
  chain: ChainKind | null;
  chainType: "evm" | "tron" | "solana" | null; // API-compatible alias
  address: string | null;
  isConnected: boolean;
}

// Mock database to store user data by address
const MOCK_DB_KEY = "perpx_mock_db";

export const rewardsStorage = {
  // Session state (current connection)
  get: (): RewardsState => {
    try {
      const data = localStorage.getItem("perpx_rewards_state");
      if (data) {
        const parsed = JSON.parse(data);
        // Map chain to chainType for API compatibility
        const chainTypeMap: Record<string, "evm" | "tron" | "solana"> = {
          evm: "evm",
          sol: "solana",
          tron: "tron"
        };
        return {
          ...parsed,
          chainType: parsed.chain ? chainTypeMap[parsed.chain] || "evm" : null
        };
      }
      return { chain: null, chainType: null, address: null, isConnected: false };
    } catch {
      return { chain: null, chainType: null, address: null, isConnected: false };
    }
  },
  set: (state: RewardsState) => {
    localStorage.setItem("perpx_rewards_state", JSON.stringify(state));
  },

  // Persistent user data (simulating backend)
  getUserData: (address: string): UserData | null => {
    try {
      const db = JSON.parse(localStorage.getItem(MOCK_DB_KEY) || "{}");
      return db[address] || null;
    } catch {
      return null;
    }
  },
  
  saveUserData: (address: string, data: UserData) => {
    try {
      const db = JSON.parse(localStorage.getItem(MOCK_DB_KEY) || "{}");
      db[address] = data;
      localStorage.setItem(MOCK_DB_KEY, JSON.stringify(db));
    } catch (e) {
      console.error("Failed to save user data", e);
    }
  },

  // Initialize user if not exists
  initUser: (address: string, chain: ChainKind): UserData => {
    const existing = rewardsStorage.getUserData(address);
    if (existing) return existing;

    const newUser: UserData = {
      address,
      chain,
      points: 300, // Initial connection bonus
      completedTasks: ['connect-wallet'],
      lastLogin: new Date().toISOString(),
      consecutiveLogins: 1,
      socialConnections: {
        twitter: false,
        discord: false
      }
    };
    rewardsStorage.saveUserData(address, newUser);
    return newUser;
  },

  // Helper to get JST date string (YYYY-MM-DD)
  getJSTDateString: (): string => {
    // Create date object for current time
    const now = new Date();
    // Convert to JST (UTC+9)
    const jstOffset = 9 * 60;
    const jstTime = new Date(now.getTime() + (jstOffset + now.getTimezoneOffset()) * 60000);
    return jstTime.toISOString().split('T')[0];
  }
};
