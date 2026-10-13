"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Brain, CarFront, Coins, Gamepad2, MousePointer2, Sparkles, Timer, Trophy, X, Zap } from "lucide-react";
import { ArcadeMode, AvatarCustomization, getArcadeRewardEstimate } from "@/lib/legioncoin";
import CatAvatar from "./cat-avatar";

type MemoryCard = { id: number; symbol: string; matched: boolean; revealed: boolean };
type RaceObstacle = { id: number; lane: number; top: number };
type ArcadeHubProps = {
  dailyEarned: number;
  dailyLimit: number;
  avatar: AvatarCustomization;
  playerName: string;
  onComplete: (mode: ArcadeMode, score: number) => void;
};

const CARD_SYMBOLS = ["🐾", "💎", "⚡", "🪙"];

function makeMemoryDeck(): MemoryCard[] {
  const symbols = [...CARD_SYMBOLS, ...CARD_SYMBOLS];
  for (let index = symbols.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [symbols[index], symbols[target]] = [symbols[target], symbols[index]];
  }
  return symbols.map((symbol, id) => ({ id, symbol, matched: false, revealed: false }));
}

const formatClock = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

const GAME_INFO: Record<ArcadeMode, { title: string; subtitle: string; duration: number; reward: string }> = {
  "paw-rush": { title: "Paw Rush", subtitle: "Tangkap paw bercahaya sebanyak mungkin dalam 12 detik. Minimal 5 tangkapan untuk membuka boost power tujuh hari.", duration: 12, reward: "Sampai 10 LC + power sementara" },
  "coin-catch": { title: "Bit Catch", subtitle: "Klik koin data untuk skor. Hindari bug merah—setiap bug mengurangi skor.", duration: 20, reward: "Sampai 12 LC" },
  "memory-mine": { title: "Memory Mine", subtitle: "Cocokkan empat pasang simbol tambang sebelum waktu habis.", duration: 45, reward: "Sampai 6 LC" },
  "car-rush": { title: "Car Rush", subtitle: "Pindahkan mobil paw ke lane aman, hindari rintangan, dan lewati sebanyak mungkin dalam 20 detik.", duration: 20, reward: "Sampai 8 LC" },
};

export default function ArcadeHub({ dailyEarned, dailyLimit, avatar, playerName, onComplete }: ArcadeHubProps) {
  const [mode, setMode] = useState<ArcadeMode | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [score, setScore] = useState(0);
  const [targetType, setTargetType] = useState<"coin" | "bug">("coin");
  const [targetPosition, setTargetPosition] = useState({ left: 45, top: 42 });
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [memoryBusy, setMemoryBusy] = useState(false);
  const [raceLane, setRaceLane] = useState(1);
  const [raceObstacles, setRaceObstacles] = useState<RaceObstacle[]>([]);
  const modeRef = useRef<ArcadeMode | null>(null);
  const gameRunIdRef = useRef(0);
  const scoreRef = useRef(0);
  const finishedRef = useRef(false);
  const selectedRef = useRef<number[]>([]);
  const busyRef = useRef(false);
  const raceLaneRef = useRef(1);
  const raceObstaclesRef = useRef<RaceObstacle[]>([]);
  const raceObstacleIdRef = useRef(0);
  const raceTickRef = useRef(0);
  const dialogRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const finishGame = useCallback(() => {
    const activeMode = modeRef.current;
    if (!activeMode || finishedRef.current) return;
    finishedRef.current = true;
    modeRef.current = null;
    gameRunIdRef.current += 1;
    const finalScore = scoreRef.current;
    setMode(null);
    onComplete(activeMode, finalScore);
  }, [onComplete]);

  useEffect(() => {
    if (!mode) return;
    if (seconds <= 0) {
      finishGame();
      return;
    }
    const timer = window.setTimeout(() => setSeconds((remaining) => remaining - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [mode, seconds, finishGame]);

  useEffect(() => {
    if (!mode) return;
    closeButtonRef.current?.focus();
    const handleDialogKeys = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        finishGame();
        return;
      }
      if (modeRef.current === "car-rush" && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
        event.preventDefault();
        moveRaceLane(event.key === "ArrowLeft" ? -1 : 1);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input:not(:disabled), [tabindex]:not([tabindex="-1"])') || []);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first) {
        event.preventDefault();
        dialogRef.current?.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleDialogKeys);
    return () => {
      window.removeEventListener("keydown", handleDialogKeys);
      openerRef.current?.focus();
    };
  }, [mode, finishGame]);

  useEffect(() => {
    if (mode !== "car-rush") return;
    const timer = window.setInterval(() => {
      raceTickRef.current += 1;
      const next = raceObstaclesRef.current
        .map((obstacle) => ({ ...obstacle, top: obstacle.top + 7 }))
        .filter((obstacle) => {
          const collides = obstacle.top >= 78 && obstacle.top <= 94 && obstacle.lane === raceLaneRef.current;
          if (collides) updateScore(scoreRef.current - 2);
          const passed = obstacle.top > 100;
          if (passed && !collides) updateScore(scoreRef.current + 1);
          return !collides && !passed;
        });
      if (raceTickRef.current % 5 === 0) {
        next.push({ id: ++raceObstacleIdRef.current, lane: Math.floor(Math.random() * 3), top: -10 });
      }
      raceObstaclesRef.current = next;
      setRaceObstacles(next);
    }, 140);
    return () => window.clearInterval(timer);
  }, [mode]);

  function moveRaceLane(delta: number) {
    if (modeRef.current !== "car-rush") return;
    const nextLane = Math.max(0, Math.min(2, raceLaneRef.current + delta));
    raceLaneRef.current = nextLane;
    setRaceLane(nextLane);
  }

  function startGame(selectedMode: ArcadeMode, opener: HTMLElement | null) {
    gameRunIdRef.current += 1;
    openerRef.current = opener;
    modeRef.current = selectedMode;
    finishedRef.current = false;
    scoreRef.current = 0;
    selectedRef.current = [];
    busyRef.current = false;
    setMode(selectedMode);
    setSeconds(GAME_INFO[selectedMode].duration);
    setScore(0);
    setTargetType("coin");
    setTargetPosition({ left: 45, top: 42 });
    setCards(makeMemoryDeck());
    setSelectedIds([]);
    setMemoryBusy(false);
    raceLaneRef.current = 1;
    raceObstaclesRef.current = [];
    raceObstacleIdRef.current = 0;
    raceTickRef.current = 0;
    setRaceLane(1);
    setRaceObstacles([]);
  }

  function updateScore(nextScore: number) {
    const safeScore = Math.max(0, nextScore);
    scoreRef.current = safeScore;
    setScore(safeScore);
  }

  function tapTarget() {
    const activeMode = modeRef.current;
    if (!activeMode || activeMode === "memory-mine") return;
    if (activeMode === "paw-rush") {
      updateScore(scoreRef.current + 1);
    } else if (targetType === "coin") {
      updateScore(scoreRef.current + 1);
    } else {
      updateScore(scoreRef.current - 2);
    }
    setTargetPosition({ left: 6 + Math.random() * 78, top: 9 + Math.random() * 70 });
    if (activeMode === "coin-catch") setTargetType(Math.random() < 0.27 ? "bug" : "coin");
  }

  function chooseMemoryCard(cardId: number) {
    if (modeRef.current !== "memory-mine" || busyRef.current) return;
    const card = cards.find((item) => item.id === cardId);
    if (!card || card.matched || card.revealed) return;
    const selected = selectedRef.current;
    setCards((current) => current.map((item) => item.id === cardId ? { ...item, revealed: true } : item));

    if (selected.length === 0) {
      selectedRef.current = [cardId];
      setSelectedIds([cardId]);
      return;
    }

    const firstId = selected[0];
    const firstCard = cards.find((item) => item.id === firstId);
    const pairIds = [firstId, cardId];
    selectedRef.current = pairIds;
    setSelectedIds(pairIds);
    busyRef.current = true;
    setMemoryBusy(true);

    if (firstCard?.symbol === card.symbol) {
      const pairsFound = scoreRef.current + 1;
      const runId = gameRunIdRef.current;
      updateScore(pairsFound);
      setCards((current) => current.map((item) => pairIds.includes(item.id) ? { ...item, revealed: true, matched: true } : item));
      window.setTimeout(() => {
        if (gameRunIdRef.current !== runId || modeRef.current !== "memory-mine") return;
        selectedRef.current = [];
        setSelectedIds([]);
        busyRef.current = false;
        setMemoryBusy(false);
        if (pairsFound === CARD_SYMBOLS.length) finishGame();
      }, 420);
      return;
    }

    const runId = gameRunIdRef.current;
    window.setTimeout(() => {
      if (gameRunIdRef.current !== runId || modeRef.current !== "memory-mine") return;
      setCards((current) => current.map((item) => pairIds.includes(item.id) && !item.matched ? { ...item, revealed: false } : item));
      selectedRef.current = [];
      setSelectedIds([]);
      busyRef.current = false;
      setMemoryBusy(false);
    }, 720);
  }

  const earnedToday = Math.min(dailyLimit, Math.max(0, dailyEarned));
  const remainingToday = Math.max(0, dailyLimit - earnedToday);
  const dailyProgress = dailyLimit > 0 ? Math.min(100, (earnedToday / dailyLimit) * 100) : 0;
  const currentInfo = mode ? GAME_INFO[mode] : null;
  const estimate = mode ? getArcadeRewardEstimate(mode, score) : 0;

  return (
    <>
      <section className="arcade-section" id="arcade">
        <div className="section-heading arcade-heading">
          <div><p className="eyebrow">SEKTOR 01 / TERMINAL ARCADE</p><h2>Arcade <span>bonus LC</span></h2></div>
          <div className="arcade-heading-right"><div className="arcade-player-avatar"><CatAvatar customization={avatar} size={40} className="cat-avatar-arcade" alt={`Avatar kucing ${playerName}`} /><span><b>{playerName}</b><small>KRU AKTIF</small></span></div><span className="arcade-daily-chip"><Coins size={14} /> {dailyLimit - remainingToday}/{dailyLimit} LC HARI INI</span></div>
        </div>
        <p className="arcade-intro">Tantangan singkat menambah saldo virtual. Setiap permainan dihitung ke batas bonus harian agar ekonomi markas tetap seimbang.</p>
        <div className="arcade-daily-meter" aria-label={`Bonus arcade hari ini ${dailyLimit - remainingToday} dari ${dailyLimit} LC`}><span style={{ width: `${dailyProgress}%` }} /></div>
        <div className="arcade-card-grid">
          <article className="arcade-card arcade-paw-card">
            <div className="arcade-card-icon">🐾</div><span className="arcade-number">ARCADE / 01</span><h3>Paw Rush</h3>
            <p>{GAME_INFO["paw-rush"].subtitle}</p><div className="arcade-reward-line"><Zap size={13} /> 5+ TANGKAPAN · LC + POWER SEMENTARA</div>
            <button className="arcade-play-button" onClick={(event) => startGame("paw-rush", event.currentTarget)}><Gamepad2 size={15} /> Mainkan Paw Rush</button>
          </article>
          <article className="arcade-card arcade-coin-card">
            <div className="arcade-card-icon"><Coins size={29} /></div><span className="arcade-number">ARCADE / 02</span><h3>Bit Catch</h3>
            <p>{GAME_INFO["coin-catch"].subtitle} Waktu bermain 20 detik.</p><div className="arcade-reward-line"><Sparkles size={13} /> SAMPAI 12 LC · KOIN +1 / BUG −2</div>
            <button className="arcade-play-button" onClick={(event) => startGame("coin-catch", event.currentTarget)}><MousePointer2 size={15} /> Tangkap bit</button>
          </article>
          <article className="arcade-card arcade-memory-card">
            <div className="arcade-card-icon"><Brain size={28} /></div><span className="arcade-number">ARCADE / 03</span><h3>Memory Mine</h3>
            <p>{GAME_INFO["memory-mine"].subtitle} Waktu bermain 45 detik.</p><div className="arcade-reward-line"><Trophy size={13} /> 1,5 LC PER PASANGAN · MAKS. 6 LC</div>
            <button className="arcade-play-button" onClick={(event) => startGame("memory-mine", event.currentTarget)}><Brain size={15} /> Mulai memori</button>
          </article>
          <article className="arcade-card arcade-race-card">
            <div className="arcade-card-icon"><CarFront size={28} /></div><span className="arcade-number">ARCADE / 04</span><h3>Car Rush</h3>
            <p>{GAME_INFO["car-rush"].subtitle}</p><div className="arcade-reward-line"><CarFront size={13} /> LEWATI MOBIL · HINDARI RINTANGAN · MAKS. 8 LC</div>
            <button className="arcade-play-button" onClick={(event) => startGame("car-rush", event.currentTarget)}><CarFront size={15} /> Balapan sekarang</button>
          </article>
        </div>
        <div className="arcade-footnote"><Timer size={14} /><span>Bonus tersisa hari ini: <b>{remainingToday.toLocaleString("id-ID")} LC</b>. Saldo dan hasil hanya tersimpan lokal di browser ini; tidak ada nilai uang atau penarikan.</span></div>
      </section>

      {mode && currentInfo && <div className="modal-backdrop" role="presentation">
        <section ref={dialogRef} className="minigame-modal arcade-modal" role="dialog" aria-modal="true" aria-labelledby="minigame-title" tabIndex={-1}>
          <header className="modal-head"><div className="modal-player-title"><CatAvatar customization={avatar} size={42} className="cat-avatar-arcade" alt={`Avatar kucing ${playerName}`} /><div><span className="section-label"><Gamepad2 size={13} /> TANTANGAN ARCADE / {currentInfo.duration} DETIK</span><h2 id="minigame-title">{currentInfo.title}</h2></div></div><button ref={closeButtonRef} className="modal-close" onClick={finishGame} aria-label="Akhiri tantangan"><X size={19} /></button></header>
          <div className="game-scorebar"><span><Trophy size={15} /> {mode === "memory-mine" ? "PASANGAN" : "SKOR"} <b>{score}</b></span><span className="timer-chip"><Timer size={14} /> {formatClock(seconds)}</span></div>
          {mode === "memory-mine" ? <div className="memory-arena">
            <p>BUKA DUA KARTU DAN TEMUKAN SIMBOL YANG SAMA</p>
            <div className="memory-grid">{cards.map((card) => <button key={card.id} className={`memory-card ${card.revealed ? "memory-revealed" : ""} ${card.matched ? "memory-matched" : ""}`} onClick={() => chooseMemoryCard(card.id)} disabled={card.matched || memoryBusy} aria-label={card.revealed || card.matched ? `Kartu ${card.symbol}` : "Buka kartu"}>{card.revealed || card.matched ? card.symbol : "?"}</button>)}</div>
            <div className="arena-hint">Pasangan ditemukan: {score}/{CARD_SYMBOLS.length}</div>
          </div> : mode === "car-rush" ? <div className="race-arena">
            <div className="race-skyline">✦　·　✧　·　✦</div><p>PINDAHKAN MOBIL KE LANE AMAN</p>
            <div className="race-road">{[0, 1, 2].map((lane) => <div className="race-lane" key={lane} />)}
              {raceObstacles.map((obstacle) => <span className="race-obstacle" key={obstacle.id} style={{ left: `${18 + obstacle.lane * 32}%`, top: `${obstacle.top}%` }} aria-hidden="true">🚧</span>)}
              <span className="race-player" style={{ left: `${18 + raceLane * 32}%` }} aria-label="Mobil pemain">🚗</span>
            </div>
            <div className="race-controls"><button type="button" onClick={() => moveRaceLane(-1)} disabled={raceLane === 0} aria-label="Pindah ke lane kiri"><ArrowLeft size={16} /></button><span>← → / tombol lane</span><button type="button" onClick={() => moveRaceLane(1)} disabled={raceLane === 2} aria-label="Pindah ke lane kanan"><ArrowRight size={16} /></button></div>
            <div className="arena-hint">Lewati rintangan untuk +1 skor · tabrak rintangan −2 skor</div>
          </div> : <div className={`paw-arena ${mode === "coin-catch" ? "coin-catch-arena" : ""}`}>
            <div className="arena-stars">✦　·　✧　·　✦</div><p>{mode === "paw-rush" ? "TANGKAP PAW YANG MENYALA!" : "AMBIL KOIN · HINDARI BUG!"}</p>
            <button className={`paw-target ${mode === "coin-catch" && targetType === "bug" ? "paw-target-bug" : ""}`} style={{ left: `${targetPosition.left}%`, top: `${targetPosition.top}%` }} onClick={tapTarget} aria-label={mode === "paw-rush" ? "Tangkap paw bercahaya" : targetType === "coin" ? "Tangkap koin data" : "Bug data, hindari"}>{mode === "paw-rush" ? "🐾" : targetType === "coin" ? "🪙" : "🪲"}</button>
            <div className="arena-hint">{mode === "paw-rush" ? "Setiap tangkapan menaikkan skor dan power" : "Koin data +1 · bug data −2"}</div>
          </div>}
          <div className="modal-footer"><span>{mode === "paw-rush" ? "POWER SEMENTARA BERLAKU 7 HARI" : "HADIAH LC VIRTUAL · BATAS HARIAN BERLAKU"}</span><b>+{estimate.toLocaleString("id-ID", { maximumFractionDigits: 2 })} LC <small>ESTIMASI</small></b></div>
        </section>
      </div>}
    </>
  );
}
