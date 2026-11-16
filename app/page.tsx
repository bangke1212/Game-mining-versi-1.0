"use client";
import { useEffect, useRef, useState } from "react";
import {
  Activity, Blocks, Bolt, Check, ChevronRight, CircleDollarSign, Cpu, Gamepad2, LayoutDashboard,
  List, Menu, Pause, Play, Radio, RotateCcw, Settings2, ShieldCheck, ShoppingCart, Trophy,
  Wallet, X, Zap,
} from "lucide-react";
import RigRack from "@/components/rollercoin/RigRack";
import LiveTelemetry from "@/components/rollercoin/LiveTelemetry";
import MiningRoom from "@/components/rollercoin/MiningRoom";
import Shop from "@/components/rollercoin/Shop";
import MiniGames from "@/components/rollercoin/MiniGames";
import WalletView from "@/components/rollercoin/Wallet";
import LeagueView from "@/components/rollercoin/League";
import { Badge, MetricCard, SectionTitle, fmtGh, fmtRlt } from "@/components/rollercoin/ui";
import { COINS } from "@/lib/rollercoin/catalog";
import {
  applyBlock, applyMiniGameResult, buyMiner, buyRack, claimDailyLogin, claimQuestBlocks,
  claimQuestGames, expandRoom, leagueFor, permanentPower, previewBlockRewards, seedState,
  sellMiner, setAllocation, tempPowerNow, toggleMiner, totalPower,
} from "@/lib/rollercoin/engine";
import { clearState, loadState, saveState } from "@/lib/rollercoin/storage";
import type { GameState, MiniGameResult } from "@/lib/rollercoin/types";
import { COIN_IDS } from "@/lib/rollercoin/types";

type Page = "overview" | "room" | "shop" | "games" | "wallet" | "league" | "settings" | "events";

const nav: { id: Page; label: string; icon: typeof Activity; short: string }[] = [
  { id: "overview", label: "Mining Overview", icon: LayoutDashboard, short: "Overview" },
  { id: "room", label: "Mining Room", icon: Cpu, short: "Room" },
  { id: "shop", label: "Miner Shop", icon: ShoppingCart, short: "Shop" },
  { id: "games", label: "Mini-Games", icon: Gamepad2, short: "Games" },
  { id: "wallet", label: "Wallet & Quests", icon: Wallet, short: "Wallet" },
  { id: "league", label: "Blocks & Leagues", icon: Trophy, short: "League" },
  { id: "settings", label: "Settings", icon: Settings2, short: "Settings" },
  { id: "events", label: "Event Log", icon: List, short: "Events" },
];

export default function HomePage() {
  const [page, setPage] = useState<Page>("overview");
  const [menu, setMenu] = useState(false);
  const [state, setState] = useState<GameState>(() => seedState());
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    setState(loadState());
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) saveState(state); }, [state, loaded]);

  // 1-second tick: countdown + block close.
  useEffect(() => {
    const timer = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      const s = stateRef.current;
      if (!s.paused && t >= s.nextBlockAt) setState(applyBlock(s, t));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const update = (fn: (s: GameState) => GameState) => setState((s) => fn(s));
  const attempt = (fn: (s: GameState) => { state: GameState; error?: string }): string | undefined => {
    const r = fn(stateRef.current);
    if (!r.error) setState(r.state);
    return r.error;
  };

  const secondsToBlock = Math.max(0, Math.ceil((state.nextBlockAt - now) / 1000));
  const power = totalPower(state, now);
  const league = leagueFor(permanentPower(state));
  const preview = previewBlockRewards(state, now);
  const current = nav.find((n) => n.id === page)!;
  const reset = () => {
    if (confirm("Reset game and start over with a fresh starter miner? (Simulated progress will be lost)")) {
      clearState();
      setState(seedState());
      setPage("overview");
    }
  };

  return (
    <main className="app-shell">
      <div className="simulation-banner">
        <Radio size={14} /> SIMULATION MODE — NO REAL CRYPTO · NO REAL MONEY · NO REAL WITHDRAWAL
        <span>RollerCoin-like concept · all values virtual</span>
      </div>
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><span>⛏️</span></div>
          <div><strong>ROLLER-MINE<br /><em>SIMULATOR</em></strong><small>MINING GAME · v1.0</small></div>
          <button className="close-menu" onClick={() => setMenu(false)}><X size={18} /></button>
        </div>
        <div className="mission-status">
          <span>MINING POWER</span>
          <strong><i />{fmtGh(power)}</strong>
          <small>{league.name} league · {fmtRlt(state.rlt)}</small>
        </div>
        <nav>
          <span className="nav-label">GAME MENU</span>
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={page === item.id ? "active" : ""} onClick={() => { setPage(item.id); setMenu(false); }}>
                <Icon size={16} />{item.label}
                {item.id === "league" && secondsToBlock <= 10 && <b>{secondsToBlock}s</b>}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="sync"><i /> Local save · localStorage<small>Refresh keeps your progress</small></div>
          <button className="reset-link" onClick={reset}><RotateCcw size={13} /> Reset game</button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMenu(true)}><Menu size={21} /></button>
          <div><span className="eyebrow">ROLLER-MINE SIMULATOR / {current.short.toUpperCase()}</span><h1>{current.label}</h1></div>
          <div className="top-actions">
            <Badge tone={state.paused ? "amber" : "mint"}>{state.paused ? "PAUSED" : "LIVE"}</Badge>
            <button className="icon-button" onClick={() => update((s) => ({ ...s, paused: !s.paused }))}>{state.paused ? <Play size={16} /> : <Pause size={16} />}</button>
            <div className="operator">⛏️</div>
          </div>
        </header>

        <div className="content">
          {!loaded ? (
            <div className="panel"><p className="rc-muted">Loading your rig…</p></div>
          ) : (
            <>
          {page === "overview" && (
            <Overview state={state} now={now} secondsToBlock={secondsToBlock} setPage={setPage} />
          )}
          {page === "room" && (
            <MiningRoom state={state} now={now} secondsToBlock={secondsToBlock} onToggle={(uid) => update((s) => toggleMiner(s, uid))} onSell={(uid) => update((s) => sellMiner(s, uid).state)} />
          )}
          {page === "shop" && (
            <Shop state={state} onBuyMiner={(id) => attempt((s) => buyMiner(s, id))} onBuyRack={(id) => attempt((s) => buyRack(s, id))} onExpandRoom={() => attempt((s) => expandRoom(s))} />
          )}
          {page === "games" && (
            <MiniGames onReward={(r: MiniGameResult) => update((s) => applyMiniGameResult(s, r))} />
          )}
          {page === "wallet" && (
            <WalletView
              state={state}
              onClaimDaily={() => attempt((s) => claimDailyLogin(s))}
              onClaimQuestGames={() => attempt((s) => claimQuestGames(s))}
              onClaimQuestBlocks={() => attempt((s) => claimQuestBlocks(s))}
            />
          )}
          {page === "league" && (
            <LeagueView
              state={state}
              secondsToBlock={secondsToBlock}
              onAllocation={(coin, pct) => update((s) => setAllocation(s, coin, pct))}
              onInterval={(sec) => update((s) => ({ ...s, blockIntervalSec: sec, nextBlockAt: Date.now() + sec * 1000 }))}
            />
          )}
          {page === "settings" && <SettingsView state={state} onPause={() => update((s) => ({ ...s, paused: !s.paused }))} onReset={reset} onInterval={(sec) => update((s) => ({ ...s, blockIntervalSec: sec, nextBlockAt: Date.now() + sec * 1000 }))} />}
          {page === "events" && (
            <>
              <SectionTitle eyebrow="AUDIT TRAIL" title="Event log" action={<Badge>{state.events.length} EVENTS</Badge>} />
              <section className="panel event-log">
                {state.events.map((e) => (
                  <div className="log-row" key={e.id}><time>{e.time}</time><span className={`log-kind ${e.level}`}>{e.kind}</span><p>{e.text}</p><ChevronRight size={14} /></div>
                ))}
              </section>
            </>
          )}
            </>
          )}
          <footer>
            <span>ROLLER-MINE SIMULATOR · INSPIRED BY THE ROLLERCOIN MINING CONCEPT · SIMULATED ENVIRONMENT</span>
            <span><ShieldCheck size={13} /> No wallet · No payments · No real crypto</span>
          </footer>
        </div>
      </section>
    </main>
  );
}

function Overview({ state, now, secondsToBlock, setPage }: { state: GameState; now: number; secondsToBlock: number; setPage: (p: Page) => void }) {
  const power = totalPower(state, now);
  const league = leagueFor(permanentPower(state));
  const preview = previewBlockRewards(state, now);
  const mm = Math.floor(secondsToBlock / 60);
  const ss = String(secondsToBlock % 60).padStart(2, "0");
  const latest = state.blockHistory[0];
  return (
    <>
      <div className="hero">
        <div>
          <span className="eyebrow">SIMULATION MODE · PLAY, MINE, UPGRADE — NOTHING HERE IS REAL CRYPTO</span>
          <h2>Build your rig,<br /><em>mine the blocks.</em></h2>
          <p>Play mini-games for temporary power, buy virtual miners for permanent power, split your power across coins, and collect your share of every simulated block.</p>
        </div>
        <div className="hero-readout"><span>NEXT BLOCK</span><strong>{mm}:{ss}</strong><small><i /> Block #{state.blockHeight + 1} closing soon</small></div>
      </div>
      <div className="metric-grid">
        <MetricCard label="Total mining power" value={fmtGh(power)} sub={`${league.name} league · pool ×${league.poolMultiplier}`} icon={Zap} />
        <MetricCard label="RLT balance" value={fmtRlt(state.rlt)} sub="In-game currency · spend in Shop" icon={CircleDollarSign} tone="lavender" />
        <MetricCard label="Blocks mined" value={String(state.stats.blocksMined)} sub={`Next block in ${mm}:${ss}`} icon={Blocks} tone="amber" />
        <MetricCard label="Temporary power" value={fmtGh(tempPowerNow(state, now))} sub="From mini-games · expires" icon={Bolt} tone="blue" />
      </div>
      <LiveTelemetry state={state} now={now} secondsToBlock={secondsToBlock} showMiners={false} />
      <div className="overview-grid">
        <section className="panel">
          <SectionTitle eyebrow="NEXT BLOCK PREVIEW" title="Your share of the next block" action={<button className="text-button" onClick={() => setPage("league")}>Allocate power <ChevronRight size={14} /></button>} />
          {COIN_IDS.map((id) => (
            <div className="rack-row" key={id}>
              <div><strong>{COINS[id].name} ({id})</strong><small>{state.allocations[id]}% of your power</small></div>
              <b>≈ {(preview.rewards[id] ?? 0).toFixed(COINS[id].decimals > 4 ? 6 : 4)} {id}</b>
            </div>
          ))}
          <p className="rc-muted">Preview only — the real share depends on your power when the block closes. Block interval is {state.blockIntervalSec}s (accelerated for demo; the real RollerCoin concept closes blocks roughly every 10 minutes).</p>
        </section>
        <section className="panel">
          <SectionTitle eyebrow="LATEST BLOCK" title="Chain pulse" action={<button className="text-button" onClick={() => setPage("league")}>All blocks <ChevronRight size={14} /></button>} />
          {latest ? (
            <>
              <div className="block-hero"><div className="block-orb"><Blocks size={22} /></div><div><span>HEIGHT</span><strong>#{latest.height}</strong><small className="mono">{latest.league} league · {new Date(latest.at).toLocaleTimeString("en-GB")}</small></div></div>
              <div className="mini-stats">
                <div><span>RLT BONUS</span><b>+{latest.rltBonus.toFixed(1)} RLT</b></div>
                <div><span>POWER</span><b>{fmtGh(latest.totalPowerGh)}</b></div>
                <div><span>COINS</span><b>{Object.keys(latest.rewards).length} types</b></div>
              </div>
            </>
          ) : (
            <p className="rc-muted">No blocks mined yet. Your first block closes in {mm}:{ss}.</p>
          )}
          <div className="rc-row" style={{ marginTop: 16 }}>
            <button className="primary-button" onClick={() => setPage("games")}><Zap size={14} /> Play mini-games</button>
            <button className="secondary-button" onClick={() => setPage("shop")}>Buy a miner</button>
          </div>
        </section>
      </div>
      <div className="overview-grid bottom">
        <section className="panel">
          <SectionTitle eyebrow="MINING ROOM" title="Your rig at a glance" action={<button className="text-button" onClick={() => setPage("room")}>Open room <ChevronRight size={14} /></button>} />
          <RigRack state={state} now={now} compact onGoShop={() => setPage("shop")} />
        </section>
        <section className="panel event-panel">
          <SectionTitle eyebrow="EVENT LOG" title="Latest signals" action={<button className="text-button" onClick={() => setPage("events")}>View all <ChevronRight size={14} /></button>} />
          {state.events.slice(0, 4).map((e) => (
            <div className="event-row" key={e.id}><span className={`event-level ${e.level}`} /><div><strong>{e.text}</strong><small>{e.kind} · {e.time}</small></div></div>
          ))}
        </section>
      </div>
    </>
  );
}

function SettingsView({ state, onPause, onReset, onInterval }: { state: GameState; onPause: () => void; onReset: () => void; onInterval: (sec: number) => void }) {
  return (
    <>
      <SectionTitle eyebrow="CONTROL / SIMULATION" title="Settings" action={<Badge tone="lavender">{state.paused ? "PAUSED" : "LIVE"}</Badge>} />
      <div className="settings-layout">
        <section className="panel settings-panel">
          <span className="eyebrow">BLOCK INTERVAL (DEMO SPEED)</span>
          <div className="preset-row" style={{ marginTop: 10 }}>
            {[30, 60, 120, 300].map((sec) => (
              <button key={sec} className={state.blockIntervalSec === sec ? "selected" : ""} onClick={() => onInterval(sec)}>
                {sec >= 60 ? `${sec / 60} min` : `${sec}s`}
              </button>
            ))}
          </div>
          <p className="rc-muted">The real RollerCoin concept closes blocks roughly every 10 minutes. This game defaults to 60 seconds so you can actually see rewards while playing. Longer intervals feel more like the original — change it any time.</p>
          <div className="rc-row">
            <button className="secondary-button" onClick={onPause}>{state.paused ? <Play size={14} /> : <Pause size={14} />} {state.paused ? "Resume game" : "Pause game"}</button>
            <button className="secondary-button" onClick={onReset}><RotateCcw size={14} /> Reset game</button>
          </div>
          <div className="seed-note"><ShieldCheck size={15} /><span><strong>Save location</strong><small>Progress is stored in your browser&apos;s localStorage ({`rollercoin-state-v1`}). Clearing browser data resets the game.</small></span></div>
        </section>
        <section className="panel settings-side">
          <span className="eyebrow">SIMULATION CONTRACT</span>
          <h3>Safe by design</h3>
          <p>This game never connects to a blockchain, wallet, pool, or payment rail. RLT and mined coins are virtual numbers only.</p>
          <div className="contract-row"><Check size={14} /> No real mining</div>
          <div className="contract-row"><Check size={14} /> No real tokens or payouts</div>
          <div className="contract-row"><Check size={14} /> No wallet connection or seed phrase</div>
          <div className="contract-row"><Check size={14} /> No RollerCoin branding or copied assets</div>
        </section>
      </div>
    </>
  );
}
