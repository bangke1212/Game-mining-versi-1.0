"use client";
import { Blocks, SlidersHorizontal, Trophy } from "lucide-react";
import { COINS, LEAGUES } from "@/lib/rollercoin/catalog";
import { leagueFor, nextLeague, previewBlockRewards, totalPower } from "@/lib/rollercoin/engine";
import type { GameState } from "@/lib/rollercoin/types";
import { COIN_IDS } from "@/lib/rollercoin/types";
import { Badge, SectionTitle, fmtCoin, fmtGh } from "./ui";

export default function League({
  state,
  secondsToBlock,
  onAllocation,
  onInterval,
}: {
  state: GameState;
  secondsToBlock: number;
  onAllocation: (coin: (typeof COIN_IDS)[number], pct: number) => void;
  onInterval: (sec: number) => void;
}) {
  const now = Date.now();
  const power = totalPower(state, now);
  const league = leagueFor(power);
  const next = nextLeague(power);
  const preview = previewBlockRewards(state, now);
  const mm = Math.floor(secondsToBlock / 60);
  const ss = String(secondsToBlock % 60).padStart(2, "0");
  return (
    <>
      <SectionTitle
        eyebrow="BLOCK REWARDS & LEAGUES / SIMULATED"
        title="Blocks & leagues"
        action={<Badge tone="amber">Next block in {mm}:{ss}</Badge>}
      />
      <div className="metric-grid">
        <article className="metric-card"><div className="metric-icon"><Blocks size={16} /></div><span>Block height</span><strong>#{state.blockHeight}</strong><small>{state.stats.blocksMined} block(s) mined by you</small></article>
        <article className="metric-card lavender"><div className="metric-icon"><Trophy size={16} /></div><span>Your league</span><strong>{league.name}</strong><small>Pool ×{league.poolMultiplier} · {next ? `${next.minPowerGh - power} GH/s to ${next.name}` : "Top league!"}</small></article>
        <article className="metric-card amber"><div className="metric-icon"><Blocks size={16} /></div><span>Total power</span><strong>{fmtGh(power)}</strong><small>Share of simulated network pool</small></article>
        <article className="metric-card blue"><div className="metric-icon"><SlidersHorizontal size={16} /></div><span>Block interval</span><strong>{state.blockIntervalSec}s</strong><small>Accelerated for demo · real RollerCoin ≈ 10 min</small></article>
      </div>

      <div className="overview-grid">
        <section className="panel">
          <SectionTitle eyebrow="POWER ALLOCATION" title="Allocate power per coin" />
          <p className="rc-muted">Your total power is split across coins. Changing one slider rescales the others so the total stays 100%.</p>
          {COIN_IDS.map((id) => (
            <label className="rc-slider" key={id}>
              <span>{COINS[id].name} ({id}) — <b>{state.allocations[id]}%</b> · next block ≈ {fmtCoin(preview.rewards[id] ?? 0, COINS[id].decimals)} {id}</span>
              <input type="range" min={0} max={100} value={state.allocations[id]} onChange={(e) => onAllocation(id, Number(e.target.value))} />
            </label>
          ))}
          <div className="rc-row">
            <span className="rc-muted">Block interval:</span>
            {[30, 60, 120, 300].map((sec) => (
              <button key={sec} className={state.blockIntervalSec === sec ? "primary-button" : "secondary-button"} onClick={() => onInterval(sec)}>
                {sec >= 60 ? `${sec / 60} min` : `${sec}s`}
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <SectionTitle eyebrow="LEAGUE LADDER" title="Leagues" />
          {LEAGUES.map((l) => (
            <div className="rack-row" key={l.id}>
              <div><strong style={{ color: l.color }}>{l.name}</strong><small>From {l.minPowerGh.toLocaleString()} GH/s · pool ×{l.poolMultiplier}</small></div>
              {league.id === l.id ? <Badge>YOU</Badge> : next?.id === l.id ? <Badge tone="amber">NEXT</Badge> : <span className="rc-muted">—</span>}
            </div>
          ))}
          <p className="rc-muted">Higher leagues multiply every coin&apos;s block reward pool. League is set by your permanent power (miners), not temporary boosts.</p>
        </section>
      </div>

      <section className="panel">
        <SectionTitle eyebrow="BLOCK HISTORY" title="Recent blocks" action={<Badge>{state.blockHistory.length} shown</Badge>} />
        {state.blockHistory.length === 0 ? (
          <p className="rc-muted">No blocks yet — the first block closes in {mm}:{ss}. Keep your miners on and play mini-games for a bigger share.</p>
        ) : (
          state.blockHistory.map((b) => (
            <div className="rack-row" key={b.height}>
              <div>
                <strong>Block #{b.height} · {b.league} league</strong>
                <small>{new Date(b.at).toLocaleTimeString("en-GB")} · power {fmtGh(b.totalPowerGh)} · +{b.rltBonus.toFixed(1)} RLT</small>
              </div>
              <b>{COIN_IDS.filter((c) => b.rewards[c]).map((c) => `${fmtCoin(b.rewards[c]!, COINS[c].decimals)} ${c}`).join(" · ") || "—"}</b>
            </div>
          ))
        )}
      </section>
    </>
  );
}
