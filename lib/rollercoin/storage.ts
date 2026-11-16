// localStorage persistence for the RollerCoin-like game.
// Migrates the old "bmmc-state" dashboard state (if present) into a fresh
// RollerCoin-like state: the old SIM balance becomes a one-off RLT grant.
import { refreshDaily, seedState } from "./engine";
import type { GameState } from "./types";

export const STORAGE_KEY = "rollercoin-state-v1";
const LEGACY_KEY = "bmmc-state";

export function loadState(): GameState {
  if (typeof window === "undefined") return seedState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GameState;
      if (parsed && parsed.version === 1 && Array.isArray(parsed.ownedMiners)) {
        return refreshDaily(parsed);
      }
    }
    // One-off migration from the old dashboard state.
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const old = JSON.parse(legacy) as { balance?: number };
      const fresh = seedState();
      const grant = Math.max(0, Math.min(500, Math.floor(old?.balance ?? 0)));
      fresh.rlt += grant;
      fresh.events = [
        {
          id: Date.now(),
          time: new Date().toLocaleTimeString("en-GB"),
          kind: "SYSTEM",
          level: "SUCCESS",
          text: `Migrated from old dashboard state · +${grant} RLT grant (simulated)`,
        },
        ...fresh.events,
      ];
      return fresh;
    }
  } catch {
    // Corrupt save — fall through to a fresh state.
  }
  return seedState();
}

export function saveState(s: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // Storage full / unavailable — game keeps running in memory.
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
