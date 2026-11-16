"use client";
import { Cpu, Power, Trash2, Zap } from "lucide-react";
import Mine3DScene from "@/app/mine-3d-scene";
import LiveTelemetry from "./LiveTelemetry";
import { minerById } from "@/lib/rollercoin/catalog";
import { freeSlots, permanentPower, tempPowerNow, totalPower, totalSlots } from "@/lib/rollercoin/engine";
import { computeTelemetry, sceneMiners } from "@/lib/rollercoin/telemetry";
import type { GameState } from "@/lib/rollercoin/types";
import { Badge, SectionTitle, fmtGh, fmtRlt } from "./ui";

export default function MiningRoom({
  state,
  now,
  secondsToBlock,
  onToggle,
  onSell,
}: {
  state: GameState;
  /** Single clock source from page.tsx (1s tick). Never call Date.now() in render. */
  now: number;
  secondsToBlock: number;
  onToggle: (uid: string) => void;
  onSell: (uid: string) => void;
}) {
  const online = state.ownedMiners.filter((m) => m.on).length;
  const telemetry = computeTelemetry(state, now);
  const scene = sceneMiners(state);
  return (
    <>
      <SectionTitle
        eyebrow="MINING ROOM / VIRTUAL RIGS"
        title="Mining room"
        action={<Badge>{online} / {state.ownedMiners.length} miners on</Badge>}
      />
      <div className="metric-grid">
        <article className="metric-card"><div className="metric-icon"><Zap size={16} /></div><span>Total power</span><strong className="telemetry-num">{fmtGh(totalPower(state, now))}</strong><small>Permanent + temporary</small></article>
        <article className="metric-card lavender"><div className="metric-icon"><Cpu size={16} /></div><span>Permanent power</span><strong className="telemetry-num">{fmtGh(permanentPower(state))}</strong><small>From owned miners</small></article>
        <article className="metric-card amber"><div className="metric-icon"><Zap size={16} /></div><span>Temporary power</span><strong className="telemetry-num">{fmtGh(tempPowerNow(state, now))}</strong><small>From mini-games · expires</small></article>
        <article className="metric-card blue"><div className="metric-icon"><Cpu size={16} /></div><span>Rack slots</span><strong className="telemetry-num">{state.ownedMiners.length} / {totalSlots(state)}</strong><small>{freeSlots(state)} free slot(s) · Room Lv {state.roomLevel}</small></article>
      </div>

      <LiveTelemetry state={state} now={now} secondsToBlock={secondsToBlock} showMiners />

      <div className="room-layout">
        <section className="panel room-panel">
          <Mine3DScene
            miners={scene.shown}
            online={online}
            total={state.ownedMiners.length}
            liveGh={telemetry.liveTotalGh}
            avgTempC={telemetry.avgTempC}
          />
          <div className="room-footer">
            <span><i className="legend mint" /> Miner on</span>
            <span><i className="legend coral" /> Miner off</span>
            <strong>{online} miner(s) transmitting (visual){scene.extra > 0 ? ` · +${scene.extra} more not shown in 3D` : ""}</strong>
          </div>
        </section>
        <section className="panel room-side">
          <span className="eyebrow">HOW POWER WORKS</span>
          <h3>Your rig, explained</h3>
          <p className="rc-muted">Miners give permanent power. Mini-games give temporary power with a timer. Both count toward your block share — see the Live Rig Telemetry above for per-miner numbers.</p>
          <div className="room-note">
            <Zap size={15} />
            <div><strong>Simulated hardware</strong><small>Temperature, fan speed and wattage are simulated from each miner&apos;s catalog power — no real hardware is measured.</small></div>
          </div>
        </section>
      </div>

      <section className="panel" style={{ marginTop: 13 }}>
        <SectionTitle eyebrow="YOUR MINERS" title="Installed miners" action={<Badge tone="lavender">{fmtRlt(state.rlt)} balance</Badge>} />
        {state.ownedMiners.length === 0 ? (
          <p className="rc-muted">No miners yet. Buy one in the Shop.</p>
        ) : (
          <div className="fleet-grid">
            {state.ownedMiners.map((m) => {
              const item = minerById(m.catalogId);
              if (!item) return null;
              return (
                <article className="panel fleet-card" key={m.uid}>
                  <div className="fleet-head">
                    <div className="fleet-icon"><Cpu size={20} /></div>
                    <div><span className="eyebrow">{item.rarity}</span><h3>{item.name}</h3><small>{item.desc}</small></div>
                    <Badge tone={m.on ? "mint" : "slate"}>{m.on ? "ON" : "OFF"}</Badge>
                  </div>
                  <div className="fleet-metrics">
                    <div><span>POWER</span><strong className="telemetry-num">{item.powerGh}<small> GH/s</small></strong></div>
                    <div><span>BOUGHT FOR</span><strong className="telemetry-num">{item.priceRlt}<small> RLT</small></strong></div>
                    <div><span>SELL BACK</span><strong className="telemetry-num">{Math.floor(item.priceRlt / 2)}<small> RLT</small></strong></div>
                  </div>
                  <div className="fleet-actions">
                    <button className="secondary-button" onClick={() => onToggle(m.uid)}><Power size={14} />{m.on ? "Turn off" : "Turn on"}</button>
                    <button className="secondary-button" onClick={() => { if (confirm(`Sell ${item.name} for ${Math.floor(item.priceRlt / 2)} RLT?`)) onSell(m.uid); }}><Trash2 size={14} />Sell</button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
