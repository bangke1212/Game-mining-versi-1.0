"use client";

import { useMemo, useState } from "react";
import { Activity, AlertTriangle, ArrowUp, BatteryCharging, Bell, ChevronDown, CircleGauge, Clock3, CloudSun, Crosshair, Fuel, Gauge, Layers3, MapPin, Menu, Pause, Radio, Route, Settings2, ShieldCheck, Truck, Wrench, X, Zap } from "lucide-react";
import Mine3DScene, { DispatchTruck } from "./mine-3d-scene";
import { ContextualPanel, OperationsTabs } from "./oreops-panels";

import { assets, materialFlow, portfolio, statusColor, statusLabel, type Asset } from "@/lib/oreops-data";

function KpiCard({ label, value, change, icon: Icon, tone = "green" }: { label: string; value: string; change: string; icon: typeof Activity; tone?: "green" | "amber" | "blue" | "red" }) {
  return <article className={`kpi-card tone-${tone}`}><div className="kpi-icon"><Icon size={17} /></div><div className="kpi-copy"><span>{label}</span><strong>{value}</strong><small className={change.startsWith("-") ? "down" : "up"}>{change}</small></div></article>;
}
function AssetGlyph({ asset }: { asset: Asset }) { return <div className={`asset-glyph glyph-${asset.kind}`}><span>{asset.icon}</span></div>; }
function MoreIcon() { return <span className="more-icon"><i /><i /><i /></span>; }

export default function HomePage() {
  const [selectedId, setSelectedId] = useState("");
  const [siteId, setSiteId] = useState("north-ridge");
  const [pitId, setPitId] = useState("pit-01");
  const [layer, setLayer] = useState("fleet");
  const [isLive, setIsLive] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dispatchTrucks, setDispatchTrucks] = useState<DispatchTruck[]>([]);
  const currentSite = portfolio.sites.find((item) => item.id === siteId) ?? portfolio.sites[0];
  const currentPit = currentSite.pits.find((item) => item.id === pitId) ?? currentSite.pits[0];
  const site = currentSite.name;
  const flowAlerts = useMemo(() => {
    const loadingCount = dispatchTrucks.filter((truck) => truck.status === "loading").length;
    const crusherCount = dispatchTrucks.filter((truck) => truck.status === "dumping" || (truck.progress > .5 && truck.progress < .7)).length;
    return [
      ...(loadingCount > 0 ? [{ tone: "amber", title: "Loading face bottleneck", detail: `${loadingCount} haul truck menunggu loading face A lebih lama dari target.` }] : []),
      ...(crusherCount > 0 ? [{ tone: "red", title: "Crusher queue bottleneck", detail: `${crusherCount} material movement berada di zona antrean Primary Crusher 01.` }] : []),
    ];
  }, [dispatchTrucks]);
  const selected = useMemo(() => assets.find((asset) => asset.id === selectedId), [selectedId]);
  return <main className="mine-app">
    <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
      <div className="brand"><div className="brand-mark"><Crosshair size={20} /></div><div><strong>ORE<span>OPS</span></strong><small>MINING CONTROL</small></div><button className="mobile-close" onClick={() => setMenuOpen(false)} aria-label="Tutup menu"><X size={18} /></button></div>
      <div className="site-switcher"><span>PORTFOLIO</span><strong>{portfolio.name}</strong><label><MapPin size={13} /><select value={siteId} onChange={(event) => { const nextSite = portfolio.sites.find((item) => item.id === event.target.value) ?? portfolio.sites[0]; setSiteId(nextSite.id); setPitId(nextSite.pits[0].id); setSelectedId(""); }} aria-label="Pilih site tambang">{portfolio.sites.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><Layers3 size={13} /><select value={pitId} onChange={(event) => { setPitId(event.target.value); setSelectedId(""); }} aria-label="Pilih pit atau facility">{currentSite.pits.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.depth}</option>)}</select></label></div>
      <nav className="main-nav"><span className="nav-label">CONTROL ROOM</span><button className="nav-item active"><Layers3 size={17} />Operations <b>LIVE</b></button><button className="nav-item"><Truck size={17} />Fleet dispatch <em>18</em></button><button className="nav-item"><Gauge size={17} />Production plan</button><button className="nav-item"><ShieldCheck size={17} />Safety center <em className="alert-count">3</em></button><span className="nav-label spaced">ASSET DATA</span><button className="nav-item"><Wrench size={17} />Maintenance</button><button className="nav-item"><Route size={17} />Haul routes</button><button className="nav-item"><Settings2 size={17} />Configuration</button></nav>
      <div className="sidebar-footer"><div className="network-status"><span className="pulse-dot" />Telemetry connected<small>Last sync 8 sec ago</small></div><div className="user-chip"><div className="avatar">AR</div><div><strong>Alex Rahman</strong><small>Shift supervisor</small></div><ChevronDown size={14} /></div></div>
    </aside>
    <section className="workspace">
      <header className="topbar"><button className="mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Buka menu"><Menu size={21} /></button><div><span className="eyebrow">OPERATIONS / LIVE VIEW</span><h1>{site}</h1></div><div className="top-actions"><div className="shift-clock"><Clock3 size={15} /><span>SHIFT B · 14:32:08</span></div><button className="icon-button"><Bell size={18} /><i /></button><div className="top-avatar">AR</div></div></header>
      <div className="content">
        <div className="hero-row"><div><p className="eyebrow">WEDNESDAY, 14 OCT 2026 · DAY SHIFT</p><h2>Good afternoon, Alex.</h2><p className="subline">Here is what&apos;s happening across your operation right now.</p></div><div className="live-control"><span className={isLive ? "live-indicator" : "paused-indicator"}>{isLive ? <Radio size={13} /> : <Pause size={13} />}{isLive ? "LIVE TELEMETRY" : "PAUSED"}</span><button onClick={() => setIsLive(!isLive)}>{isLive ? "Pause view" : "Resume view"}</button></div></div>
        <section className="kpi-grid"><KpiCard label="Production today" value="18,640 t" change="↑ 6.8% vs plan" icon={Activity} /><KpiCard label="Fleet availability" value="87.4%" change="↑ 2.1% this shift" icon={Truck} tone="blue" /><KpiCard label="Active equipment" value="24 / 28" change="− 2 in service" icon={CircleGauge} tone="amber" /><KpiCard label="Safety status" value="No incidents" change="3 alerts need review" icon={ShieldCheck} tone="red" /></section>
        <div className="dashboard-grid">
          <section className="scene-card"><div className="card-heading"><div><span className="eyebrow">SPATIAL OPERATIONS VIEW · R3F + GLTF</span><h3>{currentSite.name} · {currentPit.name}</h3></div><div className="scene-actions"><button className="layer-button"><Layers3 size={14} /> {layer === "fleet" ? "Fleet layer" : layer === "safety" ? "Safety layer" : "Production layer"}<ChevronDown size={13} /></button><button className="icon-button small"><Settings2 size={15} /></button></div></div><div className="scene-toolbar"><button className={layer === "fleet" ? "selected" : ""} onClick={() => setLayer("fleet")}><Truck size={13} /> Fleet</button><button className={layer === "production" ? "selected" : ""} onClick={() => setLayer("production")}><Activity size={13} /> Production</button><button className={layer === "safety" ? "selected" : ""} onClick={() => setLayer("safety")}><ShieldCheck size={13} /> Safety</button><span className="scene-legend"><i className="legend-green" /> Normal <i className="legend-amber" /> Attention <i className="legend-red" /> Service</span></div><Mine3DScene enabled={isLive} selectedId={selectedId} onSelect={setSelectedId} onDispatchUpdate={setDispatchTrucks} /><div className="scene-footer"><span><span className="pulse-dot" />Dispatch loop {isLive ? "running" : "paused"}</span><span>{dispatchTrucks.length || 2} tracked trucks</span><span>GLTF terrain · {currentPit.depth} · 8 sec telemetry</span></div></section>
          <ContextualPanel selected={selected} site={currentSite} pit={currentPit} onClear={() => setSelectedId("")} />
        </div>
        <section className="material-flow-card"><div className="panel-heading"><div><span className="eyebrow">MATERIAL FLOW TIMELINE</span><h3>Ore movement · {currentSite.name}</h3></div><span className="flow-summary"><Activity size={13} /> 640 t in current cycle</span></div><div className="flow-track">{materialFlow.map((step, index) => <div className={`flow-step ${step.state} ${flowAlerts.some((alert) => alert.title.toLowerCase().includes(step.name.toLowerCase().split(" ")[0])) ? "bottleneck" : ""}`} key={step.name}><div className="flow-node"><span>{index + 1}</span></div><div className="flow-copy"><b>{step.name}</b><small>{step.type}</small><strong>{step.value}</strong><em>{step.time} · {step.state === "active" ? "Live" : step.state === "complete" ? "Completed" : "Scheduled"}</em></div>{index < materialFlow.length - 1 && <div className={`flow-connector ${step.state}`}><span /></div>}</div>)}</div><div className="flow-footer"><span><i className="legend-green" /> Source: dispatch + crusher telemetry</span><span>Material: high-grade ore · Target: Stockpile 03</span><button className="text-button">Open material ledger <ArrowUp size={14} /></button></div></section>
        {flowAlerts.length > 0 && <section className="bottleneck-alerts" aria-live="polite"><div className="bottleneck-heading"><span><AlertTriangle size={15} /> AUTOMATED BOTTLENECK DETECTION</span><b>{flowAlerts.length} OPEN</b></div>{flowAlerts.map((alert) => <div className={`bottleneck-item ${alert.tone}`} key={alert.title}><div className="bottleneck-dot" /><div><strong>{alert.title}</strong><p>{alert.detail}</p></div><small>LIVE · now</small></div>)}</section>}
        <div className="bottom-grid"><OperationsTabs trucks={dispatchTrucks} selectedId={selectedId} onSelect={setSelectedId} /><section className="panel-card alerts-card"><div className="panel-heading"><div><span className="eyebrow">ATTENTION REQUIRED</span><h3>Operational alerts</h3></div><span className="alert-badge">3 OPEN</span></div><div className="alert-item"><div className="alert-symbol amber"><Fuel size={15} /></div><div><b>Fuel bay queue above threshold</b><p>4 trucks waiting at Fuel Bay 02</p><small>12 min ago</small></div><ChevronDown size={15} /></div><div className="alert-item"><div className="alert-symbol red"><Zap size={15} /></div><div><b>Unplanned idle time</b><p>HT-118 idle for more than 4 minutes</p><small>4 min ago</small></div><ChevronDown size={15} /></div><div className="alert-item"><div className="alert-symbol blue"><BatteryCharging size={15} /></div><div><b>Maintenance window approaching</b><p>Dozer DZ-12 service due in 18 hours</p><small>28 min ago</small></div><ChevronDown size={15} /></div></section></div>
        <footer className="app-footer"><span>OREOPS CONTROL PLATFORM · SIMULATION MODE</span><span><CloudSun size={13} /> 29°C · Clear · Wind 12 km/h</span></footer>
      </div>
    </section>
  </main>;
}
