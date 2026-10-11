import { sql } from "@vercel/postgres";

export type CatalogItem = { id: string; name: string; type: "rig" | "gpu" | "booster"; description: string; price: number; hashPower: number; energyUsage: number };
export type GameState = { player: { id: string; name: string; balance: number; xp: number }; rigs: { id: string; name: string; kind: string; hash: number; level: number; progress: number; owned: boolean }[]; hashRate: number; dailyYield: number; inventory: { id: string; name: string; type: string; quantity: number; equipped: boolean }[]; database: "postgres" | "demo" };

const catalog: CatalogItem[] = [
  { id: "rig-silent-runner", name: "Silent Runner Rig", type: "rig", description: "Compact second rig, +10 GH/s", price: 700, hashPower: 10, energyUsage: 3 },
  { id: "gpu-nebula-x1", name: "Nebula GPU X1", type: "gpu", description: "Efficient board, +12 GH/s", price: 420, hashPower: 12, energyUsage: 2 },
  { id: "gpu-cryo-fan", name: "Cryo Fan", type: "gpu", description: "Cooling module, +4 GH/s", price: 120, hashPower: 4, energyUsage: 1 },
  { id: "booster-pulse", name: "Pulse Booster", type: "booster", description: "2x output for one claim", price: 260, hashPower: 0, energyUsage: 0 },
];

type DemoPlayer = { balance: number; inventory: Record<string, number>; booster: number; rig2: boolean; level: number; lastMinedAt: number };
const demoPlayers = new Map<string, DemoPlayer>();
const hasDb = Boolean(process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL);

function getDemo(id: string) { if (!demoPlayers.has(id)) demoPlayers.set(id, { balance: 860, inventory: {}, booster: 0, rig2: false, level: 1, lastMinedAt: Date.now() }); return demoPlayers.get(id)!; }
function baseHash(p: DemoPlayer) { return 18 + (p.level - 1) * 6 + (p.rig2 ? 10 : 0) + (p.inventory["gpu-nebula-x1"] || 0) * 12 + (p.inventory["gpu-cryo-fan"] || 0) * 4; }
function accrueDemo(p: DemoPlayer) { const elapsed = Math.max(0, Math.floor((Date.now() - p.lastMinedAt) / 1000)); const earned = Math.floor(elapsed * baseHash(p) / 100); if (earned > 0) p.balance += earned; p.lastMinedAt = Date.now(); }

export function getCatalog() { return catalog; }
export function usingDatabase() { return hasDb; }

async function seed() { if (!hasDb) return; for (const item of catalog) await sql`insert into catalog_items (id,name,type,description,price,hash_power,energy_usage) values (${item.id},${item.name},${item.type},${item.description},${item.price},${item.hashPower},${item.energyUsage}) on conflict (id) do nothing`; }

export async function getState(playerId: string): Promise<GameState> {
  if (!hasDb) { const p = getDemo(playerId); accrueDemo(p); const hash = baseHash(p); return { player: { id: playerId, name: "Guest Miner", balance: p.balance, xp: 2840 }, rigs: [{ id: "rig-01", name: "Starter Rig", kind: "Nexus Mini", hash: 18 + (p.level - 1) * 6, level: p.level, progress: 72, owned: true }, { id: "rig-02", name: "Silent Runner", kind: "Cooling Bay", hash: 10, level: 1, progress: 28, owned: p.rig2 }], hashRate: hash, dailyYield: Math.round(hash * 3.4), inventory: Object.entries(p.inventory).map(([id, quantity]) => ({ id, name: catalog.find(x => x.id === id)?.name || id, type: catalog.find(x => x.id === id)?.type || "gpu", quantity, equipped: true })), database: "demo" }; }
  await seed();
  await sql`insert into players (id) values (${playerId}) on conflict (id) do nothing`;
  const player = (await sql`select id, display_name, balance, starter_level, last_mined_at from players where id=${playerId}`).rows[0] as { id:string; display_name:string; balance:number; starter_level:number; last_mined_at:string };
  const items = (await sql`select p.item_id as id, c.name, c.type, p.quantity, p.equipped from player_items p join catalog_items c on c.id=p.item_id where p.player_id=${playerId}`).rows as any[];
  const level = Number(player.starter_level || 1);
  const hash = 18 + (level - 1) * 6 + items.filter(x => x.equipped).reduce((s, x) => s + (Number(x.quantity) * (catalog.find(c => c.id === x.id)?.hashPower || 0)), 0);
  const elapsed = Math.max(0, Math.floor((Date.now() - new Date(player.last_mined_at).getTime()) / 1000));
  const earned = Math.floor(elapsed * hash / 100);
  if (earned > 0) { await sql`update players set balance=balance+${earned}, last_mined_at=now(), updated_at=now() where id=${playerId}`; player.balance = Number(player.balance) + earned; }
  return { player: { id: player.id, name: player.display_name, balance: Number(player.balance), xp: 2840 }, rigs: [{ id: "rig-01", name: "Starter Rig", kind: "Nexus Mini", hash: 18 + (level - 1) * 6, level, progress: 72, owned: true }, { id: "rig-02", name: "Silent Runner", kind: "Cooling Bay", hash: 10, level: 1, progress: 28, owned: items.some(x => x.id === "rig-silent-runner") }], hashRate: hash, dailyYield: Math.round(hash * 3.4), inventory: items.map(x => ({ id: x.id, name: x.name, type: x.type, quantity: Number(x.quantity), equipped: x.equipped })), database: "postgres" };
}

export async function performAction(playerId: string, action: string, itemId?: string) {
  const item = itemId ? catalog.find(x => x.id === itemId) : undefined;
  if (action === "buy" && !item) throw new Error("Item tidak ditemukan");
  if (!hasDb) {
    const p = getDemo(playerId);
    accrueDemo(p);
    if (action === "buy" && item) { if (p.balance < item.price) throw new Error("Saldo NEX tidak cukup"); p.balance -= item.price; p.inventory[item.id] = (p.inventory[item.id] || 0) + 1; if (item.type === "rig") p.rig2 = true; }
    if (action === "claim") { const reward = Math.round(baseHash(p) * .7) * (p.booster ? 2 : 1); p.balance += Math.max(12, reward); p.booster = 0; }
    if (action === "sync") { accrueDemo(p); }
    if (action === "upgrade") { const price = 180 + (p.level - 1) * 90; if (p.balance < price) throw new Error("Saldo NEX tidak cukup"); p.balance -= price; p.level += 1; }
    if (action === "activate") { if (p.rig2) throw new Error("Rig sudah aktif"); if (p.balance < 700) throw new Error("Saldo NEX tidak cukup"); p.balance -= 700; p.rig2 = true; }
    return getState(playerId);
  }
  await seed();
  await sql`insert into players (id) values (${playerId}) on conflict (id) do nothing`;
  if (action === "buy" && item) {
    const paid = await sql`update players set balance=balance-${item.price}, updated_at=now() where id=${playerId} and balance >= ${item.price} returning balance`;
    if (!paid.rows.length) throw new Error("Saldo NEX tidak cukup");
    await sql`insert into player_items (player_id,item_id,quantity,equipped) values (${playerId},${item.id},1,true) on conflict (player_id,item_id) do update set quantity=player_items.quantity+1`;
    await sql`insert into transactions (player_id,item_id,kind,amount) values (${playerId},${item.id},'purchase',${item.price})`;
  } else if (action === "claim") {
    const current = await getState(playerId); const reward = Math.max(12, Math.round(current.hashRate * .7)); await sql`update players set balance=balance+${reward}, updated_at=now() where id=${playerId}`; await sql`insert into transactions (player_id,kind,amount) values (${playerId},'claim',${reward})`;
  } else if (action === "sync") {
    await getState(playerId);
  } else if (action === "upgrade") {
    const current = await getState(playerId); const price = 180 + Math.max(0, current.rigs[0].level - 1) * 90; const paid = await sql`update players set balance=balance-${price}, starter_level=starter_level+1, updated_at=now() where id=${playerId} and balance >= ${price} returning balance`; if (!paid.rows.length) throw new Error("Saldo NEX tidak cukup"); await sql`insert into transactions (player_id,kind,amount) values (${playerId},'upgrade',${price})`;
  } else if (action === "activate" && item) { return performAction(playerId, "buy", item.id); }
  return getState(playerId);
}
