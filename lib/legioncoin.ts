export const SAVE_KEY = "legioncoin-save-v1";
export const MAX_OFFLINE_SECONDS = 24 * 60 * 60;
export const TEMP_POWER_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export const MINERS = [
  { id: "starter-cat", name: "Pawioneer Mk.I", label: "Rig pemula", power: 24, price: 0, description: "Rig mungil untuk mulai menggali hadiah virtual." },
  { id: "lynx-lite", name: "Lynx Lite", label: "Miner hemat", power: 22, price: 90, description: "Tambahan power stabil untuk markas kecil." },
  { id: "purr-drive", name: "PurrDrive 4K", label: "Miner modular", power: 58, price: 260, description: "Modul modular dengan pendingin kumis." },
  { id: "meow-core", name: "MeowCore X", label: "Core berdaya tinggi", power: 145, price: 690, description: "Core kuat untuk bersaing di liga lebih tinggi." },
  { id: "lionheart-rack", name: "Lionheart Rack", label: "Rak legendaris", power: 330, price: 1680, description: "Satu rak besar untuk para penjelajah berpengalaman." },
] as const;

export const LEAGUES = [
  { id: "bronze", name: "Perunggu", minPower: 0, dailyPool: 300, rivalPower: 92, color: "bronze" },
  { id: "silver", name: "Perak", minPower: 65, dailyPool: 520, rivalPower: 190, color: "silver" },
  { id: "gold", name: "Emas", minPower: 155, dailyPool: 900, rivalPower: 360, color: "gold" },
  { id: "platinum", name: "Platinum", minPower: 360, dailyPool: 1500, rivalPower: 760, color: "platinum" },
  { id: "diamond", name: "Berlian", minPower: 760, dailyPool: 2500, rivalPower: 1500, color: "diamond" },
  { id: "legend", name: "Legendaris", minPower: 1600, dailyPool: 4300, rivalPower: 3000, color: "legend" },
] as const;

export type Activity = {
  id: string;
  at: number;
  title: string;
  detail: string;
  amount?: number;
  kind: "reward" | "purchase" | "upgrade" | "boost";
};

export type GameSave = {
  version: 1;
  playerName: string;
  balance: number;
  xp: number;
  minerLevels: Record<string, number>;
  temporaryPower: number;
  temporaryPowerExpiresAt: number;
  lastSeenAt: number;
  activity: Activity[];
};

export function createInitialSave(now = Date.now()): GameSave {
  return {
    version: 1,
    playerName: "Penjelajah Paw",
    balance: 120,
    xp: 0,
    minerLevels: { "starter-cat": 1 },
    temporaryPower: 0,
    temporaryPowerExpiresAt: 0,
    lastSeenAt: now,
    activity: [{ id: `welcome-${now}`, at: now, title: "Markas dibuka", detail: "Pawioneer Mk.I siap menambang hadiah virtual.", kind: "reward" }],
  };
}

export function normalizeSave(value: unknown, now = Date.now()): GameSave {
  const initial = createInitialSave(now);
  if (!value || typeof value !== "object") return initial;
  const data = value as Partial<GameSave>;
  if (data.version !== 1 || !data.minerLevels || typeof data.minerLevels !== "object") return initial;
  const minerLevels: Record<string, number> = {};
  for (const miner of MINERS) {
    const level = Number(data.minerLevels[miner.id] || 0);
    if (Number.isFinite(level) && level > 0) minerLevels[miner.id] = Math.min(99, Math.floor(level));
  }
  if (!minerLevels["starter-cat"]) minerLevels["starter-cat"] = 1;
  const activity = Array.isArray(data.activity)
    ? data.activity.filter((item): item is Activity => Boolean(item && typeof item === "object" && typeof item.title === "string" && typeof item.detail === "string" && typeof item.at === "number" && ["reward", "purchase", "upgrade", "boost"].includes((item as Activity).kind))).slice(0, 10)
    : initial.activity;
  return {
    version: 1,
    playerName: typeof data.playerName === "string" ? data.playerName.slice(0, 24) : initial.playerName,
    balance: Number.isFinite(Number(data.balance)) ? Math.max(0, Number(data.balance)) : initial.balance,
    xp: Number.isFinite(Number(data.xp)) ? Math.max(0, Number(data.xp)) : 0,
    minerLevels,
    temporaryPower: Number.isFinite(Number(data.temporaryPower)) ? Math.max(0, Number(data.temporaryPower)) : 0,
    temporaryPowerExpiresAt: Number.isFinite(Number(data.temporaryPowerExpiresAt)) ? Number(data.temporaryPowerExpiresAt) : 0,
    lastSeenAt: Number.isFinite(Number(data.lastSeenAt)) ? Number(data.lastSeenAt) : now,
    activity,
  };
}

export function getPermanentPower(save: GameSave): number {
  return MINERS.reduce((sum, miner) => {
    const level = save.minerLevels[miner.id] || 0;
    return sum + miner.power * level;
  }, 0);
}

export function getActiveTemporaryPower(save: GameSave, now = Date.now()): number {
  return save.temporaryPowerExpiresAt > now ? save.temporaryPower : 0;
}

export function getLeague(power: number) {
  let index = 0;
  for (let i = 0; i < LEAGUES.length; i += 1) if (power >= LEAGUES[i].minPower) index = i;
  return { league: LEAGUES[index], index, next: LEAGUES[index + 1] };
}

export function getHourlyReward(power: number, leagueIndex: number): number {
  const league = LEAGUES[Math.max(0, Math.min(leagueIndex, LEAGUES.length - 1))];
  const share = power <= 0 ? 0 : power / (power + league.rivalPower);
  return (league.dailyPool / 24) * share;
}

export function getPlayerShare(power: number, leagueIndex: number): number {
  const league = LEAGUES[Math.max(0, Math.min(leagueIndex, LEAGUES.length - 1))];
  return power <= 0 ? 0 : power / (power + league.rivalPower);
}

function addActivity(save: GameSave, entry: Omit<Activity, "id" | "at">, now: number) {
  save.activity = [{ ...entry, id: `${now}-${Math.random().toString(36).slice(2, 7)}`, at: now }, ...save.activity].slice(0, 10);
}

export function settleOffline(save: GameSave, now = Date.now()) {
  const next: GameSave = { ...save, minerLevels: { ...save.minerLevels }, activity: [...save.activity] };
  const elapsed = Math.max(0, Math.min(MAX_OFFLINE_SECONDS, (now - save.lastSeenAt) / 1000));
  if (elapsed > 0) {
    const { index } = getLeague(getPermanentPower(save));
    const boostSeconds = save.temporaryPowerExpiresAt > save.lastSeenAt
      ? Math.max(0, Math.min(elapsed, (save.temporaryPowerExpiresAt - save.lastSeenAt) / 1000))
      : 0;
    const normalSeconds = elapsed - boostSeconds;
    const permanentPower = getPermanentPower(save);
    const boostedRate = getHourlyReward(permanentPower + save.temporaryPower, index);
    const normalRate = getHourlyReward(permanentPower, index);
    const reward = (boostedRate * boostSeconds + normalRate * normalSeconds) / 3600;
    if (reward > 0) {
      next.balance = Math.round((next.balance + reward) * 1_000_000) / 1_000_000;
      next.xp += Math.floor(reward * 4);
    }
  }
  next.lastSeenAt = now;
  if (next.temporaryPowerExpiresAt <= now) next.temporaryPower = 0;
  return next;
}

export function getUpgradeCost(minerId: string, currentLevel: number) {
  const miner = MINERS.find((item) => item.id === minerId);
  if (!miner) return 0;
  return Math.max(45, Math.round(miner.price * (0.72 + currentLevel * 0.62)));
}

export function buyOrUpgradeMiner(save: GameSave, minerId: string, now = Date.now()): GameSave {
  const next = settleOffline(save, now);
  const miner = MINERS.find((item) => item.id === minerId);
  if (!miner) throw new Error("Miner tidak ditemukan.");
  const currentLevel = next.minerLevels[minerId] || 0;
  const price = currentLevel > 0 ? getUpgradeCost(minerId, currentLevel) : miner.price;
  if (next.balance < price) throw new Error("Saldo LegionCoin belum cukup.");
  next.balance = round2(next.balance - price);
  next.minerLevels[minerId] = currentLevel + 1;
  next.xp += Math.max(10, Math.floor(price / 2));
  addActivity(next, {
    title: currentLevel > 0 ? `${miner.name} ditingkatkan` : `${miner.name} dibeli`,
    detail: `Power permanen +${miner.power} TH/s · ${price.toLocaleString("id-ID")} LC`,
    amount: -price,
    kind: currentLevel > 0 ? "upgrade" : "purchase",
  }, now);
  return next;
}

export function addTemporaryPower(save: GameSave, score: number, now = Date.now()): GameSave {
  const next = settleOffline(save, now);
  const cleanScore = Math.max(0, Math.min(100, Math.floor(score)));
  const gained = Math.max(8, Math.round(8 + cleanScore * 2.4));
  const activePower = next.temporaryPowerExpiresAt > now ? next.temporaryPower : 0;
  next.temporaryPower = activePower + gained;
  next.temporaryPowerExpiresAt = Math.max(now, next.temporaryPowerExpiresAt) + TEMP_POWER_DURATION_MS;
  next.xp += cleanScore * 3;
  addActivity(next, {
    title: "Paw Rush selesai",
    detail: `Power sementara +${gained} TH/s · aktif 7 hari`,
    amount: gained,
    kind: "boost",
  }, now);
  return next;
}

export function round2(value: number) {
  return Math.round(value * 100) / 100;
}
