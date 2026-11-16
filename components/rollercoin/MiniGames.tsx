"use client";
import { useEffect, useRef, useState } from "react";
import { Brain, Gamepad2, MousePointerClick, Timer } from "lucide-react";
import type { MiniGameResult } from "@/lib/rollercoin/types";
import { Badge, SectionTitle } from "./ui";

type Tab = "clicker" | "memory" | "reaction";

/* ---------- Clicker ---------- */
function ClickerGame({ onReward }: { onReward: (r: MiniGameResult) => void }) {
  const [clicks, setClicks] = useState(0);
  const [left, setLeft] = useState(0);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const start = () => {
    setClicks(0); setDone(false); setLeft(30);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setLeft((v) => {
        if (v <= 1) {
          if (timer.current) clearInterval(timer.current);
          setDone(true);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
  };
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);
  const finish = () => {
    const gh = Math.min(200, clicks * 2);
    onReward({ tempGh: gh, tempMinutes: 10, rltBonus: Math.floor(clicks / 2), source: "Clicker Rush", summary: `Clicker Rush: ${clicks} clicks` });
  };
  return (
    <div className="rc-game">
      <h3><MousePointerClick size={16} /> Clicker Rush — 30 seconds</h3>
      <p className="rc-muted">Click the big button as fast as you can. Every click = +2 GH/s temporary power for 10 minutes.</p>
      <div className="rc-big">{clicks} clicks</div>
      <div className="rc-muted"><Timer size={13} /> {left > 0 ? `${left}s left` : done ? "Time up!" : "Press start"}</div>
      <div className="rc-row">
        {left === 0 && !done && <button className="primary-button" onClick={start}>Start</button>}
        {left > 0 && <button className="rc-click-btn" onClick={() => setClicks((c) => c + 1)}>⛏️ MINE!</button>}
        {done && <button className="primary-button" onClick={finish}>Claim +{Math.min(200, clicks * 2)} GH/s · +{Math.floor(clicks / 2)} RLT</button>}
        {done && <button className="secondary-button" onClick={start}>Play again</button>}
      </div>
    </div>
  );
}

/* ---------- Memory ---------- */
const SYMBOLS = ["⛏️", "💎", "🪙", "⚡", "🔶", "💰", "🧱", "👑"];
function shuffledDeck(): { id: number; sym: string; matched: boolean }[] {
  const deck = [...SYMBOLS, ...SYMBOLS].map((sym, i) => ({ id: i, sym, matched: false }));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
function MemoryGame({ onReward }: { onReward: (r: MiniGameResult) => void }) {
  const [deck, setDeck] = useState(shuffledDeck);
  const [open, setOpen] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const flip = (id: number) => {
    if (won || open.length >= 2 || open.includes(id) || deck.find((c) => c.id === id)?.matched) return;
    const nextOpen = [...open, id];
    setOpen(nextOpen);
    if (nextOpen.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = nextOpen.map((x) => deck.find((c) => c.id === x)!);
      if (a.sym === b.sym) {
        const nd = deck.map((c) => (c.sym === a.sym ? { ...c, matched: true } : c));
        setDeck(nd);
        setOpen([]);
        if (nd.every((c) => c.matched)) setWon(true);
      } else {
        setTimeout(() => setOpen([]), 700);
      }
    }
  };
  const reset = () => { setDeck(shuffledDeck()); setOpen([]); setMoves(0); setWon(false); setClaimed(false); };
  const claim = () => {
    setClaimed(true);
    onReward({ tempGh: 80, tempMinutes: 10, rltBonus: 20, source: "Memory Match", summary: `Memory Match won in ${moves} moves` });
  };
  return (
    <div className="rc-game">
      <h3><Brain size={16} /> Memory Match</h3>
      <p className="rc-muted">Find all 8 pairs. Win = +80 GH/s for 10 minutes + 20 RLT. Moves: {moves}</p>
      <div className="rc-memory">
        {deck.map((c) => (
          <button key={c.id} className={`rc-card ${c.matched || open.includes(c.id) ? "open" : ""}`} onClick={() => flip(c.id)}>
            {c.matched || open.includes(c.id) ? c.sym : "?"}
          </button>
        ))}
      </div>
      <div className="rc-row">
        {won && !claimed && <button className="primary-button" onClick={claim}>Claim +80 GH/s · +20 RLT</button>}
        {won && claimed && <span className="rc-muted">Reward claimed — play again for another boost.</span>}
        <button className="secondary-button" onClick={reset}>Restart</button>
      </div>
    </div>
  );
}

/* ---------- Reaction ---------- */
function ReactionGame({ onReward }: { onReward: (r: MiniGameResult) => void }) {
  const [phase, setPhase] = useState<"idle" | "wait" | "go" | "done">("idle");
  const [times, setTimes] = useState<number[]>([]);
  const [msg, setMsg] = useState("Press start, wait for green, then click fast!");
  const startAt = useRef(0);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timeout.current) clearTimeout(timeout.current); }, []);
  const startRound = () => {
    setPhase("wait"); setMsg("Wait for green…");
    timeout.current = setTimeout(() => { startAt.current = performance.now(); setPhase("go"); setMsg("CLICK NOW!"); }, 800 + Math.random() * 2000);
  };
  const click = () => {
    if (phase === "wait") {
      if (timeout.current) clearTimeout(timeout.current);
      setMsg("Too early! Start the round again."); setPhase("idle");
      return;
    }
    if (phase !== "go") return;
    const ms = Math.round(performance.now() - startAt.current);
    const next = [...times, ms];
    setTimes(next);
    if (next.length >= 5) { setPhase("done"); setMsg(`Done! Average ${Math.round(next.reduce((a, b) => a + b, 0) / next.length)} ms`); }
    else { setPhase("idle"); setMsg(`Round ${next.length}/5: ${ms} ms — nice! Start next round.`); }
  };
  const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
  const gh = avg === 0 ? 0 : avg < 250 ? 120 : avg < 350 ? 80 : 40;
  const claim = () => {
    onReward({ tempGh: gh, tempMinutes: 10, rltBonus: 15, source: "Reaction Rush", summary: `Reaction Rush: avg ${avg} ms over 5 rounds` });
    setTimes([]); setPhase("idle"); setMsg("Reward claimed — play again for another boost.");
  };
  return (
    <div className="rc-game">
      <h3><Timer size={16} /> Reaction Rush — 5 rounds</h3>
      <p className="rc-muted">Faster average = more power. Under 250 ms = 120 GH/s, under 350 ms = 80 GH/s, else 40 GH/s (10 min) + 15 RLT.</p>
      <div className="rc-muted">Times: {times.length ? times.map((t) => `${t} ms`).join(" · ") : "—"}</div>
      <button className={`rc-react ${phase === "go" ? "go" : phase === "wait" ? "wait" : ""}`} onClick={click} disabled={phase === "done"}>
        {phase === "go" ? "CLICK!" : phase === "wait" ? "WAIT…" : msg}
      </button>
      <div className="rc-row">
        {phase === "idle" && times.length < 5 && <button className="primary-button" onClick={startRound}>{times.length === 0 ? "Start" : "Next round"}</button>}
        {phase === "done" && <button className="primary-button" onClick={claim}>Claim +{gh} GH/s · +15 RLT</button>}
        {phase === "done" && <button className="secondary-button" onClick={() => { setTimes([]); setPhase("idle"); setMsg("Press start, wait for green, then click fast!"); }}>Play again</button>}
      </div>
    </div>
  );
}

export default function MiniGames({ onReward }: { onReward: (r: MiniGameResult) => void }) {
  const [tab, setTab] = useState<Tab>("clicker");
  const [toast, setToast] = useState("");
  const reward = (r: MiniGameResult) => { onReward(r); setToast(`${r.summary} — reward applied!`); };
  return (
    <>
      <SectionTitle eyebrow="MINI-GAMES / EARN TEMPORARY POWER" title="Mini-games" action={<Badge tone="amber">Power expires — play often</Badge>} />
      {toast && <div className="rc-note">{toast}</div>}
      <p className="rc-muted">Like RollerCoin, arcade mini-games earn <b>temporary</b> mining power plus a small RLT bonus. Temporary power boosts your share of the next blocks until it expires.</p>
      <div className="rc-tabs">
        <button className={tab === "clicker" ? "selected" : ""} onClick={() => setTab("clicker")}><MousePointerClick size={14} /> Clicker Rush</button>
        <button className={tab === "memory" ? "selected" : ""} onClick={() => setTab("memory")}><Brain size={14} /> Memory Match</button>
        <button className={tab === "reaction" ? "selected" : ""} onClick={() => setTab("reaction")}><Timer size={14} /> Reaction Rush</button>
      </div>
      <section className="panel">
        {tab === "clicker" && <ClickerGame onReward={reward} />}
        {tab === "memory" && <MemoryGame onReward={reward} />}
        {tab === "reaction" && <ReactionGame onReward={reward} />}
      </section>
      <p className="rc-muted"><Gamepad2 size={13} /> Tip: play 3 mini-games a day to complete the daily quest (+50 RLT) in the Wallet / Quests tab.</p>
    </>
  );
}
