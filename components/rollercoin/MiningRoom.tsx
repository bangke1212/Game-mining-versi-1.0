"use client";
import { Cpu, Zap } from "lucide-react";
import LiveTelemetry from "./LiveTelemetry";
import RigRack from "./RigRack";
import { freeSlots, permanentPower, tempPowerNow, totalPower, totalSlots } from "@/lib/rollercoin/engine";
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

      <RigRack state={state} now={now} onToggle={onToggle} onSell={onSell} />

      <section className="panel" style={{ marginTop: 13 }}>
        <span className="eyebrow">HOW POWER WORKS</span>
        <h3>Your rig, explained</h3>
        <p className="rc-muted">Miners give permanent power. Mini-games give temporary power with a timer. Both count toward your block share — see the Live Rig Telemetry above for per-miner numbers.</p>
        <div className="room-note">
          <Zap size={15} />
          <div><strong>Simulated hardware</strong><small>Temperature, fan speed and wattage are simulated from each miner&apos;s catalog power — no real hardware is measured.</small></div>
        </div>
        <p className="rc-muted" style={{ marginTop: 12 }}>
          RLT balance: <strong className="telemetry-num">{fmtRlt(state.rlt)}</strong> · Sell a miner in its rack card to get 50% of its price back.
        </p>
      </section>
    </>
  );
}
