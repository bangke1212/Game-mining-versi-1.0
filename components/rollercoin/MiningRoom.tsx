"use client";
import { Cpu, Power, Trash2, Zap } from "lucide-react";
import Mine3DScene from "@/app/mine-3d-scene";
import { minerById } from "@/lib/rollercoin/catalog";
import { freeSlots, permanentPower, tempPowerNow, totalPower, totalSlots } from "@/lib/rollercoin/engine";
import type { GameState } from "@/lib/rollercoin/types";
import { Badge, SectionTitle, fmtGh, fmtRlt } from "./ui";

export default function MiningRoom({
  state,
  onToggle,
  onSell,
}: {
  state: GameState;
  onToggle: (uid: string) => void;
  onSell: (uid: string) => void;
}) {
  const online = state.ownedMiners.filter((m) => m.on).length;
  const now = Date.now();
  return (
    <>
      <SectionTitle
        eyebrow="MINING ROOM / VIRTUAL RIGS"
        title="Mining room"
        action={<Badge>{online} / {state.ownedMiners.length} miners on</Badge>}
      />
      <div className="metric-grid">
        <article className="metric-card"><div className="metric-icon"><Zap size={16} /></div><span>Total power</span><strong>{fmtGh(totalPower(state, now))}</strong><small>Permanent + temporary</small></article>
        <article className="metric-card lavender"><div className="metric-icon"><Cpu size={16} /></div><span>Permanent power</span><strong>{fmtGh(permanentPower(state))}</strong><small>From owned miners</small></article>
        <article className="metric-card amber"><div className="metric-icon"><Zap size={16} /></div><span>Temporary power</span><strong>{fmtGh(tempPowerNow(state, now))}</strong><small>From mini-games · expires</small></article>
        <article className="metric-card blue"><div className="metric-icon"><Cpu size={16} /></div><span>Rack slots</span><strong>{state.ownedMiners.length} / {totalSlots(state)}</strong><small>{freeSlots(state)} free slot(s) · Room Lv {state.roomLevel}</small></article>
      </div>

      <div className="room-layout">
        <section className="panel room-panel">
          <Mine3DScene online={online} />
          <div className="room-footer">
            <span><i className="legend mint" /> Miner on</span>
            <span><i className="legend coral" /> Miner off</span>
            <strong>{online} miner(s) transmitting (visual)</strong>
          </div>
        </section>
        <section className="panel room-side">
          <span className="eyebrow">TEMPORARY POWER</span>
          <h3>Active boosts</h3>
          {state.tempPower.filter((t) => t.expiresAt > now).length === 0 ? (
            <p className="rc-muted">No active boost. Play a mini-game to earn temporary power.</p>
          ) : (
            state.tempPower.filter((t) => t.expiresAt > now).map((t) => (
              <div className="rack-row" key={t.id}>
                <div><strong>+{t.gh} GH/s</strong><small>{t.source}</small></div>
                <b>{Math.max(0, Math.ceil((t.expiresAt - now) / 60000))} min left</b>
              </div>
            ))
          )}
          <div className="room-note">
            <Zap size={15} />
            <div><strong>How power works</strong><small>Miners give permanent power. Mini-games give temporary power with a timer. Both count toward your block share.</small></div>
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
                    <div><span>POWER</span><strong>{item.powerGh}<small> GH/s</small></strong></div>
                    <div><span>BOUGHT FOR</span><strong>{item.priceRlt}<small> RLT</small></strong></div>
                    <div><span>SELL BACK</span><strong>{Math.floor(item.priceRlt / 2)}<small> RLT</small></strong></div>
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
