"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, ArrowDownLeft, ArrowUpRight, BatteryCharging, Cat, Check, ChevronRight,
  CircleHelp, Clock3, Coins, Cpu, Crown, Gamepad2, Gem, HardDrive, Home, LockKeyhole,
  Menu, Pickaxe, RotateCcw, ShieldCheck, ShoppingBag, Sparkles, Star, Trophy, WifiOff, X, Zap,
} from "lucide-react";
import {
  addTemporaryPower, buyOrUpgradeMiner, createInitialSave, GameSave, getActiveTemporaryPower,
  getHourlyReward, getLeague, getPermanentPower, getPlayerShare, MINERS, normalizeSave,
  SAVE_KEY, settleOffline,
} from "@/lib/legioncoin";

const formatNumber = (value: number, digits = 0) => new Intl.NumberFormat("id-ID", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);
const formatClock = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
const formatDuration = (milliseconds: number) => {
  if (milliseconds <= 0) return "Kedaluwarsa";
  const hours = Math.ceil(milliseconds / 3_600_000);
  const days = Math.floor(hours / 24);
  return days > 0 ? `${days} hari ${hours % 24} jam` : `${hours} jam`;
};

const RIVALS = [
  { name: "MochiMancer", icon: "🐈", offset: 1.32 },
  { name: "Kapten Kumis", icon: "🐱", offset: 0.94 },
  { name: "BuluNebula", icon: "🐈‍⬛", offset: 0.73 },
  { name: "PawPilot", icon: "🐾", offset: 0.48 },
];

export default function HomePage() {
  const [save, setSave] = useState<GameSave | null>(null);
  const [toast, setToast] = useState("");
  const [now, setNow] = useState(Date.now());
  const [menuOpen, setMenuOpen] = useState(false);
  const [gameOpen, setGameOpen] = useState(false);
  const [gameSeconds, setGameSeconds] = useState(12);
  const [gameScore, setGameScore] = useState(0);
  const [pawPosition, setPawPosition] = useState({ left: 46, top: 46 });
  const [activeSection, setActiveSection] = useState("dashboard");
  const [offlineReady, setOfflineReady] = useState(false);
  const saveRef = useRef<GameSave | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const scoreRef = useRef(0);
  const finishedRef = useRef(false);

  const notify = useCallback((message: string) => {
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = window.setTimeout(() => setToast(""), 2600);
  }, []);

  useEffect(() => {
    let next: GameSave;
    try {
      const stored = localStorage.getItem(SAVE_KEY);
      const loaded = stored ? normalizeSave(JSON.parse(stored), Date.now()) : createInitialSave(Date.now());
      next = settleOffline(loaded, Date.now());
    } catch {
      next = createInitialSave(Date.now());
      notify("Save lokal tidak terbaca; petualangan baru dimulai.");
    }
    saveRef.current = next;
    setSave(next);
    localStorage.setItem(SAVE_KEY, JSON.stringify(next));
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then(() => navigator.serviceWorker.ready).then(() => setOfflineReady(true)).catch(() => setOfflineReady(false));
    }
  }, [notify]);

  useEffect(() => {
    if (save) localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  }, [save]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const stamp = Date.now();
      setNow(stamp);
      const current = saveRef.current;
      if (current) {
        const next = settleOffline(current, stamp);
        saveRef.current = next;
        setSave(next);
      }
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  const finishMiniGame = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const finalScore = scoreRef.current;
    setGameOpen(false);
    const current = saveRef.current;
    if (current) {
      const next = addTemporaryPower(current, finalScore, Date.now());
      saveRef.current = next;
      setSave(next);
    }
    notify(`Paw Rush selesai! Power sementara +${Math.max(8, Math.round(8 + Math.min(100, finalScore) * 2.4))} TH/s`);
  }, [notify]);

  useEffect(() => {
    if (!gameOpen) return;
    const timer = window.setInterval(() => {
      setGameSeconds((seconds) => {
        if (seconds <= 1) {
          window.clearInterval(timer);
          finishMiniGame();
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [gameOpen, finishMiniGame]);

  useEffect(() => {
    const sections = ["dashboard", "rigs", "league", "market", "wallet"];
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveSection(visible.target.id);
    }, { rootMargin: "-15% 0px -70% 0px", threshold: [0, 0.2, 0.5] });
    sections.forEach((id) => { const element = document.getElementById(id); if (element) observer.observe(element); });
    return () => observer.disconnect();
  }, []);

  const permanentPower = save ? getPermanentPower(save) : 0;
  const temporaryPower = save ? getActiveTemporaryPower(save, now) : 0;
  const totalPower = permanentPower + temporaryPower;
  const { league, index: leagueIndex, next: nextLeague } = getLeague(permanentPower);
  const hourlyReward = getHourlyReward(totalPower, leagueIndex);
  const dailyReward = hourlyReward * 24;
  const poolShare = getPlayerShare(totalPower, leagueIndex);
  const progressToLeague = nextLeague ? Math.min(100, ((permanentPower - league.minPower) / (nextLeague.minPower - league.minPower)) * 100) : 100;
  const activeMiners = useMemo(() => MINERS.filter((miner) => (save?.minerLevels[miner.id] || 0) > 0), [save]);
  const rankEstimate = Math.max(1, Math.min(99, Math.round(4 + (1 - poolShare) * 18)));

  function runAction(action: (current: GameSave, time: number) => GameSave, success: string) {
    const current = saveRef.current;
    if (!current) return;
    try {
      const next = action(current, Date.now());
      saveRef.current = next;
      setSave(next);
      notify(success);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Aksi belum bisa dilakukan.");
    }
  }

  function startMiniGame() {
    scoreRef.current = 0;
    finishedRef.current = false;
    setGameScore(0);
    setGameSeconds(12);
    setPawPosition({ left: 46, top: 46 });
    setGameOpen(true);
  }

  function tapPaw() {
    if (!gameOpen) return;
    scoreRef.current += 1;
    setGameScore(scoreRef.current);
    setPawPosition({ left: 7 + Math.random() * 76, top: 12 + Math.random() * 62 });
  }

  function resetSave() {
    if (!window.confirm("Hapus save LegionCoin di perangkat ini dan mulai dari awal?")) return;
    const fresh = createInitialSave(Date.now());
    saveRef.current = fresh;
    setSave(fresh);
    localStorage.setItem(SAVE_KEY, JSON.stringify(fresh));
    notify("Save lokal direset.");
  }

  const navItems = [
    { id: "dashboard", label: "Markas", icon: Home },
    { id: "rigs", label: "Ruang Miner", icon: Cpu },
    { id: "league", label: "Liga & Pool", icon: Trophy },
    { id: "market", label: "Pasar Miner", icon: ShoppingBag },
    { id: "wallet", label: "Dompet Virtual", icon: Coins },
  ];

  return (
    <main className="game-shell">
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <a className="brand" href="#dashboard" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark"><Image src="/images/legion-cat-mascot-512.png" width={58} height={58} alt="" priority /></span>
          <span><strong>LEGION<span>COIN</span></strong><small>PAW POWER / LOCAL WORLD</small></span>
        </a>
        <div className="nav-caption">RUANG KOMANDO</div>
        <nav className="side-nav" aria-label="Navigasi game">
          {navItems.map(({ id, label, icon: Icon }, index) => (
            <a key={id} href={`#${id}`} className={`nav-link ${activeSection === id ? "nav-active" : ""}`} onClick={() => setMenuOpen(false)}>
              <Icon size={17} strokeWidth={1.8} /><span>{label}</span><small>0{index + 1}</small>
            </a>
          ))}
        </nav>
        <div className="side-divider" />
        <div className="sidebar-cat">
          <Image src="/images/legion-cat-mascot-512.png" width={128} height={128} alt="Maskot kucing LegionCoin" />
          <p>“Satu paw lagi, satu liga lebih tinggi.”</p>
          <span><i /> SISTEM VIRTUAL AKTIF</span>
        </div>
        <div className="side-bottom">
          <div className="offline-note"><WifiOff size={14} /><span>MODE OFFLINE<br /><b>{offlineReady ? "SIAP DIMAINKAN" : "SAVE DI PERANGKAT"}</b></span></div>
          <button className="reset-link" onClick={resetSave}><RotateCcw size={13} /> Reset save lokal</button>
          <small>LEGIONCOIN · BUILD 1.0</small>
        </div>
      </aside>

      {menuOpen && <button className="mobile-scrim" aria-label="Tutup menu" onClick={() => setMenuOpen(false)} />}

      <section className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu" aria-label="Buka menu" onClick={() => setMenuOpen((open) => !open)}><Menu size={19} /></button>
            <div className="crumb"><span>LEGION OUTPOST</span><ChevronRight size={13} /><b>RUANG TAMBANG</b></div>
          </div>
          <div className="topbar-right">
            <span className="save-pill"><span className="save-dot" /> {offlineReady ? "TERSIMPAN · OFFLINE READY" : "SAVE LOKAL AKTIF"}</span>
            <div className="player-chip"><span className="player-initial">{save?.playerName.slice(0, 1) || "P"}</span><span><b>{save?.playerName || "Penjelajah Paw"}</b><small>MINER · LEVEL {Math.max(1, Math.floor((save?.xp || 0) / 250) + 1)}</small></span></div>
          </div>
        </header>

        <div className="content-wrap">
          <section id="dashboard" className="welcome-row">
            <div><p className="eyebrow"><span className="eyebrow-star">✦</span> SELAMAT DATANG DI LEGION OUTPOST</p><h1>Tambang virtual.<br /><em>Petualangan nyata.</em></h1><p className="welcome-copy">Mainkan mini-game, kumpulkan power, dan naiki liga bersama kru kucingmu.</p></div>
            <div className="mascot-hero"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><span className="hero-glow" /><Image src="/images/legion-cat-mascot-512.png" width={300} height={300} alt="Kucing penambang LegionCoin" priority /><span className="mascot-caption"><Sparkles size={13} /> KAPTEN PAW</span></div>
            <div className="offline-banner"><ShieldCheck size={17} /><span><b>SEMUA VIRTUAL, SEMUA MILIK SAVE LOKAL</b><small>Tidak ada crypto sungguhan, akun online, atau transaksi jaringan.</small></span><LockKeyhole size={15} className="banner-lock" /></div>
          </section>

          <section className="stats-row" aria-label="Statistik permainan">
            <article className="stat-card wallet-stat"><div className="stat-top"><span>SALDO DOMPET</span><Coins size={16} /></div><strong>{formatNumber(save?.balance || 0, 2)} <small>LC</small></strong><p><span className="tiny-dot gold-dot" /> LegionCoin virtual</p><div className="stat-line"><span>DISIMPAN DI BROWSER</span><LockKeyhole size={12} /></div></article>
            <article className="stat-card power-stat"><div className="stat-top"><span>MINING POWER</span><Zap size={16} /></div><strong>{formatNumber(totalPower)} <small>TH/s</small></strong><p><span className="tiny-dot green-dot" /> {formatNumber(permanentPower)} permanen {temporaryPower > 0 ? `· +${formatNumber(temporaryPower)} sementara` : "· rig aktif"}</p><div className="stat-line"><span>POWER SEMENTARA {temporaryPower > 0 ? "AKTIF" : "SIAP DIISI"}</span><Activity size={12} /></div></article>
            <article className="stat-card yield-stat"><div className="stat-top"><span>ESTIMASI HADIAH</span><Gem size={16} /></div><strong>{formatNumber(dailyReward, 2)} <small>LC / hari</small></strong><p><span className="tiny-dot blue-dot" /> Bagi hasil pool liga simulasi</p><div className="stat-line"><span>MAKS. PROGRES OFFLINE 24 JAM</span><Clock3 size={12} /></div></article>
            <article className="stat-card league-stat"><div className="stat-top"><span>LIGA SAAT INI</span><Trophy size={16} /></div><strong>{league.name}<small> · #{rankEstimate}</small></strong><p><span className="tiny-dot orange-dot" /> Peringkat dari power permanen</p><div className="stat-line"><span>{nextLeague ? `${formatNumber(Math.max(0, nextLeague.minPower - permanentPower))} TH/s KE LIGA ${nextLeague.name.toUpperCase()}` : "PUNCAK LIGA TERCAPAI"}</span><ChevronRight size={12} /></div></article>
          </section>

          <section className="play-panel panel" aria-label="Paw Rush mini-game">
            <div className="play-copy"><div className="section-label"><Gamepad2 size={14} /> MINI-GAME / 01</div><h2>Kejar Paw <span>Rush!</span></h2><p>Tangkap paw bercahaya sebanyak mungkin dalam 12 detik. Skormu mengubah power sementara yang ikut membagi hadiah selama 7 hari.</p><button className="primary-button" onClick={startMiniGame}><Gamepad2 size={16} /> Mainkan Paw Rush <ChevronRight size={15} /></button><div className="game-reward"><Zap size={13} /><span>POWER TEMPORER BISA MENUMPUK · MAKSIMALKAN SKOR</span></div></div>
            <div className="play-art"><div className="game-sun" /><div className="pixel-cloud cloud-a" /><div className="pixel-cloud cloud-b" /><div className="mine-hill hill-back" /><div className="mine-hill hill-front" /><div className="ore ore-one">✦</div><div className="ore ore-two">✦</div><div className="play-cat"><Image src="/images/legion-cat-mascot-512.png" width={184} height={184} alt="" /></div><span className="floating-paw">✦</span><span className="art-tag"><Pickaxe size={12} /> PAW POWER, LET&apos;S GO!</span></div>
          </section>

          <div className="section-heading" id="rigs"><div><p className="eyebrow">SEKTOR 01 / RUANG KERJA</p><h2>Ruang miner <span>kamu</span></h2></div><span className="count-chip"><HardDrive size={13} /> {activeMiners.length} / {MINERS.length} MINER AKTIF</span></div>
          <section className="rigs-layout">
            <div className="rigs-card panel">
              <div className="panel-header"><div><span className="section-label">FARM VIRTUAL</span><h3>Rig yang bekerja</h3></div><span className="active-badge"><i /> MENAMBANG</span></div>
              <div className="rig-grid">
                {activeMiners.map((miner, index) => {
                  const level = save?.minerLevels[miner.id] || 1;
                  const isStarter = miner.id === "starter-cat";
                  return <article className={`rig-tile ${isStarter ? "rig-featured" : ""}`} key={miner.id}>
                    <div className="rig-tile-top"><div className={`miner-glyph miner-glyph-${index}`}><Image src="/images/legion-cat-mascot-512.png" width={74} height={74} alt="" /></div><span className="rig-level">LV.{String(level).padStart(2, "0")}</span></div>
                    <h4>{miner.name}</h4><p>{miner.label}</p><div className="rig-power"><Zap size={14} /> {formatNumber(miner.power * level)} <small>TH/s</small></div><div className="rig-meter"><span style={{ width: `${36 + ((now / 1000 + index * 17) % 58)}%` }} /></div><div className="rig-tile-foot"><span><i /> ONLINE</span><span>#{String(index + 1).padStart(2, "0")}</span></div>
                  </article>;
                })}
              </div>
              <div className="rig-footer"><span><BatteryCharging size={14} /> Grid virtual stabil · 100%</span><span><span className="live-dot" /> SAVE OTOMATIS</span></div>
            </div>
            <aside className="league-card panel" id="league">
              <div className="league-card-head"><div><span className="section-label">TANGGA PERINGKAT</span><h3>Jalur liga</h3></div><span className={`league-emblem emblem-${league.color}`}><Crown size={18} /></span></div>
              <div className={`league-banner league-${league.color}`}><span className="league-small">LIGA SAAT INI</span><strong>{league.name}</strong><span className="league-icon">{leagueIndex + 1 < 3 ? "✦" : "✧"}</span></div>
              <div className="league-progress-label"><span>POWER PERMANEN</span><b>{formatNumber(permanentPower)} TH/s</b></div><div className="league-progress"><span style={{ width: `${progressToLeague}%` }} /></div>
              <p className="league-next">{nextLeague ? <><b>{formatNumber(Math.max(0, nextLeague.minPower - permanentPower))} TH/s</b> lagi ke Liga {nextLeague.name}</> : "Kamu sudah mencapai liga tertinggi!"}</p>
              <div className="league-divider" /><div className="pool-info"><div><span>POOL LIGA / HARI</span><b>{formatNumber(league.dailyPool)} <small>LC</small></b></div><div><span>PORSI POWER-MU</span><b>{formatNumber(poolShare * 100, 2)}<small>%</small></b></div></div>
              <p className="simulation-note"><Activity size={13} /> Pool dan rival dihitung secara simulasi lokal. Power sementara menambah porsi, tetapi tidak menaikkan liga.</p>
            </aside>
          </section>

          <section className="market-section" id="market">
            <div className="section-heading"><div><p className="eyebrow">SEKTOR 02 / PERDAGANGAN LOKAL</p><h2>Pasar miner <span>virtual</span></h2></div><span className="market-note"><LockKeyhole size={13} /> TANPA UANG ASLI</span></div>
            <div className="market-grid">
              {MINERS.filter((miner) => miner.id !== "starter-cat").map((miner, index) => {
                const level = save?.minerLevels[miner.id] || 0;
                const owned = level > 0;
                const price = owned ? Math.max(45, Math.round(miner.price * (0.72 + level * 0.62))) : miner.price;
                return <article className={`market-card panel ${owned ? "market-owned" : ""}`} key={miner.id}>
                  <div className={`market-art market-art-${index}`}><div className="market-ring" /><Image src="/images/legion-cat-mascot-512.png" width={102} height={102} alt="" /><span className="market-power"><Zap size={12} /> +{miner.power * (owned ? level + 1 : 1)} TH/s</span></div>
                  <div className="market-card-body"><span className="item-type">{miner.label.toUpperCase()}</span><h3>{miner.name}</h3><p>{miner.description}</p><div className="market-bottom"><span className="item-price"><Coins size={15} /> {formatNumber(price)} <small>LC</small></span><button className={`buy-button ${owned ? "upgrade-button" : ""}`} disabled={!save || save.balance < price} onClick={() => runAction((current, time) => buyOrUpgradeMiner(current, miner.id, time), owned ? "Miner ditingkatkan!" : "Miner baru aktif!")}>{owned ? "TINGKATKAN" : "BELI MINER"}<ChevronRight size={14} /></button></div>{owned && <span className="owned-caption"><Check size={11} /> TERPASANG · LEVEL {level}</span>}</div>
                </article>;
              })}
            </div>
          </section>

          <div className="lower-grid">
            <section className="rivals-card panel">
              <div className="panel-header"><div><span className="section-label">SIMULASI LOKAL</span><h3>Rival satu liga</h3></div><span className="npc-label"><Activity size={12} /> NPC</span></div>
              <p className="rivals-intro">Nama dan power berikut adalah karakter bot lokal—bukan leaderboard pemain sungguhan.</p>
              <div className="rival-list">
                {RIVALS.map((rival, index) => <div className="rival-row" key={rival.name}><span className="rival-rank">0{index + 1}</span><span className="rival-avatar">{rival.icon}</span><b>{rival.name}</b><span className="rival-power">{formatNumber(Math.max(12, league.rivalPower * rival.offset))} TH/s</span><div className="rival-bar"><span style={{ width: `${Math.min(100, rival.offset * 53)}%` }} /></div></div>)}
              </div>
            </section>
            <section className="wallet-card panel" id="wallet">
              <div className="panel-header"><div><span className="section-label">PENYIMPANAN PERANGKAT</span><h3>Dompet virtual</h3></div><span className="wallet-lock"><LockKeyhole size={14} /></span></div>
              <div className="wallet-balance"><span>SALDO LEGIONCOIN</span><strong>{formatNumber(save?.balance || 0, 2)} <small>LC</small></strong><span className="wallet-hint"><span className="tiny-dot gold-dot" /> Token game lokal · bukan aset kripto</span></div>
              <div className="wallet-actions"><button disabled title="Game ini offline dan tidak memiliki penarikan"><ArrowUpRight size={14} /> Kirim <small>Nonaktif</small></button><button disabled title="Game ini offline dan tidak memiliki penarikan"><ArrowDownLeft size={14} /> Tarik <small>Nonaktif</small></button></div>
              <div className="history-head"><span>AKTIVITAS TERBARU</span><span>LOKAL</span></div>
              <div className="activity-list">{(save?.activity || []).slice(0, 4).map((item) => <div className="activity-row" key={item.id}><span className={`activity-icon activity-${item.kind}`}>{item.kind === "purchase" || item.kind === "upgrade" ? <ShoppingBag size={13} /> : item.kind === "boost" ? <Zap size={13} /> : <Sparkles size={13} />}</span><span className="activity-copy"><b>{item.title}</b><small>{item.detail}</small></span><span className={`activity-amount ${(item.amount || 0) < 0 ? "negative" : ""}`}>{typeof item.amount === "number" ? `${item.amount > 0 ? "+" : ""}${formatNumber(item.amount, item.amount % 1 ? 2 : 0)}` : "—"}</span></div>)}</div>
              <p className="private-note"><ShieldCheck size={13} /> Save tersimpan di browser ini. Hapus data situs = progres terhapus.</p>
            </section>
          </div>

          <footer className="game-footer"><span><Cat size={14} /> LEGIONCOIN — GAME SIMULASI OFFLINE</span><span><CircleHelp size={13} /> Tidak memakai CPU untuk mining · Tidak ada nilai tukar riil</span></footer>
        </div>
      </section>

      {gameOpen && <div className="modal-backdrop" role="presentation"><section className="minigame-modal" role="dialog" aria-modal="true" aria-labelledby="minigame-title"><header className="modal-head"><div><span className="section-label"><Gamepad2 size={13} /> TANTANGAN POWER / 12 DETIK</span><h2 id="minigame-title">Paw Rush!</h2></div><button className="modal-close" onClick={finishMiniGame} aria-label="Akhiri tantangan"><X size={19} /></button></header><div className="game-scorebar"><span><Star size={15} /> SKOR <b>{gameScore}</b></span><span className="timer-chip"><Clock3 size={14} /> {formatClock(gameSeconds)}</span></div><div className="paw-arena"><div className="arena-stars">✦　·　✧　·　✦</div><p>TANGKAP PAW YANG MENYALA!</p><button className="paw-target" style={{ left: `${pawPosition.left}%`, top: `${pawPosition.top}%` }} onClick={tapPaw} aria-label="Tangkap paw bercahaya">🐾</button><div className="arena-hint">Setiap tangkapan menaikkan skor power-mu</div></div><div className="modal-footer"><span>POWER SEMENTARA BERTAHAN 7 HARI</span><b>+{Math.max(8, Math.round(8 + gameScore * 2.4))} TH/s <small>ESTIMASI</small></b></div></section></div>}

      {toast && <div className="toast" role="status"><Sparkles size={15} /> {toast}</div>}
    </main>
  );
}
