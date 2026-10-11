"use client";

import { useEffect, useMemo, useState } from "react";
import { BatteryCharging, Cpu, Gauge, Gem, HardDrive, Package, ShoppingBag, Sparkles, Zap } from "lucide-react";

type CatalogItem = { id: string; name: string; type: string; description: string; price: number; hashPower: number; energyUsage: number };
type GameState = { player: { id: string; name: string; balance: number; xp: number }; rigs: { id: string; name: string; kind: string; hash: number; level: number; progress: number; owned: boolean }[]; hashRate: number; dailyYield: number; inventory: { id: string; name: string; type: string; quantity: number; equipped: boolean }[]; database: "postgres" | "demo" };

const fallbackCatalog: CatalogItem[] = [
  { id: "rig-silent-runner", name: "Silent Runner Rig", type: "rig", description: "Compact second rig, +10 GH/s", price: 700, hashPower: 10, energyUsage: 3 },
  { id: "gpu-nebula-x1", name: "Nebula GPU X1", type: "gpu", description: "Efficient board, +12 GH/s", price: 420, hashPower: 12, energyUsage: 2 },
  { id: "gpu-cryo-fan", name: "Cryo Fan", type: "gpu", description: "Cooling module, +4 GH/s", price: 120, hashPower: 4, energyUsage: 1 },
  { id: "booster-pulse", name: "Pulse Booster", type: "booster", description: "2x output for one claim", price: 260, hashPower: 0, energyUsage: 0 },
];

export default function Home() {
  const [state, setState] = useState<GameState | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>(fallbackCatalog);
  const [lastClaim, setLastClaim] = useState("Ready to claim");
  const [toast, setToast] = useState("");
  const hash = state?.hashRate ?? 18;
  const daily = state?.dailyYield ?? 61;

  useEffect(() => { (async () => { await fetch("/api/auth/guest", { method: "POST" }); const [game, shop] = await Promise.all([fetch("/api/game"), fetch("/api/shop")]); setState(await game.json()); setCatalog((await shop.json()).catalog || fallbackCatalog); })(); }, []);
  useEffect(() => { const timer = window.setInterval(() => setState(s => s ? ({ ...s, rigs: s.rigs.map(r => r.owned ? { ...r, progress: (r.progress + 1.4) % 100 } : r) }) : s), 1000); return () => window.clearInterval(timer); }, []);

  function notify(message: string) { setToast(message); window.setTimeout(() => setToast(""), 2400); }
  async function action(actionName: string, itemId?: string) { const response = await fetch("/api/game", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: actionName, itemId }) }); const data = await response.json(); if (!response.ok) return notify(data.error || "Transaksi gagal"); setState(data); if (actionName === "claim") setLastClaim("Reward claimed just now"); notify(actionName === "buy" ? "Item purchased and equipped" : actionName === "claim" ? "Mining reward claimed" : "Operation completed"); }

  const starter = state?.rigs[0];
  const upgradePrice = 180 + Math.max(0, (starter?.level || 1) - 1) * 90;
  const dbLabel = state?.database === "postgres" ? "DATABASE ONLINE" : "DEMO MODE";
  const inventoryCount = useMemo(() => state?.inventory.reduce((sum, item) => sum + item.quantity, 0) || 0, [state]);

  return <main className="shell">
    <header className="topbar"><div className="brand"><div className="brand-mark"><Cpu size={21}/></div><div><h1>ARCADE NEXUS</h1><p>virtual mining network / season 01</p></div></div><div className="account"><span className="pill">● {dbLabel}</span><div className="avatar">A</div><div><b>{state?.player.name || "Guest Miner"}</b><p className="brand p">Level 04 · {state?.player.xp.toLocaleString() || "2,840"} XP</p></div></div></header>
    <section className="hero"><div className="card hero-card"><div className="eyebrow">Mining command center</div><h2>Build a rig. Earn NEX. Own the network.</h2><p>A virtual mining simulator built for strategy—not real crypto mining. Every purchase is checked on the server before your inventory changes.</p></div><div className="card balance"><div><div className="balance-label">AVAILABLE BALANCE</div><div className="balance-value">{(state?.player.balance ?? 860).toLocaleString()} <span>NEX</span></div></div><div className="balance-foot"><span>Player ID · {state?.player.id.slice(0, 8) || "loading"}…</span><span>Virtual only</span></div></div></section>
    <section className="grid"><div className="card panel"><div className="panel-head"><div><h3 className="panel-title">Your mining floor</h3><span className="panel-note">Server-validated operations</span></div><button className="btn btn-primary" onClick={() => action("claim")}><Gem size={14}/> Claim rewards</button></div><div className="stats"><div className="stat"><small>TOTAL HASH RATE</small><strong className="cyan">{hash} GH/s</strong></div><div className="stat"><small>EST. DAILY YIELD</small><strong className="amber">{daily} NEX</strong></div><div className="stat"><small>POWER EFFICIENCY</small><strong className="violet">94.6%</strong></div></div><div className="rig-list">{(state?.rigs || []).map((rig, index) => <div className="rig" key={rig.id}><div className="rig-row"><div className="rig-name"><div className="rig-icon">{index === 0 ? <HardDrive size={20}/> : <Zap size={20}/>}</div><div><h4>{rig.name}</h4><small>{rig.kind} · {rig.owned ? `${rig.hash} GH/s` : "offline"}</small></div></div>{rig.owned ? index === 0 ? <button className="btn btn-ghost" onClick={() => action("upgrade")}>Upgrade · {upgradePrice} NEX</button> : <span className="pill">ACTIVE</span> : <button className="btn btn-ghost" onClick={() => action("activate", "rig-silent-runner")}>Activate · 700 NEX</button>}</div>{rig.owned && <><div className="progress"><span style={{width: `${rig.progress}%`}}/></div><div className="feed"><span>{rig.progress.toFixed(0)}% cycle complete</span><b>Level {rig.level}</b></div></>}</div>)}</div><div className="feed"><span><Sparkles size={13}/> {lastClaim}</span><span>Auto-mining <b>enabled</b></span></div></div>
      <aside className="card panel"><div className="panel-head"><div><h3 className="panel-title"><ShoppingBag size={17}/> Nexus shop</h3><span className="panel-note">Server-priced marketplace</span></div><span className="pill">{inventoryCount} ITEMS</span></div><div className="market">{catalog.map(item => <div className="item" key={item.id}><div className="item-main"><div className="item-icon">{item.type === "gpu" ? <Gauge size={18}/> : item.type === "booster" ? <Zap size={18}/> : <BatteryCharging size={18}/>}</div><div><h4>{item.name}</h4><p>{item.description}</p></div></div><button className="buy" onClick={() => action("buy", item.id)} disabled={!state || state.player.balance < item.price}>{item.price} NEX</button></div>)}</div><div className="feed"><span><Package size={13}/> {inventoryCount} owned item(s)</span><span><span style={{color:'var(--cyan)'}}>●</span> catalog live</span></div></aside></section>{toast && <div className="toast">{toast}</div>}
  </main>;
}
