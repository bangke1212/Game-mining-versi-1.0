"use client";
import { useState } from "react";
import { Cpu, ShoppingCart, Home, Server } from "lucide-react";
import { MAX_ROOM_LEVEL, MINERS, RACKS, ROOM_EXPAND_COST, maxRacksForRoom } from "@/lib/rollercoin/catalog";
import type { GameState } from "@/lib/rollercoin/types";
import { Badge, SectionTitle, fmtRlt } from "./ui";

export default function Shop({
  state,
  onBuyMiner,
  onBuyRack,
  onExpandRoom,
}: {
  state: GameState;
  onBuyMiner: (id: string) => string | undefined;
  onBuyRack: (id: string) => string | undefined;
  onExpandRoom: () => string | undefined;
}) {
  const [msg, setMsg] = useState<string>("");
  const run = (fn: () => string | undefined) => {
    const err = fn();
    setMsg(err ?? "Done! Check your room and event log.");
  };
  return (
    <>
      <SectionTitle
        eyebrow="SHOP / SPEND RLT (IN-GAME ONLY)"
        title="Miner & rack shop"
        action={<Badge tone="amber">{fmtRlt(state.rlt)} available</Badge>}
      />
      {msg && <div className="rc-note">{msg}</div>}
      <p className="rc-muted">Prices are in RLT, the in-game currency. RLT cannot be withdrawn and has no real-world value.</p>

      <h3 className="rc-h3"><Cpu size={15} /> Virtual miners</h3>
      <div className="fleet-grid">
        {MINERS.map((m) => (
          <article className="panel fleet-card" key={m.id}>
            <div className="fleet-head">
              <div className="fleet-icon"><Cpu size={20} /></div>
              <div><span className="eyebrow">{m.rarity}</span><h3>{m.name}</h3><small>{m.desc}</small></div>
              <Badge tone={m.rarity === "Legendary" ? "lavender" : m.rarity === "Epic" ? "amber" : "mint"}>{m.rarity}</Badge>
            </div>
            <div className="fleet-metrics">
              <div><span>POWER</span><strong>{m.powerGh}<small> GH/s</small></strong></div>
              <div><span>PRICE</span><strong>{m.priceRlt}<small> RLT</small></strong></div>
            </div>
            <div className="fleet-actions">
              <button className="primary-button" disabled={state.rlt < m.priceRlt} onClick={() => run(() => onBuyMiner(m.id))}>
                <ShoppingCart size={14} /> Buy · {m.priceRlt} RLT
              </button>
            </div>
          </article>
        ))}
      </div>

      <h3 className="rc-h3"><Server size={15} /> Racks & room</h3>
      <div className="fleet-grid">
        {RACKS.map((r) => (
          <article className="panel fleet-card" key={r.id}>
            <div className="fleet-head">
              <div className="fleet-icon"><Server size={20} /></div>
              <div><span className="eyebrow">RACK</span><h3>{r.name}</h3><small>{r.desc}</small></div>
            </div>
            <div className="fleet-metrics">
              <div><span>SLOTS</span><strong>+{r.slots}</strong></div>
              <div><span>PRICE</span><strong>{r.priceRlt}<small> RLT</small></strong></div>
            </div>
            <div className="fleet-actions">
              <button className="primary-button" disabled={state.rlt < r.priceRlt || state.racks.length >= maxRacksForRoom(state.roomLevel)} onClick={() => run(() => onBuyRack(r.id))}>
                <ShoppingCart size={14} /> Buy · {r.priceRlt} RLT
              </button>
            </div>
          </article>
        ))}
        <article className="panel fleet-card">
          <div className="fleet-head">
            <div className="fleet-icon"><Home size={20} /></div>
            <div><span className="eyebrow">ROOM</span><h3>Expand room</h3><small>Level {state.roomLevel} → {Math.min(MAX_ROOM_LEVEL, state.roomLevel + 1)} · +1 rack bay</small></div>
          </div>
          <div className="fleet-metrics">
            <div><span>RACKS NOW</span><strong>{state.racks.length} / {maxRacksForRoom(state.roomLevel)}</strong></div>
            <div><span>PRICE</span><strong>{ROOM_EXPAND_COST}<small> RLT</small></strong></div>
          </div>
          <div className="fleet-actions">
            <button className="primary-button" disabled={state.roomLevel >= MAX_ROOM_LEVEL || state.rlt < ROOM_EXPAND_COST} onClick={() => run(() => onExpandRoom())}>
              <ShoppingCart size={14} /> {state.roomLevel >= MAX_ROOM_LEVEL ? "Max level reached" : `Expand · ${ROOM_EXPAND_COST} RLT`}
            </button>
          </div>
        </article>
      </div>
    </>
  );
}
