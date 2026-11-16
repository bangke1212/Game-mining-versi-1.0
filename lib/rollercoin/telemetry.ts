// Live rig telemetry — pure, deterministic functions. No Math.random() here:
// every value is a smooth function of (miner uid, now), so the same `now`
// always gives the same reading and a re-render never flickers.
// All values are SIMULATED. No real hardware is measured.
import { minerById } from "./catalog";
import { NETWORK_BASE_GH, permanentPower, tempPowerNow } from "./engine";
import type { GameState, OwnedMiner, Rarity } from "./types";

/** Watts per GH/s, by rarity. Documented estimate used consistently everywhere. */
export const WATTS_PER_GH: Record<Rarity, number> = {
  Common: 2.2,
  Rare: 1.8,
  Epic: 1.5,
  Legendary: 1.2,
};

/** Small deterministic hash of a string, used as a per-miner phase. */
export function hashUid(uid: string): number {
  let h = 0;
  for (let i = 0; i < uid.length; i++) h = (h * 31 + uid.charCodeAt(i)) >>> 0;
  return h;
}

export type TempTone = "mint" | "amber" | "coral";
export const tempTone = (celsius: number): TempTone => (celsius < 60 ? "mint" : celsius <= 68 ? "amber" : "coral");

export type MinerTelemetry = {
  uid: string;
  name: string;
  rarity: Rarity;
  on: boolean;
  /** Base catalog power (GH/s). */
  baseGh: number;
  /** Live power right now (GH/s): 0 when off, base ±3% when on. */
  liveGh: number;
  tempC: number;
  tempTone: TempTone;
  fanRpm: number;
  watts: number;
  /** Uptime in ms since boughtAt (0 when off — uptime counts while owned). */
  uptimeMs: number;
  boughtAt: number;
};

export function minerTelemetry(m: OwnedMiner, now: number): MinerTelemetry | null {
  const item = minerById(m.catalogId);
  if (!item) return null;
  const phase = (hashUid(m.uid) % 360) * (Math.PI / 180);
  // Two slow sines: smooth ±3% wobble, never a random jump.
  const wobble = 0.02 * Math.sin(now / 4000 + phase) + 0.01 * Math.sin(now / 1731 + phase * 2);
  const liveGh = m.on ? Math.max(0, item.powerGh * (1 + wobble)) : 0;
  const heatBase = 48 + Math.min(24, item.powerGh * 0.02);
  const tempC = m.on
    ? Math.min(78, Math.max(30, heatBase + 2 * Math.sin(now / 9000 + phase)))
    : 32 + Math.sin(now / 12000 + phase);
  const fanRpm = m.on ? Math.round(1200 + item.powerGh * 1.2 + 120 * Math.sin(now / 5000 + phase)) : 0;
  const watts = Math.round(liveGh * WATTS_PER_GH[item.rarity]);
  return {
    uid: m.uid,
    name: item.name,
    rarity: item.rarity,
    on: m.on,
    baseGh: item.powerGh,
    liveGh,
    tempC: Math.round(tempC * 10) / 10,
    tempTone: tempTone(tempC),
    fanRpm: Math.max(0, fanRpm),
    watts,
    uptimeMs: Math.max(0, now - m.boughtAt),
    boughtAt: m.boughtAt,
  };
}

export type RigTelemetry = {
  miners: MinerTelemetry[];
  onlineCount: number;
  totalCount: number;
  /** Live total power (permanent live + temporary boosts still active). */
  liveTotalGh: number;
  permanentLiveGh: number;
  tempLiveGh: number;
  avgTempC: number | null;
  avgTempTone: TempTone;
  totalWatts: number;
  /** GH/s per watt across all running miners (0 when nothing runs). */
  efficiencyGhPerW: number;
  /** Player share of the simulated network, 0–1. */
  networkShare: number;
  blockProgress: number; // 0–1
  secondsToBlock: number;
};

export function computeTelemetry(s: GameState, now: number): RigTelemetry {
  const miners = s.ownedMiners.map((m) => minerTelemetry(m, now)).filter((t): t is MinerTelemetry => t !== null);
  const online = miners.filter((m) => m.on);
  const permanentLiveGh = miners.reduce((sum, m) => sum + m.liveGh, 0);
  const tempLiveGh = tempPowerNow(s, now);
  const liveTotalGh = permanentLiveGh + tempLiveGh;
  const avgTempC = online.length > 0 ? online.reduce((sum, m) => sum + m.tempC, 0) / online.length : null;
  const totalWatts = miners.reduce((sum, m) => sum + m.watts, 0);
  const secondsToBlock = Math.max(0, Math.ceil((s.nextBlockAt - now) / 1000));
  const blockProgress =
    s.blockIntervalSec > 0 ? Math.min(1, Math.max(0, 1 - secondsToBlock / s.blockIntervalSec)) : 0;
  return {
    miners,
    onlineCount: online.length,
    totalCount: miners.length,
    liveTotalGh,
    permanentLiveGh,
    tempLiveGh,
    avgTempC: avgTempC === null ? null : Math.round(avgTempC * 10) / 10,
    avgTempTone: avgTempC === null ? "mint" : tempTone(avgTempC),
    totalWatts,
    efficiencyGhPerW: totalWatts > 0 ? liveTotalGh / totalWatts : 0,
    networkShare: liveTotalGh / (liveTotalGh + NETWORK_BASE_GH),
    blockProgress,
    secondsToBlock,
  };
}

/** Miners to visualise in the 3D room: first 4 owned, in purchase order. */
export type SceneMiner = { name: string; powerGh: number; on: boolean; accent: string };
const ACCENTS = ["#8cffd1", "#b69cff", "#ffc46b", "#79b9ff"];
export function sceneMiners(s: GameState): { shown: SceneMiner[]; extra: number } {
  const shown = s.ownedMiners.slice(0, 4).map((m, i) => {
    const item = minerById(m.catalogId);
    return { name: item?.name ?? "Miner", powerGh: item?.powerGh ?? 0, on: m.on, accent: ACCENTS[i % ACCENTS.length] };
  });
  return { shown, extra: Math.max(0, s.ownedMiners.length - shown.length) };
}

/* ---------- formatting (fixed-width, no layout shift) ---------- */

export const fmtLiveGh = (n: number) => `${n.toLocaleString("en-US", { maximumFractionDigits: 1 })} GH/s`;
export const fmtTemp = (c: number) => `${c.toFixed(1)}°C`;
export const fmtWatts = (w: number) => `${Math.round(w).toLocaleString("en-US")} W`;
export const fmtClock = (totalSeconds: number) => {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
export const fmtTimeOfDay = (now: number) =>
  new Date(now).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
/** Uptime: "42s", "13m 04s", "2h 15m". */
export function fmtUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${String(s % 60).padStart(2, "0")}s`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
}

export { permanentPower };
