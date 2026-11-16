"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, Fan, Gauge, Thermometer, Zap } from "lucide-react";
import { computeTelemetry, fmtClock, fmtLiveGh, fmtTemp, fmtTimeOfDay, fmtUptime, fmtWatts } from "@/lib/rollercoin/telemetry";
import type { GameState } from "@/lib/rollercoin/types";
import { Badge, SectionTitle } from "./ui";

const HISTORY_MAX = 60;

function useSparkHistory(liveTotalGh: number, now: number) {
  const ref = useRef<number[]>([]);
  const [, setTick] = useState(0);
  useEffect(() => {
    ref.current = [...ref.current, liveTotalGh].slice(-HISTORY_MAX);
    setTick((t) => t + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now]);
  return ref.current;
}

function Sparkline({ values }: { values: number[] }) {
  const { line, area, min, max } = useMemo(() => {
    if (values.length < 2) return { line: "", area: "", min: 0, max: 0 };
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const span = hi - lo || 1;
    const pts = values.map((v, i) => {
      const x = (i / (HISTORY_MAX - 1)) * 100;
      const y = 38 - ((v - lo) / span) * 34;
      return [x, y] as const;
    });
    const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
    return { line, area: `0,40 ${line} 100,40`, min: lo, max: hi };
  }, [values]);
  if (values.length < 2) {
    return <div className="telemetry-spark-empty">Collecting live samples…</div>;
  }
  return (
    <div className="telemetry-spark-wrap">
      <svg className="telemetry-spark" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
        <line x1="0" y1="10" x2="100" y2="10" className="telemetry-grid-line" />
        <line x1="0" y1="20" x2="100" y2="20" className="telemetry-grid-line" />
        <line x1="0" y1="30" x2="100" y2="30" className="telemetry-grid-line" />
        <polygon points={area} className="telemetry-spark-area" />
        <polyline points={line} className="telemetry-spark-line" />
      </svg>
      <div className="telemetry-spark-labels">
        <span>MAX {max.toFixed(1)}</span>
        <span>MIN {min.toFixed(1)}</span>
      </div>
    </div>
  );
}

export default function LiveTelemetry({
  state,
  now,
  secondsToBlock,
  showMiners = true,
}: {
  state: GameState;
  now: number;
  secondsToBlock: number;
  showMiners?: boolean;
}) {
  const t = computeTelemetry(state, now);
  const history = useSparkHistory(t.liveTotalGh, now);
  const prevRef = useRef<number | null>(null);
  const prev = prevRef.current;
  useEffect(() => {
    prevRef.current = t.liveTotalGh;
  }, [t.liveTotalGh]);
  const delta = prev === null || prev === 0 ? 0 : ((t.liveTotalGh - prev) / prev) * 100;
  const activeBoosts = state.tempPower.filter((b) => b.expiresAt > now);

  return (
    <section className="panel telemetry-panel" aria-label="Live rig telemetry">
      <SectionTitle
        eyebrow="LIVE RIG TELEMETRY · SIMULATED"
        title="Live Rig Telemetry"
        action={
          <span className="telemetry-head">
            {state.paused ? <Badge tone="amber">PAUSED</Badge> : <Badge>LIVE</Badge>}
            <span className="telemetry-clock" title="Updated every second">
              <span className={`live-dot ${state.paused ? "paused" : ""}`} />
              {fmtTimeOfDay(now)}
            </span>
          </span>
        }
      />

      <div className="telemetry-grid">
        <article className="telemetry-card">
          <div className="telemetry-card-head"><Zap size={15} /><span>LIVE POWER</span></div>
          <strong className="telemetry-num">{fmtLiveGh(t.liveTotalGh)}</strong>
          <small className="telemetry-delta">
            {prev === null ? (
              "— starting…"
            ) : delta >= 0 ? (
              <span className="up">▲ +{delta.toFixed(1)}% vs 1s ago</span>
            ) : (
              <span className="down">▼ {delta.toFixed(1)}% vs 1s ago</span>
            )}
          </small>
          <small className="telemetry-sub">{fmtLiveGh(t.permanentLiveGh)} permanent + {fmtLiveGh(t.tempLiveGh)} boost</small>
        </article>
        <article className={`telemetry-card ${t.avgTempTone}`}>
          <div className="telemetry-card-head"><Thermometer size={15} /><span>AVG TEMP</span></div>
          <strong className="telemetry-num">{t.avgTempC === null ? "—" : fmtTemp(t.avgTempC)}</strong>
          <small className="telemetry-sub">{t.onlineCount} miner(s) running · mint &lt;60° · amber 60–68° · coral &gt;68°</small>
        </article>
        <article className="telemetry-card">
          <div className="telemetry-card-head"><Fan size={15} /><span>POWER DRAW</span></div>
          <strong className="telemetry-num">{fmtWatts(t.totalWatts)}</strong>
          <small className="telemetry-sub">Simulated draw · {t.onlineCount} of {t.totalCount} miners on</small>
        </article>
        <article className="telemetry-card">
          <div className="telemetry-card-head"><Gauge size={15} /><span>EFFICIENCY</span></div>
          <strong className="telemetry-num">{t.efficiencyGhPerW.toFixed(2)} <small>GH/W</small></strong>
          <small className="telemetry-sub">Network share {(t.networkShare * 100).toFixed(2)}% of simulated pool</small>
        </article>
      </div>

      <div className="telemetry-mid">
        <div className="telemetry-chart">
          <div className="telemetry-chart-head">
            <span><Activity size={13} /> LIVE POWER · LAST 60s</span>
            <b className="telemetry-num">{fmtLiveGh(t.liveTotalGh)}</b>
          </div>
          <Sparkline values={history} />
        </div>
        <div className="telemetry-block">
          <div className="telemetry-block-head">
            <span>NEXT BLOCK #{state.blockHeight + 1}</span>
            <b className="telemetry-num">{fmtClock(secondsToBlock)}</b>
          </div>
          <div className="telemetry-progress" role="progressbar" aria-valuenow={Math.round(t.blockProgress * 100)} aria-valuemin={0} aria-valuemax={100}>
            <i style={{ width: `${(t.blockProgress * 100).toFixed(1)}%` }} />
          </div>
          <small className="telemetry-sub">{Math.round(t.blockProgress * 100)}% to block close · interval {state.blockIntervalSec}s (simulated)</small>
          <div className="telemetry-boosts">
            <span>ACTIVE BOOSTS</span>
            {activeBoosts.length === 0 ? (
              <p className="rc-muted">No active boost. Play a mini-game to earn temporary power.</p>
            ) : (
              activeBoosts.map((b) => (
                <div className="telemetry-boost" key={b.id}>
                  <div><strong>+{b.gh} GH/s</strong><small>{b.source}</small></div>
                  <b className="telemetry-num">{fmtClock(Math.max(0, (b.expiresAt - now) / 1000))}</b>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showMiners && (
        <div className="telemetry-miners">
          <div className="telemetry-miners-head">
            <span>PER-MINER TELEMETRY</span>
            <small>{t.onlineCount} / {t.totalCount} online</small>
          </div>
          {t.miners.length === 0 ? (
            <p className="rc-muted">No miners installed yet. Buy one in the Shop.</p>
          ) : (
            <>
              <div className="telemetry-row telemetry-row-head" aria-hidden="true">
                <span>MINER</span><span>LIVE</span><span>TEMP</span><span>FAN</span><span>WATTS</span><span>UPTIME</span>
              </div>
              {t.miners.map((m) => (
                <div className="telemetry-row" key={m.uid}>
                  <div className="telemetry-miner-name" title={`${m.name} · ${m.rarity}`}>
                    <span className={`telemetry-dot ${m.on ? "on" : "off"}`} />
                    <div>
                      <strong>{m.name}</strong>
                      <small>{m.rarity} · {m.on ? "ON" : "OFF"}</small>
                    </div>
                  </div>
                  <div className="telemetry-cell"><span className="telemetry-cell-label">LIVE</span><b className="telemetry-num">{fmtLiveGh(m.liveGh)}</b><small>of {m.baseGh} GH/s</small></div>
                  <div className={`telemetry-cell ${m.tempTone}`}><span className="telemetry-cell-label">TEMP</span><b className="telemetry-num">{fmtTemp(m.tempC)}</b></div>
                  <div className="telemetry-cell"><span className="telemetry-cell-label">FAN</span><b className="telemetry-num">{m.fanRpm.toLocaleString("en-US")} <small>RPM</small></b></div>
                  <div className="telemetry-cell"><span className="telemetry-cell-label">WATTS</span><b className="telemetry-num">{fmtWatts(m.watts)}</b></div>
                  <div className="telemetry-cell"><span className="telemetry-cell-label">UPTIME</span><b className="telemetry-num">{fmtUptime(m.uptimeMs)}</b></div>
                </div>
              ))}
            </>
          )}
          <div className="telemetry-foot">
            <div className="telemetry-share-track"><i style={{ width: `${Math.max(0.4, t.networkShare * 100).toFixed(2)}%` }} /></div>
            <small>Your live power is {(t.networkShare * 100).toFixed(2)}% of the simulated network — that share decides your slice of each block reward. Values are simulated, not measured hardware.</small>
          </div>
        </div>
      )}
    </section>
  );
}
