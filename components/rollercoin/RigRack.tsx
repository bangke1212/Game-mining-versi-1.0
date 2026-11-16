"use client";
import { Cpu, Fan, Power, ShoppingCart, Trash2 } from "lucide-react";
import { minerById } from "@/lib/rollercoin/catalog";
import { freeSlots, totalSlots } from "@/lib/rollercoin/engine";
import { computeTelemetry, fmtLiveGh, fmtTemp, fmtUptime, fmtWatts } from "@/lib/rollercoin/telemetry";
import type { GameState } from "@/lib/rollercoin/types";
import { fmtGh } from "./ui";

/**
 * Rig Rack — clean 2D rack display, pure CSS/DOM.
 *
 * Replaces the old Three.js room (app/mine-3d-scene.tsx), whose Html labels
 * overlapped on mobile portrait screens. Every miner is one rack unit in
 * normal document flow: one label per miner, nothing absolutely positioned
 * over an image, no overlapping overlays. All numbers come from
 * computeTelemetry() and update every second from the page tick.
 */
export default function RigRack({
  state,
  now,
  compact = false,
  onToggle,
  onSell,
  onGoShop,
}: {
  state: GameState;
  /** Single clock source from page.tsx (1s tick). Never call Date.now() in render. */
  now: number;
  /** Compact (Overview): no on/off or sell controls, no uptime column. */
  compact?: boolean;
  onToggle?: (uid: string) => void;
  onSell?: (uid: string) => void;
  onGoShop?: () => void;
}) {
  const t = computeTelemetry(state, now);
  const byUid = new Map(t.miners.map((m) => [m.uid, m]));
  const slots = totalSlots(state);
  const maxBase = Math.max(1, ...t.miners.map((m) => m.baseGh));
  const interactive = !compact && onToggle && onSell;

  return (
    <section className="panel rig-panel" aria-label="Mining rig rack">
      <div className="rig-head">
        <div>
          <span className="eyebrow">MINING RACK · ROOM LV {state.roomLevel}</span>
          <h3>Your rig</h3>
          <small>
            {t.onlineCount} / {t.totalCount} miner(s) on · {t.totalCount} / {slots} slots used · {state.racks.length} rack(s)
          </small>
        </div>
        <div className="rig-head-power">
          <span>TOTAL LIVE</span>
          <strong className="telemetry-num">{fmtGh(t.liveTotalGh)}</strong>
        </div>
      </div>

      <div className="rig-frame">
        {Array.from({ length: slots }, (_, i) => {
          const owned = state.ownedMiners[i];
          if (!owned) {
            return (
              <div className="rig-unit rig-empty" key={`empty-${i}`}>
                <span className="rig-slot">SLOT {i + 1}</span>
                <div className="rig-empty-body">
                  <Cpu size={20} />
                  <div>
                    <strong>Empty slot</strong>
                    <small>Buy a miner in the Shop to fill this slot.</small>
                  </div>
                  {onGoShop ? (
                    <button className="secondary-button" onClick={onGoShop}>
                      <ShoppingCart size={14} /> Shop
                    </button>
                  ) : null}
                </div>
              </div>
            );
          }
          const item = minerById(owned.catalogId);
          const m = byUid.get(owned.uid);
          if (!item || !m) return null;
          const powerPct = Math.max(2, Math.round((m.liveGh / maxBase) * 100));
          const sellBack = Math.floor(item.priceRlt / 2);
          return (
            <article className={`rig-unit ${m.on ? "on" : "off"}`} key={owned.uid}>
              <div className="rig-unit-top">
                <span className="rig-slot">SLOT {i + 1}</span>
                <span className={`rig-status ${m.on ? "on" : "off"}`}>
                  <i />
                  {m.on ? "ON" : "OFF"}
                </span>
              </div>
              <div className="rig-unit-main">
                <div className={`rig-fan ${m.on ? "spin" : "stopped"}`} aria-hidden="true">
                  <Fan size={26} />
                </div>
                <div className="rig-unit-id">
                  <strong>{m.name}</strong>
                  <small>
                    {m.rarity} · {item.desc}
                  </small>
                </div>
                <div className="rig-unit-power">
                  <strong className="telemetry-num">{fmtLiveGh(m.liveGh)}</strong>
                  <small>of {m.baseGh} GH/s base</small>
                </div>
              </div>
              <div
                className="rig-powerbar"
                role="progressbar"
                aria-valuenow={powerPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${m.name} power share`}
              >
                <i style={{ width: `${powerPct}%` }} />
              </div>
              <div className="rig-metrics">
                <div>
                  <span>TEMP</span>
                  <b className={`telemetry-num ${m.tempTone}`}>{fmtTemp(m.tempC)}</b>
                </div>
                <div>
                  <span>FAN</span>
                  <b className="telemetry-num">{m.fanRpm.toLocaleString("en-US")} RPM</b>
                </div>
                <div>
                  <span>WATTS</span>
                  <b className="telemetry-num">{fmtWatts(m.watts)}</b>
                </div>
                {!compact ? (
                  <div>
                    <span>UPTIME</span>
                    <b className="telemetry-num">{fmtUptime(m.uptimeMs)}</b>
                  </div>
                ) : null}
              </div>
              {interactive ? (
                <div className="rig-actions">
                  <button className="secondary-button" onClick={() => onToggle(owned.uid)}>
                    <Power size={14} />
                    {m.on ? "Turn off" : "Turn on"}
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => {
                      if (confirm(`Sell ${item.name} for ${sellBack} RLT?`)) onSell(owned.uid);
                    }}
                  >
                    <Trash2 size={14} /> Sell · +{sellBack} RLT
                  </button>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <div className="rig-foot">
        <span>
          {freeSlots(state)} free slot(s) · Room level {state.roomLevel}
        </span>
        <span>Simulated hardware — temperature, fan and watts are simulated values.</span>
      </div>
    </section>
  );
}
