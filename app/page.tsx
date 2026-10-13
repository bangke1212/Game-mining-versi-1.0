"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity, ArrowDownLeft, ArrowUpRight, Cat, Check, ChevronRight,
  CircleHelp, Clock3, Coins, Cpu, Crown, Gamepad2, Gem, Home, LockKeyhole,
  Menu, Pickaxe, RotateCcw, Server, ShieldCheck, ShoppingBag, Sparkles, Trophy, WifiOff, Zap,
} from "lucide-react";
import {
  addTemporaryPower, AVATAR_ACCESSORIES, AVATAR_COATS, ArcadeMode, AvatarCustomization,
  createInitialSave, DEFAULT_AVATAR, GameSave,
  getActiveTemporaryPower, getArcadeRewardEstimate, getHourlyReward, getLeague,
  getPermanentPower, getPlayerShare, getUtcDayKey, grantArcadeReward,
  MAX_ARCADE_REWARD_PER_DAY, MIN_PAW_RUSH_BOOST_SCORE,
  normalizeSave, SAVE_KEY, settleOffline,
} from "@/lib/legioncoin";
import ArcadeHub from "./arcade-hub";
import CatAvatar from "./cat-avatar";
import { MinerMarketScreen, MinerRoomScreen, ServerRackBayScreen } from "./mining-room";

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
  const screenContentRef = useRef<HTMLDivElement | null>(null);
  const sidebarRef = useRef<HTMLElement | null>(null);
  const menuToggleRef = useRef<HTMLButtonElement | null>(null);
  const firstNavItemRef = useRef<HTMLButtonElement | null>(null);
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

  function selectSection(id: string) {
    setActiveSection(id);
    setMenuOpen(false);
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      screenContentRef.current?.focus({ preventScroll: true });
    });
  }

  useEffect(() => {
    if (!menuOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuToggleRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !window.matchMedia("(max-width: 760px)").matches) return;
      const focusable = Array.from(sidebarRef.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)') || []);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [menuOpen]);

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

  const permanentPower = save ? getPermanentPower(save) : 0;
  const temporaryPower = save ? getActiveTemporaryPower(save, now) : 0;
  const totalPower = permanentPower + temporaryPower;
  const { league, index: leagueIndex, next: nextLeague } = getLeague(permanentPower);
  const hourlyReward = getHourlyReward(totalPower, leagueIndex);
  const dailyReward = hourlyReward * 24;
  const poolShare = getPlayerShare(totalPower, leagueIndex);
  const progressToLeague = nextLeague ? Math.min(100, ((permanentPower - league.minPower) / (nextLeague.minPower - league.minPower)) * 100) : 100;
  const arcadeEarnedToday = save?.arcadeRewardDay === getUtcDayKey(now) ? save.arcadeCoinsToday : 0;
  const rankEstimate = Math.max(1, Math.min(99, Math.round(4 + (1 - poolShare) * 18)));
  const avatarCustomization = save?.avatar || DEFAULT_AVATAR;
  const selectedCoat = AVATAR_COATS.find((option) => option.id === avatarCustomization.coat) || AVATAR_COATS[0];
  const selectedAccessory = AVATAR_ACCESSORIES.find((option) => option.id === avatarCustomization.accessory) || AVATAR_ACCESSORIES[0];

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

  function updateAvatar(patch: Partial<AvatarCustomization>) {
    const current = saveRef.current;
    if (!current) return;
    const next = { ...current, avatar: { ...current.avatar, ...patch } };
    saveRef.current = next;
    setSave(next);
    notify("Avatar diperbarui dan disimpan di perangkat.");
  }

  const navItems = [
    { id: "dashboard", label: "Markas", icon: Home },
    { id: "avatar", label: "Avatar Kucing", icon: Cat },
    { id: "arcade", label: "Arcade", icon: Gamepad2 },
    { id: "rigs", label: "Ruang Miner", icon: Cpu },
    { id: "racks", label: "Rak Server", icon: Server },
    { id: "league", label: "Liga & Pool", icon: Trophy },
    { id: "market", label: "Pasar Rig & Rak", icon: ShoppingBag },
    { id: "wallet", label: "Dompet Virtual", icon: Coins },
  ];
  const activeNavLabel = navItems.find((item) => item.id === activeSection)?.label || "Markas";

  return (
    <main className="game-shell">
      <aside ref={sidebarRef} id="legioncoin-navigation" className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <a className="brand" href="#dashboard" onClick={(event) => { event.preventDefault(); selectSection("dashboard"); }}>
          <span className="brand-mark"><Image src="/images/legion-cat-mascot-512.png" width={58} height={58} alt="" priority /></span>
          <span><strong>LEGION<span>COIN</span></strong><small>PAW POWER / LOCAL WORLD</small></span>
        </a>
        <div className="nav-caption">RUANG KOMANDO</div>
        <nav className="side-nav" aria-label="Navigasi game">
          {navItems.map(({ id, label, icon: Icon }, index) => (
            <button key={id} ref={index === 0 ? firstNavItemRef : undefined} type="button" className={`nav-link ${activeSection === id ? "nav-active" : ""}`} aria-current={activeSection === id ? "page" : undefined} onClick={() => selectSection(id)}>
              <Icon size={17} strokeWidth={1.8} /><span>{label}</span><small>0{index + 1}</small>
            </button>
          ))}
        </nav>
        <div className="side-divider" />
        <div className="sidebar-cat">
          <CatAvatar customization={avatarCustomization} size={128} className="cat-avatar-sidebar" alt="" />
          <p>“Satu paw lagi, satu liga lebih tinggi.”</p>
          <span><i /> SISTEM VIRTUAL AKTIF</span>
        </div>
        <div className="side-bottom">
          <div className="offline-note"><WifiOff size={14} /><span>MODE OFFLINE<br /><b>{!storageAvailable ? "SAVE TIDAK TERSEDIA" : offlineReady ? "SIAP DIMAINKAN" : "SAVE DI PERANGKAT"}</b></span></div>
          <button className="reset-link" onClick={resetSave}><RotateCcw size={13} /> Reset save lokal</button>
          <small>LEGIONCOIN · BUILD 1.0</small>
        </div>
      </aside>

      {menuOpen && <button className="mobile-scrim" aria-label="Tutup menu" onClick={() => { setMenuOpen(false); menuToggleRef.current?.focus(); }} />}

      <section className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button ref={menuToggleRef} className="mobile-menu" aria-label={menuOpen ? "Tutup menu" : "Buka menu"} aria-expanded={menuOpen} aria-controls="legioncoin-navigation" onClick={() => { const opening = !menuOpen; setMenuOpen(opening); if (opening) window.requestAnimationFrame(() => firstNavItemRef.current?.focus()); else menuToggleRef.current?.focus(); }}><Menu size={19} /></button>
            <div className="crumb" aria-live="polite"><span>LEGION OUTPOST</span><ChevronRight size={13} /><b>{activeNavLabel.toUpperCase()}</b></div>
          </div>
          <div className="topbar-right">
            <span className="save-pill"><span className="save-dot" /> {!storageAvailable ? "PROGRES SESI SAJA" : offlineReady ? "TERSIMPAN · OFFLINE READY" : "SAVE LOKAL AKTIF"}</span>
            <div className="player-chip"><span className="player-initial"><CatAvatar customization={avatarCustomization} size={35} className="cat-avatar-chip" alt={`Avatar kucing ${save?.playerName || "Penjelajah Paw"}`} /></span><span><b>{save?.playerName || "Penjelajah Paw"}</b><small>MINER · LEVEL {Math.max(1, Math.floor((save?.xp || 0) / 250) + 1)}</small></span></div>
          </div>
        </header>

        <div ref={screenContentRef} className="content-wrap" role="region" aria-label={`Modul ${activeNavLabel}`} tabIndex={-1}>
          {activeSection === "dashboard" && <section className="module-screen dashboard-screen" id="dashboard">
          <section className="welcome-row">
            <div><p className="eyebrow"><span className="eyebrow-star">✦</span> SELAMAT DATANG DI LEGION OUTPOST</p><h1>Tambang virtual.<br /><em>Petualangan nyata.</em></h1><p className="welcome-copy">Mainkan mini-game, kumpulkan power, dan naiki liga bersama kru kucingmu.</p></div>
            <div className="mascot-hero"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><span className="hero-glow" /><CatAvatar customization={avatarCustomization} size={300} className="cat-avatar-hero" alt={`Avatar kucing ${selectedCoat.label}`} priority /><span className="mascot-caption"><Sparkles size={13} /> KAPTEN PAW</span></div>
            <div className="offline-banner"><ShieldCheck size={17} /><span><b>{storageAvailable ? "SEMUA VIRTUAL, SEMUA MILIK SAVE LOKAL" : "PENYIMPANAN BROWSER TIDAK TERSEDIA"}</b><small>{storageAvailable ? "Tidak ada crypto sungguhan, akun online, atau transaksi jaringan." : "Progres hanya tersimpan selama halaman ini tetap terbuka."}</small></span><LockKeyhole size={15} className="banner-lock" /></div>
          </section>

          <section className="stats-row" aria-label="Statistik permainan">
            <article className="stat-card wallet-stat"><div className="stat-top"><span>SALDO DOMPET</span><Coins size={16} /></div><strong>{formatNumber(save?.balance || 0, 2)} <small>LC</small></strong><p><span className="tiny-dot gold-dot" /> LegionCoin virtual</p><div className="stat-line"><span>{storageAvailable ? "DISIMPAN DI BROWSER" : "HANYA SESI INI"}</span><LockKeyhole size={12} /></div></article>
            <article className="stat-card power-stat"><div className="stat-top"><span>MINING POWER</span><Zap size={16} /></div><strong>{formatNumber(totalPower)} <small>TH/s</small></strong><p><span className="tiny-dot green-dot" /> {formatNumber(permanentPower)} permanen {temporaryPower > 0 ? `· +${formatNumber(temporaryPower)} sementara` : "· rig aktif"}</p><div className="stat-line"><span>POWER SEMENTARA {temporaryPower > 0 ? "AKTIF" : "SIAP DIISI"}</span><Activity size={12} /></div></article>
            <article className="stat-card yield-stat"><div className="stat-top"><span>ESTIMASI HADIAH</span><Gem size={16} /></div><strong>{formatNumber(dailyReward, 2)} <small>LC / hari</small></strong><p><span className="tiny-dot blue-dot" /> Bagi hasil pool liga simulasi</p><div className="stat-line"><span>MAKS. PROGRES OFFLINE 24 JAM</span><Clock3 size={12} /></div></article>
            <article className="stat-card league-stat"><div className="stat-top"><span>LIGA SAAT INI</span><Trophy size={16} /></div><strong>{league.name}<small> · #{rankEstimate}</small></strong><p><span className="tiny-dot orange-dot" /> Peringkat dari power permanen</p><div className="stat-line"><span>{nextLeague ? `${formatNumber(Math.max(0, nextLeague.minPower - permanentPower))} TH/s KE LIGA ${nextLeague.name.toUpperCase()}` : "PUNCAK LIGA TERCAPAI"}</span><ChevronRight size={12} /></div></article>
          </section>

          <section className="play-panel panel" aria-label="Terminal arcade LegionCoin">
            <div className="play-copy"><div className="section-label"><Gamepad2 size={14} /> TERMINAL ARCADE / BONUS VIRTUAL</div><h2>Jeda sebentar.<br /><span>Tambang lebih pintar.</span></h2><p>Mainkan tantangan arcade singkat untuk bonus LC virtual. Paw Rush juga memberi power sementara; Bit Catch dan Memory Mine menambah variasi skor.</p><button className="primary-button" type="button" onClick={() => selectSection("arcade")}><Gamepad2 size={16} /> Buka terminal arcade <ChevronRight size={15} /></button><div className="game-reward"><Coins size={13} /><span>HADIAH LC LOKAL · MAKS. {MAX_ARCADE_REWARD_PER_DAY} LC ARCADE / HARI</span></div></div>
            <div className="play-art"><div className="game-sun" /><div className="pixel-cloud cloud-a" /><div className="pixel-cloud cloud-b" /><div className="mine-hill hill-back" /><div className="mine-hill hill-front" /><div className="ore ore-one">✦</div><div className="ore ore-two">✦</div><div className="play-cat"><CatAvatar customization={avatarCustomization} size={174} className="cat-avatar-play" alt="" /></div><span className="floating-paw">✦</span><span className="art-tag"><Pickaxe size={12} /> PAW POWER, LET&apos;S GO!</span></div>
          </section>

          <section className="quick-access">
            <div className="quick-access-heading"><div><span className="section-label"><Sparkles size={13} /> RUANG TERPISAH</span><h2>Pilih <span>modulmu</span></h2></div><p>Setiap tombol membuka satu bagan khusus, bukan menggulir seluruh markas.</p></div>
            <div className="quick-access-grid">{navItems.filter((item) => item.id !== "dashboard").map(({ id, label, icon: Icon }, index) => <button className="quick-access-card" key={id} type="button" onClick={() => selectSection(id)}><span className="quick-access-icon"><Icon size={18} /></span><span className="quick-access-copy"><b>{label}</b><small>BUKA RUANG 0{index + 1}</small></span><ChevronRight size={15} /></button>)}</div>
          </section>
          </section>}

          {activeSection === "avatar" && <section className="module-screen avatar-screen">
            <div className="module-screen-heading"><p className="eyebrow">MODUL 01 / WORKSHOP PAW</p><h1>Avatar <span>penambang</span></h1><p>Racik tampilan kucing kru-mu. Perubahan tersimpan di perangkat dan ikut tampil di Markas, profil, serta panel arcade.</p></div>
            <section className="avatar-workshop panel" aria-label="Kustomisasi avatar kucing">
              <div className="avatar-preview-card">
                <div className="avatar-preview-stage" style={{ background: `radial-gradient(circle, ${selectedCoat.swatch}48 0%, #17231a 71%)` }}>
                  <span className="avatar-stage-orbit avatar-stage-orbit-one" /><span className="avatar-stage-orbit avatar-stage-orbit-two" />
                  <CatAvatar customization={avatarCustomization} size={238} className="cat-avatar-showcase" alt={`Kucing penambang ${selectedCoat.label} dengan ${selectedAccessory.label.toLowerCase()}`} priority />
                </div>
                <div className="avatar-preview-copy"><span className="section-label"><Sparkles size={13} /> PREVIEW LANGSUNG</span><h2>{save?.playerName || "Penjelajah Paw"}</h2><p>Avatar yang sama akan menemanimu menjelajahi setiap modul.</p><div className="avatar-current-style"><span style={{ background: selectedCoat.swatch }} />{selectedCoat.label}<i />{selectedAccessory.label}</div><small className="avatar-save-note"><LockKeyhole size={12} /> KOSMETIK GRATIS · SAVE OFFLINE</small></div>
              </div>
              <div className="avatar-controls">
                <section className="avatar-control-block" aria-labelledby="avatar-coat-title">
                  <div className="avatar-control-heading"><div><span className="section-label">01 / WARNA BULU</span><h3 id="avatar-coat-title">Pilih palet</h3></div><small>{AVATAR_COATS.length} GAYA</small></div>
                  <div className="avatar-option-grid avatar-coat-grid">{AVATAR_COATS.map((coat) => <button key={coat.id} className={`avatar-option ${avatarCustomization.coat === coat.id ? "avatar-option-active" : ""}`} type="button" aria-pressed={avatarCustomization.coat === coat.id} onClick={() => updateAvatar({ coat: coat.id })}><span className="avatar-color-swatch" style={{ background: coat.swatch }} /><span className="avatar-option-name">{coat.label}</span><small>{coat.id.toUpperCase()}</small></button>)}</div>
                </section>
                <section className="avatar-control-block" aria-labelledby="avatar-accessory-title">
                  <div className="avatar-control-heading"><div><span className="section-label">02 / DETAIL TAMBAHAN</span><h3 id="avatar-accessory-title">Pilih aksesori</h3></div><small>{AVATAR_ACCESSORIES.length} GAYA</small></div>
                  <div className="avatar-option-grid avatar-accessory-grid">{AVATAR_ACCESSORIES.map((accessory) => <button key={accessory.id} className={`avatar-option avatar-accessory-option ${avatarCustomization.accessory === accessory.id ? "avatar-option-active" : ""}`} type="button" aria-pressed={avatarCustomization.accessory === accessory.id} onClick={() => updateAvatar({ accessory: accessory.id })}><span className="avatar-accessory-symbol">{accessory.symbol || "✧"}</span><span className="avatar-option-name">{accessory.label}</span></button>)}</div>
                </section>
                <p className="avatar-cosmetic-disclaimer"><Check size={13} /> Hanya kosmetik; pilihan ini tidak mengubah LC, power, hadiah, atau progres liga.</p>
              </div>
            </section>
          </section>}

          {activeSection === "arcade" && <section className="module-screen"><div className="module-screen-heading"><p className="eyebrow">MODUL 01 / PERMAINAN SAMPINGAN</p><h1>Arcade <span>LegionCoin</span></h1><p>Ruang bermain mandiri untuk mendapatkan bonus LC virtual. Selesaikan sesi di layar ini untuk mengklaim hadiah.</p></div><ArcadeHub dailyEarned={arcadeEarnedToday} dailyLimit={MAX_ARCADE_REWARD_PER_DAY} avatar={avatarCustomization} playerName={save?.playerName || "Penjelajah Paw"} onComplete={completeArcade} /></section>}

          {activeSection === "rigs" && <MinerRoomScreen save={save} onAction={runAction} activeUpgradeTarget={upgradeEffect?.target} upgradeAnimationStyle={upgradeAnimationStyle} onOpenMarket={() => selectSection("market")} onOpenRacks={() => selectSection("racks")} leagueName={league.name} dailyReward={dailyReward} />}

          {activeSection === "league" && <section className="module-screen rigs-screen">
            <div className="section-heading" id="league"><div><p className="eyebrow">MODUL 05 / TANGGA PERINGKAT</p><h2>Liga &amp; <span>pool</span></h2></div><span className="count-chip"><Trophy size={13} /> {league.name.toUpperCase()} · PERINGKAT #{rankEstimate}</span></div>
            <section className="rigs-layout rigs-layout-single">
              <aside className="league-card panel">
                <div className="league-card-head"><div><span className="section-label">TANGGA PERINGKAT</span><h3>Jalur liga</h3></div><span className={`league-emblem emblem-${league.color}`}><Crown size={18} /></span></div>
                <div className={`league-banner league-${league.color}`}><span className="league-small">LIGA SAAT INI</span><strong>{league.name}</strong><span className="league-icon">{leagueIndex + 1 < 3 ? "✦" : "✧"}</span></div>
                <div className="league-progress-label"><span>POWER PERMANEN</span><b>{formatNumber(permanentPower)} TH/s</b></div><div className="league-progress"><span style={{ width: `${progressToLeague}%` }} /></div>
                <p className="league-next">{nextLeague ? <><b>{formatNumber(Math.max(0, nextLeague.minPower - permanentPower))} TH/s</b> lagi ke Liga {nextLeague.name}</> : "Kamu sudah mencapai liga tertinggi!"}</p>
                <div className="league-divider" /><div className="pool-info"><div><span>POOL LIGA / HARI</span><b>{formatNumber(league.dailyPool)} <small>LC</small></b></div><div><span>PORSI POWER-MU</span><b>{formatNumber(poolShare * 100, 2)}<small>%</small></b></div></div>
                <p className="simulation-note"><Activity size={13} /> Pool dan rival dihitung secara simulasi lokal. Power sementara menambah porsi, tetapi tidak menaikkan liga.</p>
              </aside>
            </section>
            <section className="rivals-card panel league-rivals-card"><div className="panel-header"><div><span className="section-label">SIMULASI LOKAL</span><h3>Rival satu liga</h3></div><span className="npc-label"><Activity size={12} /> NPC</span></div><p className="rivals-intro">Nama dan power berikut adalah karakter bot lokal—bukan leaderboard pemain sungguhan.</p><div className="rival-list">{RIVALS.map((rival, index) => <div className="rival-row" key={rival.name}><span className="rival-rank">0{index + 1}</span><span className="rival-avatar">{rival.icon}</span><b>{rival.name}</b><span className="rival-power">{formatNumber(Math.max(12, league.rivalPower * rival.offset))} TH/s</span><div className="rival-bar"><span style={{ width: `${Math.min(100, rival.offset * 53)}%` }} /></div></div>)}</div></section>
          </section>}

          {activeSection === "racks" && <ServerRackBayScreen save={save} onAction={runAction} activeUpgradeTarget={upgradeEffect?.target} upgradeAnimationStyle={upgradeAnimationStyle} onOpenMarket={() => selectSection("market")} onOpenRoom={() => selectSection("rigs")} />}

          {activeSection === "market" && <MinerMarketScreen save={save} onAction={runAction} />}

          {activeSection === "wallet" && <section className="module-screen">
            <div className="section-heading" id="wallet"><div><p className="eyebrow">MODUL 07 / PENYIMPANAN LOKAL</p><h2>Dompet <span>virtual</span></h2></div><span className="market-note"><LockKeyhole size={13} /> SAVE PERANGKAT INI</span></div>
            <section className="wallet-card panel wallet-screen-card">
              <div className="panel-header"><div><span className="section-label">PENYIMPANAN PERANGKAT</span><h3>Saldo dan aktivitas</h3></div><span className="wallet-lock"><LockKeyhole size={14} /></span></div>
              <div className="wallet-balance"><span>SALDO LEGIONCOIN</span><strong>{formatNumber(save?.balance || 0, 2)} <small>LC</small></strong><span className="wallet-hint"><span className="tiny-dot gold-dot" /> Token game lokal · bukan aset kripto</span></div>
              <div className="wallet-actions"><button disabled title="Game ini offline dan tidak memiliki penarikan"><ArrowUpRight size={14} /> Kirim <small>Nonaktif</small></button><button disabled title="Game ini offline dan tidak memiliki penarikan"><ArrowDownLeft size={14} /> Tarik <small>Nonaktif</small></button></div>
              <div className="history-head"><span>AKTIVITAS TERBARU</span><span>LOKAL</span></div>
              <div className="activity-list">{(save?.activity || []).slice(0, 4).map((item) => <div className="activity-row" key={item.id}><span className={`activity-icon activity-${item.kind}`}>{item.kind === "purchase" || item.kind === "upgrade" ? <ShoppingBag size={13} /> : item.kind === "boost" ? <Zap size={13} /> : item.kind === "arcade" ? <Gamepad2 size={13} /> : <Sparkles size={13} />}</span><span className="activity-copy"><b>{item.title}</b><small>{item.detail}</small></span><span className={`activity-amount ${(item.amount || 0) < 0 ? "negative" : ""}`}>{typeof item.amount === "number" ? `${item.amount > 0 ? "+" : ""}${formatNumber(item.amount, item.amount % 1 ? 2 : 0)}` : "—"}</span></div>)}</div>
              <p className="private-note"><ShieldCheck size={13} /> {storageAvailable ? "Save tersimpan di browser ini. Hapus data situs = progres terhapus." : "Save browser tidak tersedia; jangan tutup halaman jika ingin mempertahankan sesi ini."}</p>
            </section>
          </section>}

          <footer className="game-footer"><span><Cat size={14} /> LEGIONCOIN — GAME SIMULASI OFFLINE</span><span><CircleHelp size={13} /> Tidak memakai CPU untuk mining · Tidak ada nilai tukar riil</span></footer>
        </div>
      </section>

      {toast && <div className="toast" role="status"><Sparkles size={15} /> {toast}</div>}
    </main>
  );
}
