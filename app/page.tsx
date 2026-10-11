"use client";

import { useEffect, useMemo, useState } from "react";
import { BatteryCharging, Cpu, Gauge, Gem, HardDrive, Package, ShoppingBag, Sparkles, Zap } from "lucide-react";

type Rig = { id: string; name: string; kind: string; hash: number; level: number; progress: number; owned: boolean };
type Item = { id: string; name: string; description: string; price: number; effect: number };

const initialRigs: Rig[] = [
  { id: "rig-01", name: "Starter Rig", kind: "Nexus Mini", hash: 18, level: 1, progress: 72, owned: true },
  { id: "rig-02", name: "Silent Runner", kind: "Cooling Bay", hash: 0, level: 0, progress: 0, owned: false },
];
const items: Item[] = [
  { id: "cooling", name: "Cryo Fan", description: "+4 GH/s cooling module", price: 120, effect: 4 },
  { id: "gpu", name: "Nebula GPU", description: "+12 GH/s mining board", price: 420, effect: 12 },
  { id: "booster", name: "Pulse Booster", description: "2× output for 60 seconds", price: 260, effect: 0 },
];

export default function Home() {
  const [nex, setNex] = useState(860);
  const [rigs, setRigs] = useState(initialRigs);
  const [lastClaim, setLastClaim] = useState("Ready to claim");
  const [toast, setToast] = useState("");
  const [inventory, setInventory] = useState<string[]>([]);

  const hash = useMemo(() => rigs.reduce((sum, rig) => sum + rig.hash, 0), [rigs]);
  const daily = Math.round(hash * 3.4);

  useEffect(() => {
    const saved = window.localStorage.getItem("arcade-nexus-save");
    if (saved) {
      try { const data = JSON.parse(saved); setNex(data.nex ?? 860); setRigs(data.rigs ?? initialRigs); setInventory(data.inventory ?? []); } catch { /* reset safely */ }
    }
  }, []);
  useEffect(() => { window.localStorage.setItem("arcade-nexus-save", JSON.stringify({ nex, rigs, inventory })); }, [nex, rigs, inventory]);
  useEffect(() => { const timer = window.setInterval(() => setRigs(current => current.map(r => r.owned ? { ...r, progress: (r.progress + 1.4) % 100 } : r)), 1000); return () => window.clearInterval(timer); }, []);

  function notify(message: string) { setToast(message); window.setTimeout(() => setToast(""), 2400); }
  function claim() { const reward = Math.max(12, Math.round(hash * .7)); setNex(v => v + reward); setLastClaim(`+${reward} NEX claimed just now`); notify(`Reward claimed: +${reward} NEX`); }
  function upgrade() { const price = 180 + (rigs[0].level - 1) * 90; if (nex < price) return notify("Not enough NEX for this upgrade"); setNex(v => v - price); setRigs(rs => rs.map((r, i) => i === 0 ? { ...r, level: r.level + 1, hash: r.hash + 6 } : r)); notify("Starter Rig upgraded: +6 GH/s"); }
  function buy(item: Item) { if (nex < item.price) return notify("Not enough NEX for this item"); setNex(v => v - item.price); setInventory(v => [...v, item.id]); if (item.effect) setRigs(rs => rs.map((r, i) => i === 0 ? { ...r, hash: r.hash + item.effect } : r)); notify(`${item.name} added to inventory`); }
  function activateSecondRig() { if (nex < 700) return notify("Save 700 NEX to activate this rig"); setNex(v => v - 700); setRigs(rs => rs.map(r => r.id === "rig-02" ? { ...r, owned: true, hash: 10, level: 1, progress: 12 } : r)); notify("Silent Runner is online"); }

  return <main className="shell">
    <header className="topbar"><div className="brand"><div className="brand-mark"><Cpu size={21}/></div><div><h1>ARCADE NEXUS</h1><p>virtual mining network / season 01</p></div></div><div className="account"><span className="pill">● NETWORK ONLINE</span><div className="avatar">A</div><div><b>Alex Miner</b><p className="brand p">Level 04 · 2,840 XP</p></div></div></header>
    <section className="hero"><div className="card hero-card"><div className="eyebrow">Mining command center</div><h2>Build a rig. Earn NEX. Own the network.</h2><p>A calm, virtual mining simulator built for strategy—not real crypto mining. Upgrade your hardware and keep the hash rate climbing.</p></div><div className="card balance"><div><div className="balance-label">AVAILABLE BALANCE</div><div className="balance-value">{nex.toLocaleString()} <span>NEX</span></div></div><div className="balance-foot"><span>Wallet ID · 0x7A…39C</span><span>Virtual only</span></div></div></section>
    <section className="grid"><div className="card panel"><div className="panel-head"><div><h3 className="panel-title">Your mining floor</h3><span className="panel-note">2 slots · local save enabled</span></div><button className="btn btn-primary" onClick={claim}><Gem size={14}/> Claim rewards</button></div><div className="stats"><div className="stat"><small>TOTAL HASH RATE</small><strong className="cyan">{hash} GH/s</strong></div><div className="stat"><small>EST. DAILY YIELD</small><strong className="amber">{daily} NEX</strong></div><div className="stat"><small>POWER EFFICIENCY</small><strong className="violet">94.6%</strong></div></div><div className="rig-list">{rigs.map((rig, index) => <div className="rig" key={rig.id}><div className="rig-row"><div className="rig-name"><div className="rig-icon">{index === 0 ? <HardDrive size={20}/> : <Zap size={20}/>}</div><div><h4>{rig.name}</h4><small>{rig.kind} · {rig.owned ? `${rig.hash} GH/s` : "offline"}</small></div></div>{rig.owned ? index === 0 ? <button className="btn btn-ghost" onClick={upgrade}>Upgrade · {180 + (rig.level - 1) * 90} NEX</button> : <span className="pill">ACTIVE</span> : <button className="btn btn-ghost" onClick={activateSecondRig}>Activate · 700 NEX</button>}</div>{rig.owned && <><div className="progress"><span style={{width: `${rig.progress}%`}}/></div><div className="feed"><span>{rig.progress.toFixed(0)}% cycle complete</span><b>Level {rig.level}</b></div></>}</div>)}</div><div className="feed"><span><Sparkles size={13}/> {lastClaim}</span><span>Auto-mining <b>enabled</b></span></div></div>
      <aside className="card panel"><div className="panel-head"><div><h3 className="panel-title"><ShoppingBag size={17}/> Nexus shop</h3><span className="panel-note">Upgrade your operation</span></div><span className="pill">{inventory.length} ITEMS</span></div><div className="market">{items.map(item => <div className="item" key={item.id}><div className="item-main"><div className="item-icon">{item.id === "gpu" ? <Gauge size={18}/> : item.id === "booster" ? <Zap size={18}/> : <BatteryCharging size={18}/>}</div><div><h4>{item.name}</h4><p>{item.description}</p></div></div><button className="buy" onClick={() => buy(item)} disabled={nex < item.price}>{item.price} NEX</button></div>)}</div><div className="feed"><span><Package size={13}/> Inventory saved locally</span><span><span style={{color:'var(--cyan)'}}>●</span> marketplace live</span></div></aside></section>{toast && <div className="toast">{toast}</div>}
  </main>;
}
