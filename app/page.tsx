"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, ArrowDownLeft, ArrowUpRight, BatteryCharging, Cat, Check, ChevronRight,
  CircleHelp, Clock3, Coins, Cpu, Crown, Gamepad2, Gem, HardDrive, Home, LockKeyhole,
  Menu, Pickaxe, RotateCcw, Server, ShieldCheck, ShoppingBag, Sparkles, Trophy, WifiOff, Zap,
} from "lucide-react";
import {
  addTemporaryPower, ArcadeMode, buyOrUpgradeMiner, buyOrUpgradeRack, createInitialSave,
  GameSave, getActiveTemporaryPower, getArcadeRewardEstimate, getHourlyReward, getLeague,
  getPermanentPower, getPlayerShare, getUpgradeCost, getUtcDayKey, grantArcadeReward,
  MAX_ARCADE_REWARD_PER_DAY, MAX_ITEM_LEVEL, MIN_PAW_RUSH_BOOST_SCORE, MINERS,
  normalizeSave, SAVE_KEY, SERVER_RACKS, settleOffline,
} from "@/lib/legioncoin";
import ArcadeHub from "./arcade-hub";

const formatNumber = (value: number, digits = 0) => new Intl.NumberFormat("id-ID", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);

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
  const [activeSection, setActiveSection] = useState("dashboard");
  const [offlineReady, setOfflineReady] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [upgradeEffect, setUpgradeEffect] = useState<{ target: string; sequence: number } | null>(null);
  const saveRef = useRef<GameSave | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const storageWarningShownRef = useRef(false);
  const upgradeSequenceRef = useRef(0);
  const upgradeEffectTimerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const notify = useCallback((message: string) => {
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = window.setTimeout(() => setToast(""), 2600);
  }, []);

  const warnStorageUnavailable = useCallback(() => {
    setStorageAvailable(false);
    if (storageWarningShownRef.current) return;
    storageWarningShownRef.current = true;
    notify("Penyimpanan browser tidak tersedia; progres hanya bertahan selama halaman terbuka.");
  }, [notify]);

  function playUpgradeSound() {
    try {
      if (!window.AudioContext) return;
      const audio = audioContextRef.current || new window.AudioContext();
      audioContextRef.current = audio;
      if (audio.state === "suspended") void audio.resume();
      const start = audio.currentTime + 0.025;
      const master = audio.createGain();
      master.gain.setValueAtTime(0.0001, start);
      master.gain.exponentialRampToValueAtTime(0.16, start + 0.025);
      master.gain.exponentialRampToValueAtTime(0.0001, start + 0.76);
      master.connect(audio.destination);
      [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
        const at = start + index * 0.105;
        const duration = index === 3 ? 0.35 : 0.18;
        const tone = audio.createOscillator();
        const envelope = audio.createGain();
        tone.type = "triangle";
        tone.frequency.setValueAtTime(frequency, at);
        envelope.gain.setValueAtTime(0.0001, at);
        envelope.gain.exponentialRampToValueAtTime(0.72, at + 0.018);
        envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
        tone.connect(envelope);
        envelope.connect(master);
        tone.start(at);
        tone.stop(at + duration + 0.025);
      });
    } catch {
      // Audio is optional; unsupported or blocked sound must never interrupt an upgrade.
    }
  }

  function triggerUpgradeFeedback(target: string) {
    const sequence = ++upgradeSequenceRef.current;
    setUpgradeEffect({ target, sequence });
    if (upgradeEffectTimerRef.current !== null) window.clearTimeout(upgradeEffectTimerRef.current);
    upgradeEffectTimerRef.current = window.setTimeout(() => setUpgradeEffect(null), 1100);
    playUpgradeSound();
  }

  useEffect(() => () => {
    if (upgradeEffectTimerRef.current !== null) window.clearTimeout(upgradeEffectTimerRef.current);
    const audio = audioContextRef.current;
    if (audio && audio.state !== "closed") void audio.close().catch(() => undefined);
  }, []);

  useEffect(() => {
    let next: GameSave;
    let canPersist = true;
    try {
      const stored = localStorage.getItem(SAVE_KEY);
      let loaded: GameSave;
      try {
        loaded = stored ? normalizeSave(JSON.parse(stored), Date.now()) : createInitialSave(Date.now());
      } catch {
        loaded = createInitialSave(Date.now());
        notify("Save lokal tidak terbaca; petualangan baru dimulai.");
      }
      next = settleOffline(loaded, Date.now());
    } catch {
      next = createInitialSave(Date.now());
      canPersist = false;
      warnStorageUnavailable();
    }
    saveRef.current = next;
    setSave(next);
    if (canPersist) {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(next));
      } catch {
        canPersist = false;
        warnStorageUnavailable();
      }
    }
    setStorageAvailable(canPersist);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then(() => navigator.serviceWorker.ready).then(() => setOfflineReady(true)).catch(() => setOfflineReady(false));
    }
  }, [notify, warnStorageUnavailable]);

  useEffect(() => {
    if (!save || !storageAvailable) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch {
      warnStorageUnavailable();
    }
  }, [save, storageAvailable, warnStorageUnavailable]);

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

  useEffect(() => {
    const sections = ["dashboard", "arcade", "rigs", "racks", "league", "market", "wallet"];
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
  const activeRacks = useMemo(() => SERVER_RACKS.filter((rack) => (save?.rackLevels[rack.id] || 0) > 0), [save]);
  const arcadeEarnedToday = save?.arcadeRewardDay === getUtcDayKey(now) ? save.arcadeCoinsToday : 0;
  const rankEstimate = Math.max(1, Math.min(99, Math.round(4 + (1 - poolShare) * 18)));

  function runAction(action: (current: GameSave, time: number) => GameSave, success: string, upgradeTarget?: string) {
    const current = saveRef.current;
    if (!current) return;
    try {
      const next = action(current, Date.now());
      saveRef.current = next;
      setSave(next);
      notify(success);
      if (upgradeTarget) triggerUpgradeFeedback(upgradeTarget);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Aksi belum bisa dilakukan.");
    }
  }

  function upgradeAnimationStyle(target: string) {
    if (upgradeEffect?.target !== target) return undefined;
    return { animationName: upgradeEffect.sequence % 2 === 0 ? "legionUpgradePulseA" : "legionUpgradePulseB" };
  }

  const completeArcade = useCallback((mode: ArcadeMode, score: number) => {
    const current = saveRef.current;
    if (!current) return;
    const stamp = Date.now();
    const gameNames: Record<ArcadeMode, string> = {
      "paw-rush": "Paw Rush",
      "coin-catch": "Bit Catch",
      "memory-mine": "Memory Mine",
    };
    const boostEarned = mode === "paw-rush" && score >= MIN_PAW_RUSH_BOOST_SCORE;
    let next = boostEarned ? addTemporaryPower(current, score, stamp) : current;
    const powerGained = boostEarned ? Math.max(8, Math.round(8 + Math.max(0, Math.min(100, Math.floor(score))) * 2.4)) : 0;
    const result = grantArcadeReward(next, gameNames[mode], getArcadeRewardEstimate(mode, score), stamp);
    next = result.save;
    saveRef.current = next;
    setSave(next);
    const powerNote = powerGained ? ` · +${formatNumber(powerGained)} TH/s temporer` : mode === "paw-rush" ? ` · boost mulai ${MIN_PAW_RUSH_BOOST_SCORE} tangkapan` : "";
    const capNote = result.remainingToday === 0 && getArcadeRewardEstimate(mode, score) > result.earned ? " · batas harian tercapai" : "";
    notify(`${gameNames[mode]} selesai: +${formatNumber(result.earned, 2)} LC${powerNote}${capNote}`);
  }, [notify]);

  function resetSave() {
    if (!window.confirm("Hapus save LegionCoin di perangkat ini dan mulai dari awal?")) return;
    const fresh = createInitialSave(Date.now());
    saveRef.current = fresh;
    setSave(fresh);
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(fresh));
      setStorageAvailable(true);
    } catch {
      warnStorageUnavailable();
    }
    notify("Save lokal direset.");
  }

  const navItems = [
    { id: "dashboard", label: "Markas", icon: Home },
    { id: "arcade", label: "Arcade", icon: Gamepad2 },
    { id: "rigs", label: "Ruang Miner", icon: Cpu },
    { id: "racks", label: "Rak Server", icon: Server },
    { id: "league", label: "Liga & Pool", icon: Trophy },
    { id: "market", label: "Pasar Rig & Rak", icon: ShoppingBag },
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
          <div className="offline-note"><WifiOff size={14} /><span>MODE OFFLINE<br /><b>{!storageAvailable ? "SAVE TIDAK TERSEDIA" : offlineReady ? "SIAP DIMAINKAN" : "SAVE DI PERANGKAT"}</b></span></div>
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
            <span className="save-pill"><span className="save-dot" /> {!storageAvailable ? "PROGRES SESI SAJA" : offlineReady ? "TERSIMPAN · OFFLINE READY" : "SAVE LOKAL AKTIF"}</span>
            <div className="player-chip"><span className="player-initial">{save?.playerName.slice(0, 1) || "P"}</span><span><b>{save?.playerName || "Penjelajah Paw"}</b><small>MINER · LEVEL {Math.max(1, Math.floor((save?.xp || 0) / 250) + 1)}</small></span></div>
          </div>
        </header>

        <div className="content-wrap">
          <section id="dashboard" className="welcome-row">
            <div><p className="eyebrow"><span className="eyebrow-star">✦</span> SELAMAT DATANG DI LEGION OUTPOST</p><h1>Tambang virtual.<br /><em>Petualangan nyata.</em></h1><p className="welcome-copy">Mainkan mini-game, kumpulkan power, dan naiki liga bersama kru kucingmu.</p></div>
            <div className="mascot-hero"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><span className="hero-glow" /><Image src="/images/legion-cat-mascot-512.png" width={300} height={300} alt="Kucing penambang LegionCoin" priority /><span className="mascot-caption"><Sparkles size={13} /> KAPTEN PAW</span></div>
            <div className="offline-banner"><ShieldCheck size={17} /><span><b>{storageAvailable ? "SEMUA VIRTUAL, SEMUA MILIK SAVE LOKAL" : "PENYIMPANAN BROWSER TIDAK TERSEDIA"}</b><small>{storageAvailable ? "Tidak ada crypto sungguhan, akun online, atau transaksi jaringan." : "Progres hanya tersimpan selama halaman ini tetap terbuka."}</small></span><LockKeyhole size={15} className="banner-lock" /></div>
          </section>

          <section className="stats-row" aria-label="Statistik permainan">
            <article className="stat-card wallet-stat"><div className="stat-top"><span>SALDO DOMPET</span><Coins size={16} /></div><strong>{formatNumber(save?.balance || 0, 2)} <small>LC</small></strong><p><span className="tiny-dot gold-dot" /> LegionCoin virtual</p><div className="stat-line"><span>{storageAvailable ? "DISIMPAN DI BROWSER" : "HANYA SESI INI"}</span><LockKeyhole size={12} /></div></article>
            <article className="stat-card power-stat"><div className="stat-top"><span>MINING POWER</span><Zap size={16} /></div><strong>{formatNumber(totalPower)} <small>TH/s</small></strong><p><span className="tiny-dot green-dot" /> {formatNumber(permanentPower)} permanen {temporaryPower > 0 ? `· +${formatNumber(temporaryPower)} sementara` : "· rig aktif"}</p><div className="stat-line"><span>POWER SEMENTARA {temporaryPower > 0 ? "AKTIF" : "SIAP DIISI"}</span><Activity size={12} /></div></article>
            <article className="stat-card yield-stat"><div className="stat-top"><span>ESTIMASI HADIAH</span><Gem size={16} /></div><strong>{formatNumber(dailyReward, 2)} <small>LC / hari</small></strong><p><span className="tiny-dot blue-dot" /> Bagi hasil pool liga simulasi</p><div className="stat-line"><span>MAKS. PROGRES OFFLINE 24 JAM</span><Clock3 size={12} /></div></article>
            <article className="stat-card league-stat"><div className="stat-top"><span>LIGA SAAT INI</span><Trophy size={16} /></div><strong>{league.name}<small> · #{rankEstimate}</small></strong><p><span className="tiny-dot orange-dot" /> Peringkat dari power permanen</p><div className="stat-line"><span>{nextLeague ? `${formatNumber(Math.max(0, nextLeague.minPower - permanentPower))} TH/s KE LIGA ${nextLeague.name.toUpperCase()}` : "PUNCAK LIGA TERCAPAI"}</span><ChevronRight size={12} /></div></article>
          </section>

          <section className="play-panel panel" aria-label="Terminal arcade LegionCoin">
            <div className="play-copy"><div className="section-label"><Gamepad2 size={14} /> TERMINAL ARCADE / BONUS VIRTUAL</div><h2>Jeda sebentar.<br /><span>Tambang lebih pintar.</span></h2><p>Mainkan tantangan arcade singkat untuk bonus LC virtual. Paw Rush juga memberi power sementara; Bit Catch dan Memory Mine menambah variasi skor.</p><a className="primary-button" href="#arcade"><Gamepad2 size={16} /> Buka terminal arcade <ChevronRight size={15} /></a><div className="game-reward"><Coins size={13} /><span>HADIAH LC LOKAL · MAKS. {MAX_ARCADE_REWARD_PER_DAY} LC ARCADE / HARI</span></div></div>
            <div className="play-art"><div className="game-sun" /><div className="pixel-cloud cloud-a" /><div className="pixel-cloud cloud-b" /><div className="mine-hill hill-back" /><div className="mine-hill hill-front" /><div className="ore ore-one">✦</div><div className="ore ore-two">✦</div><div className="play-cat"><Image src="/images/legion-cat-mascot-512.png" width={184} height={184} alt="" /></div><span className="floating-paw">✦</span><span className="art-tag"><Pickaxe size={12} /> PAW POWER, LET&apos;S GO!</span></div>
          </section>

          <ArcadeHub dailyEarned={arcadeEarnedToday} dailyLimit={MAX_ARCADE_REWARD_PER_DAY} onComplete={completeArcade} />

          <div className="section-heading" id="rigs"><div><p className="eyebrow">SEKTOR 02 / RUANG KERJA</p><h2>Rig mining <span>kamu</span></h2></div><span className="count-chip"><HardDrive size={13} /> {activeMiners.length} MINER · {activeRacks.length} RAK</span></div>
          <section className="rigs-layout">
            <div className="rigs-card panel">
              <div className="panel-header"><div><span className="section-label">FARM VIRTUAL</span><h3>Rig yang bekerja</h3></div><span className="active-badge"><i /> MENAMBANG</span></div>
              <div className="rig-grid">
                {activeMiners.map((miner, index) => {
                  const level = save?.minerLevels[miner.id] || 1;
                  const isStarter = miner.id === "starter-cat";
                  const upgradePrice = getUpgradeCost(miner.id, level);
                  const upgradeTarget = `miner:${miner.id}`;
                  const upgradeActive = upgradeEffect?.target === upgradeTarget;
                  return <article className={`rig-tile ${isStarter ? "rig-featured" : ""} ${upgradeActive ? "upgrade-celebrate" : ""}`} style={upgradeAnimationStyle(upgradeTarget)} key={miner.id}>
                    {upgradeActive && <span className="upgrade-flash-label"><Sparkles size={11} /> LEVEL UP</span>}
                    <div className="rig-tile-top"><div className={`miner-glyph miner-glyph-${index}`}><Image src="/images/legion-cat-mascot-512.png" width={74} height={74} alt="" /></div><span className="rig-level">LV.{String(level).padStart(2, "0")}</span></div>
                    <h4>{miner.name}</h4><p>{miner.label}</p><div className="rig-power"><Zap size={14} /> {formatNumber(miner.power * level)} <small>TH/s</small></div><div className="rig-meter"><span style={{ width: `${36 + ((now / 1000 + index * 17) % 58)}%` }} /></div><div className="rig-tile-foot"><span><i /> ONLINE</span><span>#{String(index + 1).padStart(2, "0")}</span></div>
                    <button className="rig-upgrade-action" disabled={!save || save.balance < upgradePrice || level >= MAX_ITEM_LEVEL} onClick={() => runAction((current, time) => buyOrUpgradeMiner(current, miner.id, time), `${miner.name} ditingkatkan!`, upgradeTarget)}><Zap size={12} /> {level >= MAX_ITEM_LEVEL ? "LEVEL MAKS" : `UPGRADE · ${formatNumber(upgradePrice)} LC`}</button>
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

          <div className="section-heading" id="racks"><div><p className="eyebrow">SEKTOR 03 / INFRASTRUKTUR KUCING</p><h2>Rak server <span>markas</span></h2></div><span className="count-chip"><Server size={13} /> {activeRacks.length} / {SERVER_RACKS.length} JENIS TERPASANG</span></div>
          <section className="rack-room panel">
            <div className="panel-header"><div><span className="section-label"><Server size={13} /> CAT SERVER BAY</span><h3>Rak server yang bekerja</h3></div><span className="active-badge"><i /> {formatNumber(activeRacks.reduce((sum, rack) => sum + rack.power * (save?.rackLevels[rack.id] || 0), 0))} TH/s RAK</span></div>
            {activeRacks.length > 0 ? <div className="server-rack-grid">{activeRacks.map((rack, index) => {
              const level = save?.rackLevels[rack.id] || 1;
              const upgradePrice = getUpgradeCost(rack.id, level);
              const atMaxLevel = level >= MAX_ITEM_LEVEL;
              const upgradeTarget = `rack:${rack.id}`;
              const upgradeActive = upgradeEffect?.target === upgradeTarget;
              return <article className={`server-rack-tile ${upgradeActive ? "upgrade-celebrate" : ""}`} style={upgradeAnimationStyle(upgradeTarget)} key={rack.id}>
                {upgradeActive && <span className="upgrade-flash-label"><Sparkles size={11} /> RACK LEVEL UP</span>}
                <div className={`server-rack-art rack-art-${index}`}><Server size={31} /><span>🐈</span></div>
                <div className="server-rack-info"><div className="server-rack-title"><div><span className="item-type">{rack.label.toUpperCase()}</span><h4>{rack.name}</h4></div><span className="rig-level">LV.{String(level).padStart(2, "0")}</span></div><p>{rack.description}</p><div className="server-rack-stats"><span><Zap size={13} /> {formatNumber(rack.power * level)} TH/s</span><span><i /> ONLINE</span></div><button className="rig-upgrade-action" disabled={!save || save.balance < upgradePrice || atMaxLevel} onClick={() => runAction((current, time) => buyOrUpgradeRack(current, rack.id, time), `${rack.name} di-upgrade!`, upgradeTarget)}><Zap size={12} /> {atMaxLevel ? "LEVEL MAKS" : `UPGRADE RAK · ${formatNumber(upgradePrice)} LC`}</button></div>
              </article>;
            })}</div> : <div className="rack-empty"><div className="server-rack-art rack-art-empty"><Server size={33} /><span>🐱</span></div><div><b>Bay server masih kosong</b><p>Pasang rak kucing dari pasar di bawah. Setiap rak menambah power permanen dan membantu naik liga.</p></div></div>}
            <div className="rig-footer"><span><BatteryCharging size={14} /> Semua rak virtual · tidak memakai CPU untuk mining</span><span><span className="live-dot" /> SAVE OTOMATIS</span></div>
          </section>

          <section className="market-section" id="market">
            <div className="section-heading"><div><p className="eyebrow">SEKTOR 04 / PERDAGANGAN LOKAL</p><h2>Pasar rig &amp; rak <span>virtual</span></h2></div><span className="market-note"><LockKeyhole size={13} /> TANPA UANG ASLI</span></div>
            <div className="market-grid">
              {MINERS.filter((miner) => miner.id !== "starter-cat").map((miner, index) => {
                const level = save?.minerLevels[miner.id] || 0;
                const owned = level > 0;
                const price = owned ? getUpgradeCost(miner.id, level) : miner.price;
                const atMaxLevel = level >= MAX_ITEM_LEVEL;
                const upgradeTarget = `miner:${miner.id}`;
                const upgradeActive = upgradeEffect?.target === upgradeTarget;
                return <article className={`market-card panel ${owned ? "market-owned" : ""} ${upgradeActive ? "upgrade-celebrate" : ""}`} style={upgradeAnimationStyle(upgradeTarget)} key={miner.id}>
                  {upgradeActive && <span className="upgrade-flash-label"><Sparkles size={11} /> LEVEL UP</span>}
                  <div className={`market-art market-art-${index}`}><div className="market-ring" /><Image src="/images/legion-cat-mascot-512.png" width={102} height={102} alt="" /><span className="market-power"><Zap size={12} /> +{miner.power * (owned ? level + 1 : 1)} TH/s</span></div>
                  <div className="market-card-body"><span className="item-type">{miner.label.toUpperCase()}</span><h3>{miner.name}</h3><p>{miner.description}</p><div className="market-bottom"><span className="item-price">{atMaxLevel ? <span>LEVEL MAKS</span> : <><Coins size={15} /> {formatNumber(price)} <small>LC</small></>}</span><button className={`buy-button ${owned ? "upgrade-button" : ""}`} disabled={!save || save.balance < price || atMaxLevel} onClick={() => runAction((current, time) => buyOrUpgradeMiner(current, miner.id, time), owned ? "Miner ditingkatkan!" : "Miner baru aktif!", owned ? upgradeTarget : undefined)}>{atMaxLevel ? "LEVEL MAKS" : owned ? "TINGKATKAN" : "BELI MINER"}{!atMaxLevel && <ChevronRight size={14} />}</button></div>{owned && <span className="owned-caption"><Check size={11} /> TERPASANG · LEVEL {level}/{MAX_ITEM_LEVEL}</span>}</div>
                </article>;
              })}
            </div>
            <div className="market-subheading"><div><span className="section-label"><Server size={13} /> INFRASTRUKTUR SERVER</span><h3>Rak server kucing</h3></div><span>POWER PERMANEN · LEVEL MAKS. {MAX_ITEM_LEVEL}</span></div>
            <div className="market-grid rack-market-grid">
              {SERVER_RACKS.map((rack, index) => {
                const level = save?.rackLevels[rack.id] || 0;
                const owned = level > 0;
                const price = owned ? getUpgradeCost(rack.id, level) : rack.price;
                const atMaxLevel = level >= MAX_ITEM_LEVEL;
                const upgradeTarget = `rack:${rack.id}`;
                const upgradeActive = upgradeEffect?.target === upgradeTarget;
                return <article className={`market-card panel ${owned ? "market-owned" : ""} ${upgradeActive ? "upgrade-celebrate" : ""}`} style={upgradeAnimationStyle(upgradeTarget)} key={rack.id}>
                  {upgradeActive && <span className="upgrade-flash-label"><Sparkles size={11} /> RACK LEVEL UP</span>}
                  <div className={`market-art rack-market-art market-art-${index}`}><div className="market-ring" /><div className="rack-market-icon"><Server size={43} /><span>🐈</span></div><span className="market-power"><Zap size={12} /> +{formatNumber(rack.power)} TH/s / level</span></div>
                  <div className="market-card-body"><span className="item-type">{rack.label.toUpperCase()}</span><h3>{rack.name}</h3><p>{rack.description}</p><div className="market-bottom"><span className="item-price">{atMaxLevel ? <span>LEVEL MAKS</span> : <><Coins size={15} /> {formatNumber(price)} <small>LC</small></>}</span><button className={`buy-button ${owned ? "upgrade-button" : ""}`} disabled={!save || save.balance < price || atMaxLevel} onClick={() => runAction((current, time) => buyOrUpgradeRack(current, rack.id, time), owned ? "Rak server di-upgrade!" : "Rak server kucing terpasang!", owned ? upgradeTarget : undefined)}>{atMaxLevel ? "LEVEL MAKS" : owned ? "UPGRADE RAK" : "BELI RAK"}{!atMaxLevel && <ChevronRight size={14} />}</button></div>{owned && <span className="owned-caption"><Check size={11} /> TERPASANG · LEVEL {level}/{MAX_ITEM_LEVEL}</span>}</div>
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
              <div className="activity-list">{(save?.activity || []).slice(0, 4).map((item) => <div className="activity-row" key={item.id}><span className={`activity-icon activity-${item.kind}`}>{item.kind === "purchase" || item.kind === "upgrade" ? <ShoppingBag size={13} /> : item.kind === "boost" ? <Zap size={13} /> : item.kind === "arcade" ? <Gamepad2 size={13} /> : <Sparkles size={13} />}</span><span className="activity-copy"><b>{item.title}</b><small>{item.detail}</small></span><span className={`activity-amount ${(item.amount || 0) < 0 ? "negative" : ""}`}>{typeof item.amount === "number" ? `${item.amount > 0 ? "+" : ""}${formatNumber(item.amount, item.amount % 1 ? 2 : 0)}` : "—"}</span></div>)}</div>
              <p className="private-note"><ShieldCheck size={13} /> {storageAvailable ? "Save tersimpan di browser ini. Hapus data situs = progres terhapus." : "Save browser tidak tersedia; jangan tutup halaman jika ingin mempertahankan sesi ini."}</p>
            </section>
          </div>

          <footer className="game-footer"><span><Cat size={14} /> LEGIONCOIN — GAME SIMULASI OFFLINE</span><span><CircleHelp size={13} /> Tidak memakai CPU untuk mining · Tidak ada nilai tukar riil</span></footer>
        </div>
      </section>

      {toast && <div className="toast" role="status"><Sparkles size={15} /> {toast}</div>}
    </main>
  );
}
