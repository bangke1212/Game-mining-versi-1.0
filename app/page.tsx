"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, BatteryCharging, Cpu, Gauge, HardDrive, LayoutDashboard, LogIn, Menu, Package, Power, ShoppingBag, Sparkles, Volume2, VolumeX, Zap } from "lucide-react";

type CatalogItem = { id: string; name: string; type: string; description: string; price: number; hashPower: number; energyUsage: number };
type GameState = { player: { id: string; name: string; balance: number; xp: number }; rigs: { id: string; name: string; kind: string; hash: number; level: number; progress: number; owned: boolean }[]; hashRate: number; dailyYield: number; inventory: { id: string; name: string; type: string; quantity: number; equipped: boolean }[]; database: "postgres" | "demo" };

const fallbackCatalog: CatalogItem[] = [
  { id: "rig-silent-runner", name: "Silent Runner Rig", type: "rig", description: "Compact second rig, +10 GH/s", price: 700, hashPower: 10, energyUsage: 3 },
  { id: "gpu-nebula-x1", name: "Nebula GPU X1", type: "gpu", description: "Efficient board, +12 GH/s", price: 420, hashPower: 12, energyUsage: 2 },
  { id: "gpu-cryo-fan", name: "Cryo Fan", type: "gpu", description: "Cooling module, +4 GH/s", price: 120, hashPower: 4, energyUsage: 1 },
  { id: "booster-pulse", name: "Pulse Booster", type: "booster", description: "2x output for one claim", price: 260, hashPower: 0, energyUsage: 0 },
];

function BlockRig({ active = true, compact = false }: { active?: boolean; compact?: boolean }) {
  return <div className={`block-rig ${compact ? "compact" : ""} ${active ? "is-active" : "is-offline"}`} aria-label={active ? "Active mining rig" : "Offline mining rig"}><div className="rig-antenna"/><div className="rig-top"><i/><i/><i/></div><div className="rig-core"><div className="rig-screen">{active ? "NEX" : "OFF"}</div><div className="rig-vents"><i/><i/><i/><i/></div></div><div className="rig-base"><i/><i/><i/><i/><i/></div><span className="rig-led"/></div>;
}

export default function Home() {
  const [state, setState] = useState<GameState | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>(fallbackCatalog);
  const [toast, setToast] = useState("");
  const [tick, setTick] = useState(0);
  const [liveBalance, setLiveBalance] = useState(860);
  const [musicOn, setMusicOn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authUser, setAuthUser] = useState<{ name: string; username: string } | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const hash = state?.hashRate ?? 18;
  const daily = state?.dailyYield ?? 61;

  useEffect(() => { (async () => { await fetch("/api/auth/guest", { method: "POST" }); const [game, shop] = await Promise.all([fetch("/api/game"), fetch("/api/shop")]); const gameData = await game.json(); setState(gameData); setLiveBalance(gameData.player.balance); setCatalog((await shop.json()).catalog || fallbackCatalog); const auth = await fetch("/api/auth/me"); if (auth.ok) setAuthUser((await auth.json()).user); })(); }, []);
  useEffect(() => { const reason = new URLSearchParams(window.location.search).get("auth"); if (reason === "missing_config") notify("X signup belum dikonfigurasi di Vercel"); if (reason === "invalid_state") notify("Sesi signup X kedaluwarsa, silakan coba lagi"); }, []);
  useEffect(() => { const timer = window.setInterval(() => { setTick(v => v + 1); setLiveBalance(v => v + hash / 100); setState(s => s ? ({ ...s, rigs: s.rigs.map(r => r.owned ? { ...r, progress: (r.progress + 1.4) % 100 } : r) }) : s); }, 1000); return () => window.clearInterval(timer); }, [hash]);
  useEffect(() => { const timer = window.setInterval(async () => { const response = await fetch("/api/game", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "sync" }) }); if (!response.ok) return; const data = await response.json(); setState(data); setLiveBalance(data.player.balance); }, 5000); return () => window.clearInterval(timer); }, []);

  function notify(message: string) { setToast(message); window.setTimeout(() => setToast(""), 2400); }
  function playSfx(kind: "click" | "buy" | "upgrade") { const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext; if (!AudioCtor) return; const ctx = audioContextRef.current || new AudioCtor(); audioContextRef.current = ctx; const notes = kind === "buy" ? [392, 523, 659] : kind === "upgrade" ? [330, 440, 659] : [440]; const now = ctx.currentTime; notes.forEach((frequency, index) => { const oscillator = ctx.createOscillator(); const gain = ctx.createGain(); oscillator.type = kind === "click" ? "square" : "triangle"; oscillator.frequency.value = frequency; gain.gain.setValueAtTime(0.0001, now + index * 0.07); gain.gain.exponentialRampToValueAtTime(kind === "click" ? 0.045 : 0.07, now + index * 0.07 + 0.01); gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.07 + 0.12); oscillator.connect(gain).connect(ctx.destination); oscillator.start(now + index * 0.07); oscillator.stop(now + index * 0.07 + 0.13); }); }
  function toggleMusic() { if (!musicRef.current) { const audio = new Audio("/audio/mining-retro-8bit.wav"); audio.loop = true; audio.volume = 0.22; musicRef.current = audio; } if (musicOn) { musicRef.current.pause(); setMusicOn(false); } else { musicRef.current.play().then(() => setMusicOn(true)).catch(() => notify("Tap again to enable music")); } }
  async function action(actionName: string, itemId?: string) { const response = await fetch("/api/game", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: actionName, itemId }) }); const data = await response.json(); if (!response.ok) { playSfx("click"); return notify(data.error || "Transaction failed"); } setState(data); setLiveBalance(data.player.balance); playSfx(actionName === "buy" ? "buy" : actionName === "upgrade" ? "upgrade" : "click"); notify(actionName === "buy" ? "Item purchased and equipped" : "Operation completed"); }

  const starter = state?.rigs[0];
  const upgradePrice = 180 + Math.max(0, (starter?.level || 1) - 1) * 90;
  const dbLabel = state?.database === "postgres" ? "DATABASE ONLINE" : "DEMO MODE";
  const inventoryCount = useMemo(() => state?.inventory.reduce((sum, item) => sum + item.quantity, 0) || 0, [state]);
  const liveSignal = tick % 2 === 0;

  return <main className="app-shell">
    <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
      <div className="side-brand"><div className="brand-mark"><Cpu size={20}/></div><div><strong>ARCADE<br/>NEXUS</strong><small>MINING OS / 01</small></div></div>
      <div className="side-section-label">COMMAND MENU</div>
      <nav><a href="#dashboard" className="nav-item active" onClick={() => setMenuOpen(false)}><LayoutDashboard size={16}/> Dashboard <span>01</span></a><a href="#telemetry" className="nav-item" onClick={() => setMenuOpen(false)}><Activity size={16}/> Telemetry <span>02</span></a><a href="#market" className="nav-item" onClick={() => setMenuOpen(false)}><ShoppingBag size={16}/> Market <span>03</span></a></nav>
      <div className="sidebar-spacer"/>
      <div className="side-status"><div className="side-section-label">SYSTEM STATUS</div><p><span className="status-light"/> CORE NETWORK<br/><b>OPERATIONAL</b></p><p><span className="status-light amber"/> POWER GRID<br/><b>STABLE · 94.6%</b></p></div>
      <div className="side-footer"><span>v1.1.0</span><span>© 1984 NEX</span></div>
    </aside>

    <section className="workspace">
      <header className="topbar"><button className="menu-button" onClick={() => setMenuOpen(v => !v)} aria-label="Open menu"><Menu size={18}/></button><div className="breadcrumb"><span>SECTOR 01</span><b>/</b><strong>MINING DASHBOARD</strong></div><div className="top-actions"><a className="auth-button" href="/api/auth/twitter"><LogIn size={14}/> {authUser ? `@${authUser.username}` : "SIGN UP WITH X"}</a><button className="sound-toggle" onClick={toggleMusic}>{musicOn ? <Volume2 size={14}/> : <VolumeX size={14}/>} {musicOn ? "AUDIO ON" : "AUDIO OFF"}</button><span className="db-pill"><i/> {dbLabel}</span><div className="avatar">A</div><div className="operator"><b>{authUser?.name || state?.player.name || "Guest Miner"}</b><small>OPERATOR · LVL 04</small></div></div></header>
      <div className="page-heading"><div><p className="eyebrow">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "short", year: "numeric" }).toUpperCase()}</p><h1>Command center <span>/</span> overview</h1></div><div className="heading-readout"><span className={liveSignal ? "live-dot" : "live-dot dim"}/> LIVE FEED <b>{hash} GH/S</b></div></div>

      <section id="dashboard" className="hero-grid"><div className="terminal-hero panel"><div className="panel-stamp">NEX // MINING NETWORK</div><h2>Build a rig.<br/><em>Earn NEX.</em><br/>Own the network.</h2><p>Virtual mining simulator / strategic operations console. No real cryptocurrency is mined.</p><div className="hero-line"><span>SESSION UPTIME</span><b>04:28:16</b><span>NODE</span><b>NX-001</b></div></div><div className="balance-panel panel"><div className="panel-label"><span>WALLET BALANCE</span><Power size={15}/></div><strong>{liveBalance.toFixed(2)} <small>NEX</small></strong><div className="balance-graph"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div><div className="balance-meta"><span>AUTO-CREDIT <b>ENABLED</b></span><span>+{(hash / 100).toFixed(2)} / SEC</span></div></div></section>

      <section className="metric-strip"><div><small>HASH RATE</small><b className="green">{hash} <i>GH/s</i></b><span>▲ 12.4% / 24H</span></div><div><small>DAILY YIELD</small><b className="amber">{daily} <i>NEX</i></b><span>ESTIMATED OUTPUT</span></div><div><small>POWER EFFICIENCY</small><b className="blue">94.6 <i>%</i></b><span>GRID LOAD NOMINAL</span></div><div><small>ACTIVE RIGS</small><b>{state?.rigs.filter(r => r.owned).length || 0}<i> / 2</i></b><span>FLOOR CAPACITY</span></div></section>

      <section className="content-grid"><div id="telemetry" className="panel rig-panel"><div className="panel-head"><div><span className="section-kicker">01 / TELEMETRY</span><h3><HardDrive size={17}/> Your mining floor</h3></div><span className="status-badge"><i/> AUTO CREDIT ON</span></div><div className="rig-list">{(state?.rigs || []).map((rig, index) => <div className="rig" key={rig.id}><div className="rig-row"><div className="rig-name"><BlockRig active={rig.owned} compact/><div><h4>{rig.name}</h4><small>{rig.kind.toUpperCase()} UNIT · {rig.owned ? `${rig.hash} GH/S` : "OFFLINE"}</small></div></div>{rig.owned ? index === 0 ? <button className="btn" onClick={() => action("upgrade")}>UPGRADE · {upgradePrice} NEX</button> : <span className="status-badge"><i/> ACTIVE</span> : <button className="btn" onClick={() => action("activate", "rig-silent-runner")}>ACTIVATE · 700 NEX</button>}</div>{rig.owned && <><div className="progress"><span style={{width: `${rig.progress}%`}}/></div><div className="feed"><span>{rig.progress.toFixed(0)}% CYCLE COMPLETE</span><b>LEVEL {rig.level}</b></div></>}</div>)}</div><div className="panel-foot"><span><Sparkles size={13}/> NEX credited automatically</span><span>LAST SYNC <b>JUST NOW</b></span></div></div>
        <aside id="market" className="panel shop-panel"><div className="panel-head"><div><span className="section-kicker">02 / INVENTORY</span><h3><ShoppingBag size={17}/> Nexus shop</h3></div><span className="count-badge">{inventoryCount} ITEMS</span></div><div className="market">{catalog.map(item => <div className="item" key={item.id}><div className="item-main">{item.type === "rig" ? <BlockRig compact/> : <div className="item-icon">{item.type === "gpu" ? <Gauge size={17}/> : item.type === "booster" ? <Zap size={17}/> : <BatteryCharging size={17}/>}</div>}<div><h4>{item.name}</h4><p>{item.description}</p></div></div><button className="buy" onClick={() => action("buy", item.id)} disabled={!state || liveBalance < item.price}>{item.price} NEX</button></div>)}</div><div className="panel-foot"><span><Package size={13}/> {inventoryCount} owned items</span><span className="green-text">CATALOG LIVE</span></div></aside></section>

      {toast && <div className="toast">{toast}</div>}
    </section>
  </main>;
}
