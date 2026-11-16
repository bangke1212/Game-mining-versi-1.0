// RollerCoin-like game types — SIMULATION ONLY.
// No real crypto, no real money, no real withdrawal. All balances are virtual.
export type CoinId = "BTC" | "ETH" | "DOGE" | "SOL" | "BNB" | "LTC";

export type Coin = {
  id: CoinId;
  name: string;
  symbol: string;
  /** Simulated reward pool paid out per block (virtual units of that coin). */
  blockReward: number;
  decimals: number;
  color: string;
};

export type Rarity = "Common" | "Rare" | "Epic" | "Legendary";

export type MinerCatalogItem = {
  id: string;
  name: string;
  powerGh: number;
  priceRlt: number;
  rarity: Rarity;
  desc: string;
};

export type RackCatalogItem = {
  id: string;
  name: string;
  slots: number;
  priceRlt: number;
  desc: string;
};

export type OwnedMiner = {
  uid: string;
  catalogId: string;
  on: boolean;
  boughtAt: number;
};

export type OwnedRack = { uid: string; catalogId: string; boughtAt: number };

export type TempPower = {
  id: string;
  gh: number;
  expiresAt: number;
  source: string;
};

export type League = {
  id: string;
  name: string;
  minPowerGh: number;
  /** Multiplier applied to every coin's block reward pool in this league. */
  poolMultiplier: number;
  color: string;
};

export type BlockRewardEntry = {
  height: number;
  at: number;
  league: string;
  totalPowerGh: number;
  rewards: Partial<Record<CoinId, number>>;
  rltBonus: number;
};

export type GameEvent = {
  id: number;
  time: string;
  kind: string;
  level: "INFO" | "WARN" | "SUCCESS";
  text: string;
};

export type DailyState = {
  lastLoginDate: string; // YYYY-MM-DD
  streak: number;
  dailyClaimedDate: string; // YYYY-MM-DD, "" if never
  miniGamesPlayedToday: number;
  miniGamesDate: string;
  questGamesClaimedDate: string;
  questBlocksClaimedDate: string;
};

export type GameState = {
  version: 1;
  rlt: number;
  balances: Record<CoinId, number>;
  ownedMiners: OwnedMiner[];
  racks: OwnedRack[];
  roomLevel: number;
  allocations: Record<CoinId, number>; // percent, sums to 100
  tempPower: TempPower[];
  blockHeight: number;
  blockHistory: BlockRewardEntry[];
  events: GameEvent[];
  stats: { blocksMined: number; miniGamesPlayed: number; minersBought: number };
  daily: DailyState;
  blockIntervalSec: number;
  nextBlockAt: number;
  paused: boolean;
  createdAt: number;
};

export type MiniGameResult = {
  tempGh: number;
  tempMinutes: number;
  rltBonus: number;
  source: string;
  summary: string;
};

export const COIN_IDS: CoinId[] = ["BTC", "ETH", "DOGE", "SOL", "BNB", "LTC"];
