export const SAVE_KEY = "legioncoin-save-v1";
export const MAX_OFFLINE_SECONDS = 24 * 60 * 60;
export const TEMP_POWER_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
export const MAX_ARCADE_REWARD_PER_DAY = 40;
export const MAX_ITEM_LEVEL = 99;
export const MIN_PAW_RUSH_BOOST_SCORE = 5;
export const STARTER_ROOM_SLOTS = 6;
export type ArcadeMode = "paw-rush" | "coin-catch" | "memory-mine";

export const AVATAR_COATS = [
  { id: "ginger", label: "Jingga Klasik", swatch: "#e99c55", filter: "none" },
  { id: "mint", label: "Mint Nebula", swatch: "#6fc5a4", filter: "hue-rotate(112deg) saturate(1.05)" },
  { id: "violet", label: "Ungu Kosmik", swatch: "#a984d4", filter: "hue-rotate(238deg) saturate(1.15)" },
  { id: "rose", label: "Merah Muda", swatch: "#e48ca0", filter: "hue-rotate(302deg) saturate(1.08)" },
  { id: "moon", label: "Bulan Es", swatch: "#85b8d8", filter: "hue-rotate(178deg) saturate(.82) brightness(1.08)" },
] as const;

export const AVATAR_ACCESSORIES = [
  { id: "none", label: "Tanpa aksesori", symbol: "" },
  { id: "goggles", label: "Kacamata neon", symbol: "🕶️" },
  { id: "crown", label: "Mahkota paw", symbol: "👑" },
  { id: "bow", label: "Pita bintang", symbol: "🎀" },
  { id: "star", label: "Lencana bintang", symbol: "⭐" },
] as const;

export type AvatarCoatId = typeof AVATAR_COATS[number]["id"];
export type AvatarAccessoryId = typeof AVATAR_ACCESSORIES[number]["id"];
export type AvatarCustomization = { coat: AvatarCoatId; accessory: AvatarAccessoryId };
export const DEFAULT_AVATAR: AvatarCustomization = { coat: "ginger", accessory: "none" };

export function getArcadeRewardEstimate(mode: ArcadeMode, score: number) {
  const cleanScore = Math.max(0, Math.floor(score));
  if (mode === "paw-rush") return round2(Math.min(10, cleanScore * 0.25));
  if (mode === "coin-catch") return round2(Math.min(12, cleanScore * 0.4));
  return round2(Math.min(6, cleanScore * 1.5));
}

export const MINERS = [
  { id: "starter-cat", name: "Pawioneer Mk.I", label: "Rig pemula", power: 24, price: 0, description: "Rig mungil untuk mulai menggali hadiah virtual." },
  { id: "lynx-lite", name: "Lynx Lite", label: "Miner hemat", power: 22, price: 90, description: "Tambahan power stabil untuk markas kecil." },
  { id: "purr-drive", name: "PurrDrive 4K", label: "Miner modular", power: 58, price: 260, description: "Modul modular dengan pendingin kumis." },
  { id: "meow-core", name: "MeowCore X", label: "Core berdaya tinggi", power: 145, price: 690, description: "Core kuat untuk bersaing di liga lebih tinggi." },
  { id: "lionheart-rack", name: "Lionheart Rack", label: "Rig legendaris", power: 330, price: 1680, description: "Satu rig besar untuk para penjelajah berpengalaman." },
] as const;

export const SERVER_RACKS = [
  { id: "purrstack-mini", name: "PurrStack Mini", label: "Rak server pemula", power: 90, slots: 3, price: 460, description: "Rak 2U untuk tiga rig, dirakit Kapten Paw untuk markas baru." },
  { id: "whisker-tower", name: "Whisker Tower", label: "Rak modular", power: 260, slots: 5, price: 1380, description: "Menara berpendingin senyap dengan lima slot rig tambahan." },
  { id: "meow-cluster", name: "Meow Cluster 9", label: "Klaster endgame", power: 720, slots: 8, price: 3950, description: "Klaster server kucing dengan delapan slot untuk liga puncak." },
] as const;

export type MinerUnit = { id: string; minerId: string; level: number; placed: boolean };
export type RackUnit = { id: string; rackId: string; level: number; placed: boolean };

export type Activity = {
  id: string;
  at: number;
  title: string;
  detail: string;
  amount?: number;
  kind: "reward" | "purchase" | "upgrade" | "boost" | "arcade";
};

export type GameSave = {
  version: 4;
  playerName: string;
  balance: number;
  xp: number;
  avatar: AvatarCustomization;
  minerUnits: MinerUnit[];
  rackUnits: RackUnit[];
  temporaryPower: number;
  temporaryPowerExpiresAt: number;
  lastSeenAt: number;
  activity: Activity[];
  arcadeRewardDay: string;
  arcadeCoinsToday: number;
};

export function getUtcDayKey(now = Date.now()) {
  return new Date(now).toISOString().slice(0, 10);
}

export function createInitialSave(now = Date.now()): GameSave {
  return {
    version: 4,
    playerName: "Penjelajah Paw",
    balance: 120,
    xp: 0,
    avatar: { ...DEFAULT_AVATAR },
    minerUnits: [{ id: "starter-cat-initial", minerId: "starter-cat", level: 1, placed: true }],
    rackUnits: [],
    temporaryPower: 0,
    temporaryPowerExpiresAt: 0,
    lastSeenAt: now,
    activity: [{ id: `welcome-${now}`, at: now, title: "Markas dibuka", detail: "Pawioneer Mk.I siap menambang hadiah virtual.", kind: "reward" }],
    arcadeRewardDay: getUtcDayKey(now),
    arcadeCoinsToday: 0,
  };
}

function recordOf(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function safeUnitId(raw: unknown, fallback: string, used: Set<string>) {
  const candidate = typeof raw === "string" && /^[a-zA-Z0-9_-]{1,96}$/.test(raw) ? raw : fallback;
  let id = candidate;
  let suffix = 2;
  while (used.has(id)) id = `${fallback}-${suffix++}`;
  used.add(id);
  return id;
}

function normalizeMinerUnits(value: unknown): MinerUnit[] {
  if (!Array.isArray(value)) return [];
  const used = new Set<string>();
  return value.flatMap((entry, index) => {
    const raw = recordOf(entry);
    const miner = MINERS.find((item) => item.id === raw?.minerId);
    if (!raw || !miner) return [];
    const parsedLevel = Number(raw.level);
    const level = Number.isFinite(parsedLevel) ? Math.max(1, Math.min(MAX_ITEM_LEVEL, Math.floor(parsedLevel))) : 1;
    const fallback = `miner-${miner.id}-${index + 1}`;
    return [{ id: safeUnitId(raw.id, fallback, used), minerId: miner.id, level, placed: raw.placed === true }];
  });
}

function normalizeRackUnits(value: unknown): RackUnit[] {
  if (!Array.isArray(value)) return [];
  const used = new Set<string>();
  return value.flatMap((entry, index) => {
    const raw = recordOf(entry);
    const rack = SERVER_RACKS.find((item) => item.id === raw?.rackId);
    if (!raw || !rack) return [];
    const parsedLevel = Number(raw.level);
    const level = Number.isFinite(parsedLevel) ? Math.max(1, Math.min(MAX_ITEM_LEVEL, Math.floor(parsedLevel))) : 1;
    const fallback = `rack-${rack.id}-${index + 1}`;
    return [{ id: safeUnitId(raw.id, fallback, used), rackId: rack.id, level, placed: raw.placed === true }];
  });
}

function migrateLegacyMinerUnits(levels: unknown): MinerUnit[] {
  const legacy = recordOf(levels);
  if (!legacy) return [];
  return MINERS.flatMap((miner) => {
    const parsedLevel = Number(legacy[miner.id] || 0);
    if (!Number.isFinite(parsedLevel) || parsedLevel <= 0) return [];
    return [{ id: `legacy-miner-${miner.id}`, minerId: miner.id, level: Math.max(1, Math.min(MAX_ITEM_LEVEL, Math.floor(parsedLevel))), placed: true }];
  });
}

function migrateLegacyRackUnits(levels: unknown): RackUnit[] {
  const legacy = recordOf(levels);
  if (!legacy) return [];
  return SERVER_RACKS.flatMap((rack) => {
    const parsedLevel = Number(legacy[rack.id] || 0);
    if (!Number.isFinite(parsedLevel) || parsedLevel <= 0) return [];
    return [{ id: `legacy-rack-${rack.id}`, rackId: rack.id, level: Math.max(1, Math.min(MAX_ITEM_LEVEL, Math.floor(parsedLevel))), placed: true }];
  });
}

export function normalizeSave(value: unknown, now = Date.now()): GameSave {
  const initial = createInitialSave(now);
  const data = recordOf(value);
  if (!data) return initial;
  const version = Number(data.version);
  if (![1, 2, 3, 4].includes(version)) return initial;

  let minerUnits = version === 4 && Array.isArray(data.minerUnits)
    ? normalizeMinerUnits(data.minerUnits)
    : migrateLegacyMinerUnits(data.minerLevels);
  let rackUnits = version === 4 && Array.isArray(data.rackUnits)
    ? normalizeRackUnits(data.rackUnits)
    : migrateLegacyRackUnits(data.rackLevels);
  if (!minerUnits.some((unit) => unit.minerId === "starter-cat")) {
    minerUnits = [{ id: "starter-cat-recovered", minerId: "starter-cat", level: 1, placed: true }, ...minerUnits];
  }
  const roomCapacity = STARTER_ROOM_SLOTS + rackUnits.reduce((slots, unit) => {
    if (!unit.placed) return slots;
    return slots + (SERVER_RACKS.find((item) => item.id === unit.rackId)?.slots || 0);
  }, 0);
  let occupiedSlots = 0;
  minerUnits = [...minerUnits]
    .sort((a, b) => Number(b.minerId === "starter-cat") - Number(a.minerId === "starter-cat"))
    .map((unit) => {
      if (!unit.placed) return unit;
      if (occupiedSlots < roomCapacity) {
        occupiedSlots += 1;
        return unit;
      }
      return { ...unit, placed: false };
    });

  const activity = Array.isArray(data.activity)
    ? data.activity.filter((item): item is Activity => Boolean(item && typeof item === "object" && typeof (item as Activity).title === "string" && typeof (item as Activity).detail === "string" && typeof (item as Activity).at === "number" && ["reward", "purchase", "upgrade", "boost", "arcade"].includes((item as Activity).kind))).slice(0, 10)
    : initial.activity;
  const today = getUtcDayKey(now);
  const arcadeRewardDay = typeof data.arcadeRewardDay === "string" ? data.arcadeRewardDay : today;
  const arcadeCoinsToday = arcadeRewardDay === today && Number.isFinite(Number(data.arcadeCoinsToday))
    ? Math.max(0, Math.min(MAX_ARCADE_REWARD_PER_DAY, Number(data.arcadeCoinsToday)))
    : 0;
  const avatar = recordOf(data.avatar);
  const coat = AVATAR_COATS.find((option) => option.id === avatar?.coat)?.id || DEFAULT_AVATAR.coat;
  const accessory = AVATAR_ACCESSORIES.find((option) => option.id === avatar?.accessory)?.id || DEFAULT_AVATAR.accessory;

  return {
    version: 4,
    playerName: typeof data.playerName === "string" ? data.playerName.slice(0, 24) : initial.playerName,
    balance: Number.isFinite(Number(data.balance)) ? Math.max(0, Number(data.balance)) : initial.balance,
    xp: Number.isFinite(Number(data.xp)) ? Math.max(0, Number(data.xp)) : 0,
    avatar: { coat, accessory },
    minerUnits,
    rackUnits,
    temporaryPower: Number.isFinite(Number(data.temporaryPower)) ? Math.max(0, Number(data.temporaryPower)) : 0,
    temporaryPowerExpiresAt: Number.isFinite(Number(data.temporaryPowerExpiresAt)) ? Number(data.temporaryPowerExpiresAt) : 0,
    lastSeenAt: Number.isFinite(Number(data.lastSeenAt)) ? Number(data.lastSeenAt) : now,
    activity,
    arcadeRewardDay,
    arcadeCoinsToday,
  };
}

export function getRoomSlotCapacity(save: GameSave): number {
  return STARTER_ROOM_SLOTS + save.rackUnits.reduce((slots, unit) => {
    if (!unit.placed) return slots;
    const rack = SERVER_RACKS.find((item) => item.id === unit.rackId);
    return slots + (rack?.slots || 0);
  }, 0);
}

export function getPermanentPower(save: GameSave): number {
  const minerPower = save.minerUnits.reduce((sum, unit) => {
    if (!unit.placed) return sum;
    const miner = MINERS.find((item) => item.id === unit.minerId);
    return sum + (miner?.power || 0) * unit.level;
  }, 0);
  const rackPower = save.rackUnits.reduce((sum, unit) => {
    if (!unit.placed) return sum;
    const rack = SERVER_RACKS.find((item) => item.id === unit.rackId);
    return sum + (rack?.power || 0) * unit.level;
  }, 0);
  return minerPower + rackPower;
}

export function getActiveTemporaryPower(save: GameSave, now = Date.now()): number {
  return save.temporaryPowerExpiresAt > now ? save.temporaryPower : 0;
}

export function getLeague(power: number) {
  let index = 0;
  for (let i = 0; i < LEAGUES.length; i += 1) if (power >= LEAGUES[i].minPower) index = i;
  return { league: LEAGUES[index], index, next: LEAGUES[index + 1] };
}

export const LEAGUES = [
  { id: "bronze", name: "Perunggu", minPower: 0, dailyPool: 300, rivalPower: 92, color: "bronze" },
  { id: "silver", name: "Perak", minPower: 65, dailyPool: 520, rivalPower: 190, color: "silver" },
  { id: "gold", name: "Emas", minPower: 155, dailyPool: 900, rivalPower: 360, color: "gold" },
  { id: "platinum", name: "Platinum", minPower: 360, dailyPool: 1500, rivalPower: 760, color: "platinum" },
  { id: "diamond", name: "Berlian", minPower: 760, dailyPool: 2500, rivalPower: 1500, color: "diamond" },
  { id: "legend", name: "Legendaris", minPower: 1600, dailyPool: 4300, rivalPower: 3000, color: "legend" },
] as const;

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
  const next: GameSave = {
    ...save,
    avatar: { ...save.avatar },
    minerUnits: save.minerUnits.map((unit) => ({ ...unit })),
    rackUnits: save.rackUnits.map((unit) => ({ ...unit })),
    activity: [...save.activity],
  };
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

export function getUpgradeCost(itemId: string, currentLevel: number) {
  const item = [...MINERS, ...SERVER_RACKS].find((candidate) => candidate.id === itemId);
  if (!item) return 0;
  const upgradeBasePrice = item.price > 0 ? item.price : 45;
  return Math.max(45, Math.round(upgradeBasePrice * (0.72 + currentLevel * 0.62)));
}

function makeUnitId(kind: "miner" | "rack", catalogId: string, now: number, existing: Set<string>) {
  let id = `${kind}-${catalogId}-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  while (existing.has(id)) id = `${kind}-${catalogId}-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return id;
}

export function purchaseMinerUnit(save: GameSave, minerId: string, now = Date.now()): GameSave {
  const next = settleOffline(save, now);
  const miner = MINERS.find((item) => item.id === minerId);
  if (!miner) throw new Error("Miner tidak ditemukan.");
  if (next.balance < miner.price) throw new Error("Saldo LegionCoin belum cukup.");
  const existing = new Set(next.minerUnits.map((unit) => unit.id));
  const unit: MinerUnit = { id: makeUnitId("miner", minerId, now, existing), minerId, level: 1, placed: false };
  next.balance = round2(next.balance - miner.price);
  next.minerUnits.push(unit);
  next.xp += Math.max(10, Math.floor(miner.price / 2));
  addActivity(next, {
    title: `${miner.name} ditambahkan ke inventori`,
    detail: `Unit baru · power +${miner.power} TH/s setelah dipasang · ${miner.price.toLocaleString("id-ID")} LC`,
    amount: -miner.price,
    kind: "purchase",
  }, now);
  return next;
}

export function upgradeMinerUnit(save: GameSave, unitId: string, now = Date.now()): GameSave {
  const next = settleOffline(save, now);
  const index = next.minerUnits.findIndex((unit) => unit.id === unitId);
  if (index < 0) throw new Error("Unit miner tidak ditemukan di inventori.");
  const unit = next.minerUnits[index];
  const miner = MINERS.find((item) => item.id === unit.minerId);
  if (!miner) throw new Error("Tipe miner tidak ditemukan.");
  if (unit.level >= MAX_ITEM_LEVEL) throw new Error(`${miner.name} sudah mencapai level maksimum ${MAX_ITEM_LEVEL}.`);
  const price = getUpgradeCost(miner.id, unit.level);
  if (next.balance < price) throw new Error("Saldo LegionCoin belum cukup.");
  next.balance = round2(next.balance - price);
  next.minerUnits[index] = { ...unit, level: unit.level + 1 };
  next.xp += Math.max(10, Math.floor(price / 2));
  addActivity(next, {
    title: `${miner.name} ditingkatkan`,
    detail: `Unit LV.${unit.level} → LV.${unit.level + 1} · power +${miner.power} TH/s · ${price.toLocaleString("id-ID")} LC`,
    amount: -price,
    kind: "upgrade",
  }, now);
  return next;
}

export function setMinerUnitPlaced(save: GameSave, unitId: string, placed: boolean, now = Date.now()): GameSave {
  const next = settleOffline(save, now);
  const index = next.minerUnits.findIndex((unit) => unit.id === unitId);
  if (index < 0) throw new Error("Unit miner tidak ditemukan di inventori.");
  const unit = next.minerUnits[index];
  if (unit.placed === placed) return next;
  if (placed) {
    const installedCount = next.minerUnits.filter((item) => item.placed).length;
    if (installedCount >= getRoomSlotCapacity(next)) throw new Error("Slot ruang penuh. Pasang rak server tambahan dari inventori atau Pasar.");
  }
  next.minerUnits[index] = { ...unit, placed };
  return next;
}

export function purchaseRackUnit(save: GameSave, rackId: string, now = Date.now()): GameSave {
  const next = settleOffline(save, now);
  const rack = SERVER_RACKS.find((item) => item.id === rackId);
  if (!rack) throw new Error("Rak server tidak ditemukan.");
  if (next.balance < rack.price) throw new Error("Saldo LegionCoin belum cukup untuk rak server.");
  const existing = new Set(next.rackUnits.map((unit) => unit.id));
  const unit: RackUnit = { id: makeUnitId("rack", rackId, now, existing), rackId, level: 1, placed: false };
  next.balance = round2(next.balance - rack.price);
  next.rackUnits.push(unit);
  next.xp += Math.max(15, Math.floor(rack.price / 2));
  addActivity(next, {
    title: `${rack.name} ditambahkan ke inventori`,
    detail: `Rak virtual · ${rack.slots} slot dan +${rack.power} TH/s setelah dipasang · ${rack.price.toLocaleString("id-ID")} LC`,
    amount: -rack.price,
    kind: "purchase",
  }, now);
  return next;
}

export function upgradeRackUnit(save: GameSave, unitId: string, now = Date.now()): GameSave {
  const next = settleOffline(save, now);
  const index = next.rackUnits.findIndex((unit) => unit.id === unitId);
  if (index < 0) throw new Error("Unit rak tidak ditemukan di inventori.");
  const unit = next.rackUnits[index];
  const rack = SERVER_RACKS.find((item) => item.id === unit.rackId);
  if (!rack) throw new Error("Tipe rak tidak ditemukan.");
  if (unit.level >= MAX_ITEM_LEVEL) throw new Error(`${rack.name} sudah mencapai level maksimum ${MAX_ITEM_LEVEL}.`);
  const price = getUpgradeCost(rack.id, unit.level);
  if (next.balance < price) throw new Error("Saldo LegionCoin belum cukup untuk upgrade rak.");
  next.balance = round2(next.balance - price);
  next.rackUnits[index] = { ...unit, level: unit.level + 1 };
  next.xp += Math.max(15, Math.floor(price / 2));
  addActivity(next, {
    title: `${rack.name} di-upgrade`,
    detail: `Rak LV.${unit.level} → LV.${unit.level + 1} · power +${rack.power} TH/s · ${price.toLocaleString("id-ID")} LC`,
    amount: -price,
    kind: "upgrade",
  }, now);
  return next;
}

export function setRackUnitPlaced(save: GameSave, unitId: string, placed: boolean, now = Date.now()): GameSave {
  const next = settleOffline(save, now);
  const index = next.rackUnits.findIndex((unit) => unit.id === unitId);
  if (index < 0) throw new Error("Unit rak tidak ditemukan di inventori.");
  const unit = next.rackUnits[index];
  if (unit.placed === placed) return next;
  if (!placed) {
    const rack = SERVER_RACKS.find((item) => item.id === unit.rackId);
    const capacityAfterRemoving = getRoomSlotCapacity(next) - (rack?.slots || 0);
    const installedCount = next.minerUnits.filter((item) => item.placed).length;
    if (installedCount > capacityAfterRemoving) throw new Error("Keluarkan miner dari ruang dulu sebelum menyimpan rak ini.");
  }
  next.rackUnits[index] = { ...unit, placed };
  return next;
}

export function addTemporaryPower(save: GameSave, score: number, now = Date.now()): GameSave {
  const next = settleOffline(save, now);
  const cleanScore = Math.max(0, Math.min(100, Math.floor(score)));
  if (cleanScore < MIN_PAW_RUSH_BOOST_SCORE) return next;
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

export function grantArcadeReward(save: GameSave, gameName: string, requestedAmount: number, now = Date.now()) {
  const next = settleOffline(save, now);
  const today = getUtcDayKey(now);
  const earnedBefore = next.arcadeRewardDay === today ? next.arcadeCoinsToday : 0;
  const requested = round2(Math.max(0, requestedAmount));
  const earned = round2(Math.min(requested, Math.max(0, MAX_ARCADE_REWARD_PER_DAY - earnedBefore)));
  next.arcadeRewardDay = today;
  next.arcadeCoinsToday = round2(earnedBefore + earned);
  if (earned > 0) {
    next.balance = Math.round((next.balance + earned) * 1_000_000) / 1_000_000;
    next.xp += Math.floor(earned * 5);
    addActivity(next, {
      title: `${gameName} selesai`,
      detail: `Bonus arcade +${earned.toLocaleString("id-ID")} LC · batas harian ${MAX_ARCADE_REWARD_PER_DAY} LC`,
      amount: earned,
      kind: "arcade",
    }, now);
  }
  return {
    save: next,
    earned,
    remainingToday: round2(Math.max(0, MAX_ARCADE_REWARD_PER_DAY - next.arcadeCoinsToday)),
  };
}

export function round2(value: number) {
  return Math.round(value * 100) / 100;
}
