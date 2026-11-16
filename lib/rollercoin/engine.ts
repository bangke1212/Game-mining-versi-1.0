// Core game engine — pure functions, no React, no I/O.
// Modelled on RollerCoin's public concept:
//   * permanent power from owned virtual miners placed in racks
//   * temporary power from arcade mini-games (expires)
//   * power allocated across coins in %; each block's reward pool is
//     shared proportionally to a player's share of simulated network power
//   * leagues tiered by total power, with bigger reward pools higher up
// Everything is SIMULATED. No real crypto is mined, earned, or paid out.
import {
  BLOCK_RLT_BONUS,
  COINS,
  DAILY_LOGIN_RLT,
  LEAGUES,
  MAX_ROOM_LEVEL,
  MINERS,
  QUEST_BLOCKS_RLT,
  QUEST_GAMES_RLT,
  RACKS,
  ROOM_EXPAND_COST,
  STARTER_RLT,
  maxRacksForRoom,
  minerById,
  rackById,
} from "./catalog";
import type {
  BlockRewardEntry,
  CoinId,
  GameEvent,
  GameState,
  League,
  MiniGameResult,
  OwnedMiner,
  OwnedRack,
} from "./types";
import { COIN_IDS } from "./types";

/** Simulated network power (GH/s) that the player's power competes against. */
export const NETWORK_BASE_GH = 20000;

export const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
export const todayStr = (d = new Date()) => d.toISOString().slice(0, 10);
export const timeStr = (d = new Date()) =>
  d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

export function makeEvent(text: string, kind = "GAME", level: GameEvent["level"] = "INFO"): GameEvent {
  return { id: Date.now() + Math.floor(Math.random() * 1000), time: timeStr(), kind, level, text };
}

const pushEvent = (s: GameState, e: GameEvent): GameEvent[] => [e, ...s.events].slice(0, 80);

export function seedState(now = Date.now()): GameState {
  return {
    version: 1,
    rlt: STARTER_RLT,
    balances: { BTC: 0, ETH: 0, DOGE: 0, SOL: 0, BNB: 0, LTC: 0 },
    ownedMiners: [{ uid: uid(), catalogId: "pico", on: true, boughtAt: now }],
    racks: [{ uid: uid(), catalogId: "rack-4", boughtAt: now }],
    roomLevel: 1,
    allocations: { BTC: 40, ETH: 20, DOGE: 20, SOL: 10, BNB: 5, LTC: 5 },
    tempPower: [],
    blockHeight: 0,
    blockHistory: [],
    events: [makeEvent("Welcome! Starter Pico Miner installed · 300 RLT grant (simulated)", "SYSTEM", "SUCCESS")],
    stats: { blocksMined: 0, miniGamesPlayed: 0, minersBought: 1 },
    daily: {
      lastLoginDate: todayStr(),
      streak: 1,
      dailyClaimedDate: "",
      miniGamesPlayedToday: 0,
      miniGamesDate: todayStr(),
      questGamesClaimedDate: "",
      questBlocksClaimedDate: "",
    },
    blockIntervalSec: 60,
    nextBlockAt: now + 60_000,
    paused: false,
    createdAt: now,
  };
}

/* ---------- power ---------- */

export const permanentPower = (s: GameState): number =>
  s.ownedMiners
    .filter((m) => m.on)
    .reduce((sum, m) => sum + (minerById(m.catalogId)?.powerGh ?? 0), 0);

export const tempPowerNow = (s: GameState, now = Date.now()): number =>
  s.tempPower.filter((t) => t.expiresAt > now).reduce((sum, t) => sum + t.gh, 0);

export const totalPower = (s: GameState, now = Date.now()): number =>
  permanentPower(s) + tempPowerNow(s, now);

export const totalSlots = (s: GameState): number =>
  s.racks.reduce((sum, r) => sum + (rackById(r.catalogId)?.slots ?? 0), 0);

export const freeSlots = (s: GameState): number => totalSlots(s) - s.ownedMiners.length;

export function leagueFor(powerGh: number): League {
  let current = LEAGUES[0];
  for (const l of LEAGUES) if (powerGh >= l.minPowerGh) current = l;
  return current;
}

export function nextLeague(powerGh: number): League | null {
  return LEAGUES.find((l) => l.minPowerGh > powerGh) ?? null;
}

/* ---------- allocations ---------- */

/** Set one coin's % and rescale the others so the total stays 100. */
export function setAllocation(s: GameState, coin: CoinId, pct: number): GameState {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  const others = COIN_IDS.filter((c) => c !== coin);
  const otherTotal = others.reduce((sum, c) => sum + s.allocations[c], 0);
  const rest = 100 - clamped;
  const allocations = { ...s.allocations, [coin]: clamped } as GameState["allocations"];
  if (otherTotal > 0) {
    let assigned = 0;
    others.forEach((c, i) => {
      if (i === others.length - 1) allocations[c] = rest - assigned;
      else {
        allocations[c] = Math.round((s.allocations[c] / otherTotal) * rest);
        assigned += allocations[c];
      }
    });
  } else if (rest > 0) {
    const each = Math.floor(rest / others.length);
    others.forEach((c, i) => (allocations[c] = i === others.length - 1 ? rest - each * (others.length - 1) : each));
  }
  return { ...s, allocations };
}

/* ---------- blocks ---------- */

/** Rewards for one block, before they are applied. */
export function previewBlockRewards(s: GameState, now = Date.now()): { rewards: Partial<Record<CoinId, number>>; rltBonus: number; league: League; power: number } {
  const power = totalPower(s, now);
  const league = leagueFor(permanentPower(s));
  const share = power / (power + NETWORK_BASE_GH);
  const rewards: Partial<Record<CoinId, number>> = {};
  for (const coin of COIN_IDS) {
    const alloc = s.allocations[coin] / 100;
    if (alloc > 0 && power > 0) rewards[coin] = COINS[coin].blockReward * league.poolMultiplier * share * alloc;
  }
  return { rewards, rltBonus: BLOCK_RLT_BONUS * league.poolMultiplier, league, power };
}

export function applyBlock(s: GameState, now = Date.now()): GameState {
  const { rewards, rltBonus, league, power } = previewBlockRewards(s, now);
  const balances = { ...s.balances };
  for (const coin of COIN_IDS) if (rewards[coin]) balances[coin] += rewards[coin]!;
  const entry: BlockRewardEntry = {
    height: s.blockHeight + 1,
    at: now,
    league: league.name,
    totalPowerGh: power,
    rewards,
    rltBonus,
  };
  const next: GameState = {
    ...s,
    rlt: s.rlt + rltBonus,
    balances,
    blockHeight: s.blockHeight + 1,
    blockHistory: [entry, ...s.blockHistory].slice(0, 30),
    stats: { ...s.stats, blocksMined: s.stats.blocksMined + 1 },
    nextBlockAt: now + s.blockIntervalSec * 1000,
    tempPower: s.tempPower.filter((t) => t.expiresAt > now),
  };
  next.events = pushEvent(next, makeEvent(`Block #${entry.height} · ${league.name} league · +${rltBonus.toFixed(1)} RLT bonus`, "BLOCK", "SUCCESS"));
  return next;
}

/* ---------- shop ---------- */

export function buyMiner(s: GameState, catalogId: string): { state: GameState; error?: string } {
  const item = minerById(catalogId);
  if (!item) return { state: s, error: "Miner tidak dikenal." };
  if (s.rlt < item.priceRlt) return { state: s, error: `RLT tidak cukup. ${item.name} butuh ${item.priceRlt} RLT.` };
  if (freeSlots(s) <= 0) return { state: s, error: "Tidak ada slot kosong. Beli rack dulu." };
  const miner: OwnedMiner = { uid: uid(), catalogId, on: true, boughtAt: Date.now() };
  const next: GameState = {
    ...s,
    rlt: s.rlt - item.priceRlt,
    ownedMiners: [...s.ownedMiners, miner],
    stats: { ...s.stats, minersBought: s.stats.minersBought + 1 },
  };
  next.events = pushEvent(next, makeEvent(`Bought ${item.name} · -${item.priceRlt} RLT · +${item.powerGh} GH/s`, "SHOP", "SUCCESS"));
  return { state: next };
}

export function buyRack(s: GameState, catalogId: string): { state: GameState; error?: string } {
  const item = rackById(catalogId);
  if (!item) return { state: s, error: "Rack tidak dikenal." };
  if (s.racks.length >= maxRacksForRoom(s.roomLevel))
    return { state: s, error: `Room penuh. Expand room dulu (max ${maxRacksForRoom(s.roomLevel)} rack).` };
  if (s.rlt < item.priceRlt) return { state: s, error: `RLT tidak cukup. ${item.name} butuh ${item.priceRlt} RLT.` };
  const rack: OwnedRack = { uid: uid(), catalogId, boughtAt: Date.now() };
  const next: GameState = { ...s, rlt: s.rlt - item.priceRlt, racks: [...s.racks, rack] };
  next.events = pushEvent(next, makeEvent(`Bought ${item.name} · -${item.priceRlt} RLT · +${item.slots} slots`, "SHOP", "SUCCESS"));
  return { state: next };
}

export function expandRoom(s: GameState): { state: GameState; error?: string } {
  if (s.roomLevel >= MAX_ROOM_LEVEL) return { state: s, error: "Room sudah level maksimal." };
  if (s.rlt < ROOM_EXPAND_COST) return { state: s, error: `RLT tidak cukup. Expand room butuh ${ROOM_EXPAND_COST} RLT.` };
  const next: GameState = { ...s, rlt: s.rlt - ROOM_EXPAND_COST, roomLevel: s.roomLevel + 1 };
  next.events = pushEvent(next, makeEvent(`Room expanded to level ${next.roomLevel} · -${ROOM_EXPAND_COST} RLT`, "SHOP", "SUCCESS"));
  return { state: next };
}

export function toggleMiner(s: GameState, minerUid: string): GameState {
  const next: GameState = {
    ...s,
    ownedMiners: s.ownedMiners.map((m) => (m.uid === minerUid ? { ...m, on: !m.on } : m)),
  };
  const m = next.ownedMiners.find((x) => x.uid === minerUid);
  if (m) next.events = pushEvent(next, makeEvent(`${minerById(m.catalogId)?.name ?? "Miner"} ${m.on ? "started" : "stopped"}`, "ROOM", "INFO"));
  return next;
}

export function sellMiner(s: GameState, minerUid: string): { state: GameState; error?: string } {
  const m = s.ownedMiners.find((x) => x.uid === minerUid);
  if (!m) return { state: s, error: "Miner tidak ditemukan." };
  const item = minerById(m.catalogId);
  const refund = item ? Math.floor(item.priceRlt * 0.5) : 0;
  const next: GameState = {
    ...s,
    rlt: s.rlt + refund,
    ownedMiners: s.ownedMiners.filter((x) => x.uid !== minerUid),
  };
  next.events = pushEvent(next, makeEvent(`Sold ${item?.name ?? "miner"} · +${refund} RLT (50% refund)`, "SHOP", "INFO"));
  return { state: next };
}

/* ---------- mini-games & quests ---------- */

export function applyMiniGameResult(s: GameState, r: MiniGameResult, now = Date.now()): GameState {
  const temp = { id: uid(), gh: r.tempGh, expiresAt: now + r.tempMinutes * 60_000, source: r.source };
  const today = todayStr();
  const daily = s.daily.miniGamesDate === today ? s.daily : { ...s.daily, miniGamesDate: today, miniGamesPlayedToday: 0 };
  const next: GameState = {
    ...s,
    rlt: s.rlt + r.rltBonus,
    tempPower: [...s.tempPower, temp],
    stats: { ...s.stats, miniGamesPlayed: s.stats.miniGamesPlayed + 1 },
    daily: { ...daily, miniGamesPlayedToday: daily.miniGamesPlayedToday + 1 },
  };
  next.events = pushEvent(next, makeEvent(`${r.summary} · +${r.tempGh} GH/s for ${r.tempMinutes} min · +${r.rltBonus} RLT`, "MINIGAME", "SUCCESS"));
  return next;
}

export function claimDailyLogin(s: GameState): { state: GameState; error?: string } {
  const today = todayStr();
  if (s.daily.dailyClaimedDate === today) return { state: s, error: "Daily login sudah diklaim hari ini." };
  const next: GameState = { ...s, rlt: s.rlt + DAILY_LOGIN_RLT, daily: { ...s.daily, dailyClaimedDate: today } };
  next.events = pushEvent(next, makeEvent(`Daily login claimed · +${DAILY_LOGIN_RLT} RLT · streak ${s.daily.streak} day(s)`, "QUEST", "SUCCESS"));
  return { state: next };
}

export function claimQuestGames(s: GameState): { state: GameState; error?: string } {
  const today = todayStr();
  if (s.daily.questGamesClaimedDate === today) return { state: s, error: "Quest ini sudah diklaim hari ini." };
  if (s.daily.miniGamesDate !== today || s.daily.miniGamesPlayedToday < 3)
    return { state: s, error: `Main mini-game ${3 - (s.daily.miniGamesDate === today ? s.daily.miniGamesPlayedToday : 0)}x lagi hari ini untuk klaim quest.` };
  const next: GameState = { ...s, rlt: s.rlt + QUEST_GAMES_RLT, daily: { ...s.daily, questGamesClaimedDate: today } };
  next.events = pushEvent(next, makeEvent(`Quest "Play 3 mini-games" done · +${QUEST_GAMES_RLT} RLT`, "QUEST", "SUCCESS"));
  return { state: next };
}

export function claimQuestBlocks(s: GameState): { state: GameState; error?: string } {
  const today = todayStr();
  if (s.daily.questBlocksClaimedDate === today) return { state: s, error: "Quest ini sudah diklaim hari ini." };
  if (s.stats.blocksMined < 5) return { state: s, error: `Mine ${5 - s.stats.blocksMined} block lagi untuk klaim quest.` };
  const next: GameState = { ...s, rlt: s.rlt + QUEST_BLOCKS_RLT, daily: { ...s.daily, questBlocksClaimedDate: today } };
  next.events = pushEvent(next, makeEvent(`Quest "Mine 5 blocks" done · +${QUEST_BLOCKS_RLT} RLT`, "QUEST", "SUCCESS"));
  return { state: next };
}

/** Refresh the daily login streak when a new day starts. Call on load. */
export function refreshDaily(s: GameState, now = new Date()): GameState {
  const today = todayStr(now);
  if (s.daily.lastLoginDate === today) return s;
  const yesterday = todayStr(new Date(now.getTime() - 86_400_000));
  const streak = s.daily.lastLoginDate === yesterday ? s.daily.streak + 1 : 1;
  return { ...s, daily: { ...s.daily, lastLoginDate: today, streak, miniGamesPlayedToday: 0, miniGamesDate: today } };
}

export { MINERS, RACKS };
