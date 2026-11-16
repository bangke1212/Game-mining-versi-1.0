// Catalogues for the RollerCoin-like simulation.
// Prices are in RLT (in-game only). Nothing here has real-world value.
import type { Coin, CoinId, League, MinerCatalogItem, RackCatalogItem } from "./types";

export const COINS: Record<CoinId, Coin> = {
  BTC: { id: "BTC", name: "Bitcoin", symbol: "BTC", blockReward: 0.00042, decimals: 8, color: "#f7931a" },
  ETH: { id: "ETH", name: "Ethereum", symbol: "ETH", blockReward: 0.006, decimals: 6, color: "#627eea" },
  DOGE: { id: "DOGE", name: "Dogecoin", symbol: "DOGE", blockReward: 12, decimals: 4, color: "#c2a633" },
  SOL: { id: "SOL", name: "Solana", symbol: "SOL", blockReward: 0.05, decimals: 4, color: "#9945ff" },
  BNB: { id: "BNB", name: "BNB Chain", symbol: "BNB", blockReward: 0.02, decimals: 4, color: "#f0b90b" },
  LTC: { id: "LTC", name: "Litecoin", symbol: "LTC", blockReward: 0.15, decimals: 4, color: "#345d9d" },
};

export const MINERS: MinerCatalogItem[] = [
  { id: "pico", name: "Pico Miner", powerGh: 12, priceRlt: 50, rarity: "Common", desc: "Starter virtual miner. Small, quiet, honest." },
  { id: "nano", name: "Nano Rig", powerGh: 35, priceRlt: 120, rarity: "Common", desc: "A solid step up for a growing virtual room." },
  { id: "turbo-ant", name: "Turbo Ant", powerGh: 90, priceRlt: 300, rarity: "Rare", desc: "Fast little worker with a big appetite for RLT." },
  { id: "hash-falcon", name: "Hash Falcon", powerGh: 220, priceRlt: 650, rarity: "Rare", desc: "Swoops in and hashes hard all day." },
  { id: "titan-forge", name: "Titan Forge", powerGh: 600, priceRlt: 1500, rarity: "Epic", desc: "Heavy virtual iron for serious leagues." },
  { id: "quantum-beast", name: "Quantum Beast", powerGh: 1500, priceRlt: 3500, rarity: "Legendary", desc: "The beast every virtual miner dreams of." },
];

export const RACKS: RackCatalogItem[] = [
  { id: "rack-4", name: "Rack 4-Slot", slots: 4, priceRlt: 200, desc: "Adds 4 miner slots to your room." },
  { id: "rack-8", name: "Rack 8-Slot", slots: 8, priceRlt: 500, desc: "Adds 8 miner slots to your room." },
];

/** Cost in RLT to expand the room by one rack bay (max room level 4). */
export const ROOM_EXPAND_COST = 800;
export const MAX_ROOM_LEVEL = 4;
/** Max racks allowed = roomLevel + 1 (room starts at level 1 with 1 rack bay). */
export const maxRacksForRoom = (roomLevel: number) => roomLevel + 1;

export const LEAGUES: League[] = [
  { id: "bronze", name: "Bronze", minPowerGh: 0, poolMultiplier: 1, color: "#cd7f32" },
  { id: "silver", name: "Silver", minPowerGh: 100, poolMultiplier: 1.25, color: "#c0c0c0" },
  { id: "gold", name: "Gold", minPowerGh: 500, poolMultiplier: 1.6, color: "#ffd700" },
  { id: "diamond", name: "Diamond", minPowerGh: 2000, poolMultiplier: 2, color: "#79b9ff" },
  { id: "titan", name: "Titan", minPowerGh: 10000, poolMultiplier: 3, color: "#b69cff" },
];

export const STARTER_RLT = 300;
export const DAILY_LOGIN_RLT = 25;
export const QUEST_GAMES_RLT = 50;
export const QUEST_BLOCKS_RLT = 30;
export const BLOCK_RLT_BONUS = 5;

export const minerById = (id: string) => MINERS.find((m) => m.id === id);
export const rackById = (id: string) => RACKS.find((r) => r.id === id);
