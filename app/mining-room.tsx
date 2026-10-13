import Image from "next/image";
import type { CSSProperties } from "react";
import { BatteryCharging, Check, ChevronRight, Coins, Cpu, HardDrive, LockKeyhole, Plus, Server, ShoppingBag, Sparkles, Store, Zap } from "lucide-react";
import {
  GameSave,
  getPermanentPower,
  getRoomSlotCapacity,
  getUpgradeCost,
  MAX_ITEM_LEVEL,
  MinerUnit,
  MINERS,
  purchaseMinerUnit,
  purchaseRackUnit,
  RackUnit,
  SERVER_RACKS,
  setMinerUnitPlaced,
  setRackUnitPlaced,
  upgradeMinerUnit,
  upgradeRackUnit,
} from "@/lib/legioncoin";

const formatNumber = (value: number, digits = 0) => new Intl.NumberFormat("id-ID", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);

type RoomAction = (action: (current: GameSave, time: number) => GameSave, success: string, upgradeTarget?: string) => void;
type SharedProps = { save: GameSave | null; onAction: RoomAction };
type UpgradeProps = SharedProps & { activeUpgradeTarget?: string; upgradeAnimationStyle: (target: string) => CSSProperties | undefined };

function MinerMachine({ unit, index, save, onAction, activeUpgradeTarget, upgradeAnimationStyle }: UpgradeProps & { unit: MinerUnit; index: number }) {
  const miner = MINERS.find((item) => item.id === unit.minerId);
  if (!miner) return null;
  const target = `miner:${unit.id}`;
  const isUpgrading = activeUpgradeTarget === target;
  const atMax = unit.level >= MAX_ITEM_LEVEL;
  const cost = getUpgradeCost(miner.id, unit.level);
  return (
    <article className={`room-machine ${index === 0 ? "room-machine-featured" : ""} ${isUpgrading ? "upgrade-celebrate" : ""}`} style={upgradeAnimationStyle(target)}>
      {isUpgrading && <span className="upgrade-flash-label"><Sparkles size={10} /> LEVEL UP</span>}
      <div className={`room-machine-art room-machine-tone-${index % 5}`}><div className="room-machine-leds"><i /><i /><i /></div><Cpu size={31} /><span aria-hidden="true">🐱</span></div>
      <div className="room-machine-info"><div className="room-machine-title"><div><small>{miner.label.toUpperCase()} · LV.{String(unit.level).padStart(2, "0")}</small><b>{miner.name}</b></div><span className="room-machine-number">#{String(index + 1).padStart(2, "0")}</span></div>
        <span className="room-machine-power"><Zap size={12} /> {formatNumber(miner.power * unit.level)} TH/s</span>
        <div className="room-machine-actions"><button type="button" className="room-action-upgrade" disabled={!save || save.balance < cost || atMax} onClick={() => onAction((current, time) => upgradeMinerUnit(current, unit.id, time), `${miner.name} ditingkatkan!`, target)}><Zap size={11} />{atMax ? "MAKS" : `UPGRADE · ${formatNumber(cost)} LC`}</button><button type="button" className="room-action-store" onClick={() => onAction((current, time) => setMinerUnitPlaced(current, unit.id, false, time), "Miner dipindahkan ke inventori.")} aria-label={`Simpan ${miner.name} ke inventori`}>SIMPAN</button></div>
      </div>
    </article>
  );
}

function RackUnitCard({ unit, save, onAction, activeUpgradeTarget, upgradeAnimationStyle, compact = false }: UpgradeProps & { unit: RackUnit; compact?: boolean }) {
  const rack = SERVER_RACKS.find((item) => item.id === unit.rackId);
  if (!rack || !save) return null;
  const target = `rack:${unit.id}`;
  const isUpgrading = activeUpgradeTarget === target;
  const atMax = unit.level >= MAX_ITEM_LEVEL;
  const cost = getUpgradeCost(rack.id, unit.level);
  const installedMiners = save.minerUnits.filter((miner) => miner.placed).length;
  const canStore = installedMiners <= getRoomSlotCapacity(save) - rack.slots;
  const storeHelpId = `rack-store-help-${unit.id}`;
  return (
    <article className={`room-rack-card ${unit.placed ? "room-rack-card-installed" : "room-rack-card-inventory"} ${compact ? "room-rack-card-compact" : ""} ${isUpgrading ? "upgrade-celebrate" : ""}`} style={upgradeAnimationStyle(target)}>
      {isUpgrading && <span className="upgrade-flash-label"><Sparkles size={10} /> RACK LEVEL UP</span>}
      <div className="room-rack-icon"><Server size={compact ? 23 : 29} /><span aria-hidden="true">🐈</span></div>
      <div className="room-rack-copy"><small>{rack.label.toUpperCase()} · LV.{String(unit.level).padStart(2, "0")}</small><b>{rack.name}</b><span>{rack.slots} SLOT · +{formatNumber(rack.power * unit.level)} TH/s {unit.placed ? "· TERPASANG" : "· INVENTORI"}</span></div>
      <div className="room-rack-actions">
        <button type="button" className="room-action-upgrade" disabled={save.balance < cost || atMax} onClick={() => onAction((current, time) => upgradeRackUnit(current, unit.id, time), `${rack.name} ditingkatkan!`, target)}><Zap size={11} />{atMax ? "LEVEL MAKS" : `UPGRADE · ${formatNumber(cost)} LC`}</button>
        {unit.placed
          ? <button type="button" className="room-action-store" disabled={!canStore} aria-describedby={!canStore ? storeHelpId : undefined} title={!canStore ? "Keluarkan miner hingga kapasitas cukup sebelum menyimpan rak" : undefined} onClick={() => onAction((current, time) => setRackUnitPlaced(current, unit.id, false, time), "Rak dipindahkan ke inventori.")}>SIMPAN RAK</button>
          : <button type="button" className="room-action-install" onClick={() => onAction((current, time) => setRackUnitPlaced(current, unit.id, true, time), "Rak terpasang · slot ruang bertambah.")}><Plus size={12} /> PASANG RAK</button>}
      </div>
      {unit.placed && !canStore && <p className="room-action-help" id={storeHelpId} role="note">Keluarkan miner sampai kapasitas cukup sebelum menyimpan rak ini.</p>}
    </article>
  );
}

function MinerInventoryCard({ unit, index, save, onAction, activeUpgradeTarget, upgradeAnimationStyle }: UpgradeProps & { unit: MinerUnit; index: number }) {
  const miner = MINERS.find((item) => item.id === unit.minerId);
  if (!miner || !save) return null;
  const target = `miner:${unit.id}`;
  const isUpgrading = activeUpgradeTarget === target;
  const atMax = unit.level >= MAX_ITEM_LEVEL;
  const cost = getUpgradeCost(miner.id, unit.level);
  const freeSlots = getRoomSlotCapacity(save) - save.minerUnits.filter((item) => item.placed).length;
  const installHelpId = `miner-slot-help-${unit.id}`;
  return (
    <article className={`room-inventory-item ${isUpgrading ? "upgrade-celebrate" : ""}`} style={upgradeAnimationStyle(target)}>
      {isUpgrading && <span className="upgrade-flash-label"><Sparkles size={10} /> LEVEL UP</span>}
      <div className={`room-inventory-glyph room-machine-tone-${index % 5}`}><Cpu size={20} /><span aria-hidden="true">🐱</span></div>
      <div className="room-inventory-copy"><small>UNIT {String(index + 1).padStart(2, "0")} · {miner.label.toUpperCase()}</small><b>{miner.name}</b><span>LV.{unit.level} · +{formatNumber(miner.power * unit.level)} TH/s saat dipasang</span></div>
      <div className="room-inventory-actions"><button type="button" className="room-action-install" disabled={freeSlots <= 0} aria-describedby={freeSlots <= 0 ? installHelpId : undefined} title={freeSlots <= 0 ? "Slot penuh; pasang rak server tambahan" : undefined} onClick={() => onAction((current, time) => setMinerUnitPlaced(current, unit.id, true, time), `${miner.name} dipasang di ruang miner.`)}><Plus size={12} /> PASANG</button><button type="button" className="room-action-upgrade" disabled={save.balance < cost || atMax} onClick={() => onAction((current, time) => upgradeMinerUnit(current, unit.id, time), `${miner.name} ditingkatkan!`, target)}><Zap size={11} />{atMax ? "MAKS" : `UPGRADE · ${formatNumber(cost)} LC`}</button></div>
      {freeSlots <= 0 && <p className="room-action-help" id={installHelpId} role="note">Ruang penuh. Pasang rack server tambahan dari Inventori atau Pasar untuk membuka slot.</p>}
    </article>
  );
}

export function MinerRoomScreen({ save, onAction, activeUpgradeTarget, upgradeAnimationStyle, onOpenMarket, onOpenRacks, dailyReward }: UpgradeProps & { onOpenMarket: () => void; onOpenRacks: () => void; dailyReward: number }) {
  const placedMiners = save?.minerUnits.filter((unit) => unit.placed) || [];
  const placedRacks = save?.rackUnits.filter((unit) => unit.placed) || [];
  const inventoryMiners = save?.minerUnits.filter((unit) => !unit.placed) || [];
  const inventoryRacks = save?.rackUnits.filter((unit) => !unit.placed) || [];
  const capacity = save ? getRoomSlotCapacity(save) : 6;
  const freeSlots = Math.max(0, capacity - placedMiners.length);
  const permanentPower = save ? getPermanentPower(save) : 0;
  const previewEmptySlots = Math.min(8, freeSlots);
  const hiddenEmptySlots = Math.max(0, freeSlots - previewEmptySlots);
  return (
    <section className="module-screen miner-room-screen">
      <div className="module-screen-heading"><p className="eyebrow">ROOM 01 / LEGION OUTPOST</p><h1>Ruang <span>Miner</span></h1><p>Beli rig di Pasar, pasang unit dari inventori, lalu susun markas tambang kucingmu. Hanya perangkat terpasang yang menyumbang Mining Power.</p></div>
      <div className="room-status-strip" aria-label="Status ruang miner">
        <article className="room-status-card room-status-electric"><span><BatteryCharging size={13} /> GRID VIRTUAL</span><b>100%</b><small>DAYA SIMULASI · TANPA PENALTI</small></article>
        <article className="room-status-card"><span><Zap size={13} /> POWER TERPASANG</span><b>{formatNumber(permanentPower)} <small>TH/s</small></b><small>{placedMiners.length} MINER · {placedRacks.length} RAK</small></article>
        <article className="room-status-card" aria-live="polite"><span><Server size={13} /> KAPASITAS RUANG</span><b>{placedMiners.length} <small>/ {capacity} SLOT</small></b><small>{freeSlots} SLOT TERSEDIA</small></article>
        <article className="room-status-card"><span><Coins size={13} /> ESTIMASI HADIAH</span><b>{formatNumber(dailyReward, 2)} <small>LC/HARI</small></b><small>HASIL SIMULASI · MAKS. 24 JAM OFFLINE</small></article>
      </div>

      <section className="physical-room panel" aria-label="Visual ruang mining LegionCoin">
        <div className="physical-room-topbar"><div><span className="section-label"><HardDrive size={13} /> CAT MINING BAY</span><b>MARKAS 01 <i /> OPERASIONAL</b></div><span className="room-slot-chip">{placedMiners.length}/{capacity} SLOT RIG</span></div>
        <div className="room-scene">
          <div className="room-scene-wall"><span className="room-window"><i /><i /><i /></span><span className="room-wall-clock">{new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span><span className="room-wall-poster">PAW<br />POWER</span>
            <div className="room-rack-wall" aria-label="Rak server terpasang">
              {placedRacks.length ? placedRacks.map((unit, index) => {
                const rack = SERVER_RACKS.find((item) => item.id === unit.rackId);
                if (!rack) return null;
                return <div className={`room-wall-rack room-wall-rack-${index % 4}`} key={unit.id}><div className="room-wall-rack-top"><span /><span /><span /></div><Server size={24} /><b>{rack.name}</b><small>{rack.slots} SLOT · LV.{unit.level}</small><div className="room-rack-led-row"><i /><i /><i /><i /></div></div>;
              }) : <div className="room-rack-empty"><Server size={21} /><span>RAK SERVER MENUNGGU</span><button type="button" onClick={onOpenRacks}>BUKA BAY RAK <ChevronRight size={12} /></button></div>}
            </div>
          </div>
          <div className="room-scene-shelf-label"><span>MINER RIGS</span><small>PERANGKAT TERPASANG · OTOMATIS MENAMBANG</small></div>
          <div className="room-machine-grid">
            {placedMiners.map((unit, index) => <MinerMachine key={unit.id} unit={unit} index={index} save={save} onAction={onAction} activeUpgradeTarget={activeUpgradeTarget} upgradeAnimationStyle={upgradeAnimationStyle} />)}
            {Array.from({ length: previewEmptySlots }, (_, index) => <div className="room-empty-miner-slot" key={`empty-${index}`}><span><Plus size={17} /></span><b>SLOT KOSONG</b><small>{index + placedMiners.length + 1}/{capacity}</small></div>)}
            {hiddenEmptySlots > 0 && <div className="room-hidden-slots" role="note" aria-label={`${hiddenEmptySlots} slot kosong lainnya tersedia`}><b>+{hiddenEmptySlots}</b><span>SLOT KOSONG LAINNYA TERSEDIA</span></div>}
            {placedMiners.length === 0 && <div className="room-no-miners"><Cpu size={30} /><b>Belum ada miner terpasang</b><span>Pasang unit dari Inventori untuk mulai menghasilkan power.</span></div>}
          </div>
          <div className="room-scene-floor"><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /></div>
          <div className="room-scene-footer"><span><i /> HASHING SIMULASI AKTIF</span><span>LC VIRTUAL · TANPA BLOCKCHAIN</span></div>
        </div>
      </section>

      <section className="room-inventory-panel panel" aria-label="Inventori barang mining">
        <div className="room-inventory-heading"><div><span className="section-label"><ShoppingBag size={13} /> ITEMS PANEL ({inventoryMiners.length + inventoryRacks.length})</span><h2>Inventori markas</h2><p>Unit yang dibeli masuk di sini. Pasang untuk memasukkan ke ruang dan mulai menambah power.</p></div><div className="room-inventory-heading-actions"><button type="button" className="room-secondary-button" onClick={onOpenRacks}><Server size={13} /> KELOLA RAK</button><button type="button" className="room-market-button" onClick={onOpenMarket}><Store size={13} /> PASAR</button></div></div>
        {inventoryRacks.length + inventoryMiners.length > 0 ? <div className="room-inventory-list">
          {inventoryRacks.map((unit) => <RackUnitCard key={unit.id} unit={unit} save={save} onAction={onAction} activeUpgradeTarget={activeUpgradeTarget} upgradeAnimationStyle={upgradeAnimationStyle} compact />)}
          {inventoryMiners.map((unit, index) => <MinerInventoryCard key={unit.id} unit={unit} index={index} save={save} onAction={onAction} activeUpgradeTarget={activeUpgradeTarget} upgradeAnimationStyle={upgradeAnimationStyle} />)}
        </div> : <div className="room-inventory-empty"><Check size={15} /><span>Semua unit sudah terpasang. Tambah miner atau rack lewat Pasar untuk memperluas markas.</span><button type="button" onClick={onOpenMarket}>BUKA PASAR <ChevronRight size={12} /></button></div>}
        <div className="room-inventory-foot"><LockKeyhole size={12} /> Tata ruang tersimpan offline di browser ini · mesin tidak memakai CPU sungguhan.</div>
      </section>
    </section>
  );
}

export function ServerRackBayScreen({ save, onAction, activeUpgradeTarget, upgradeAnimationStyle, onOpenMarket, onOpenRoom }: UpgradeProps & { onOpenMarket: () => void; onOpenRoom: () => void }) {
  const racks = save?.rackUnits || [];
  const placedCount = racks.filter((unit) => unit.placed).length;
  const totalCapacity = save ? getRoomSlotCapacity(save) : 6;
  return (
    <section className="module-screen rack-bay-screen">
      <div className="module-screen-heading"><p className="eyebrow">SEKTOR 04 / INFRASTRUKTUR KUCING</p><h1>Rak <span>Server</span></h1><p>Setiap rack yang dipasang menambah power server dan ruang untuk memasang lebih banyak miner.</p></div>
      <div className="rack-bay-summary"><div><span>RAK TERPASANG</span><b>{placedCount} UNIT</b></div><div><span>KAPASITAS MINER</span><b>{totalCapacity} SLOT</b></div><div><span>POWER DARI RAK</span><b>{formatNumber(save ? getPermanentPower(save) - save.minerUnits.filter((unit) => unit.placed).reduce((sum, unit) => sum + (MINERS.find((miner) => miner.id === unit.minerId)?.power || 0) * unit.level, 0) : 0)} TH/s</b></div><button type="button" className="room-market-button" onClick={onOpenMarket}><Store size={14} /> BELI RAK</button></div>
      <section className="rack-bay-grid">
        {racks.map((unit, index) => {
          const rack = SERVER_RACKS.find((item) => item.id === unit.rackId);
          if (!rack) return null;
          return <article className={`rack-bay-tile panel ${unit.placed ? "rack-bay-installed" : "rack-bay-inventory"}`} key={unit.id}>
            <div className={`rack-bay-art room-wall-rack-${index % 4}`}><div className="room-rack-led-row"><i /><i /><i /><i /></div><Server size={46} /><span>🐈</span></div>
            <div className="rack-bay-copy"><small>{rack.label.toUpperCase()} · UNIT {String(index + 1).padStart(2, "0")}</small><h2>{rack.name}</h2><p>{rack.description}</p><div className="rack-bay-specs"><span><Zap size={13} /> +{formatNumber(rack.power * unit.level)} TH/s {unit.placed ? "AKTIF" : "SAAT DIPASANG"}</span><span><HardDrive size={13} /> {rack.slots} SLOT TAMBAHAN</span><span className="rig-level">LV.{String(unit.level).padStart(2, "0")}</span></div><RackUnitCard unit={unit} save={save} onAction={onAction} activeUpgradeTarget={activeUpgradeTarget} upgradeAnimationStyle={upgradeAnimationStyle} compact /></div>
          </article>;
        })}
        {racks.length === 0 && <div className="rack-bay-empty panel"><Server size={37} /><h2>Bay rak masih kosong</h2><p>Belum ada server rack di markas. Beli dari Pasar untuk menambah slot miner dan power virtual.</p><button type="button" className="room-market-button" onClick={onOpenMarket}><Store size={14} /> BUKA PASAR</button></div>}
      </section>
      <button type="button" className="room-secondary-button rack-back-room" onClick={onOpenRoom}><HardDrive size={13} /> KEMBALI KE RUANG MINER</button>
    </section>
  );
}

export function MinerMarketScreen({ save, onAction }: SharedProps) {
  return (
    <section className="module-screen market-screen">
      <section className="market-section" id="market">
        <div className="section-heading"><div><p className="eyebrow">SEKTOR 06 / PERDAGANGAN LOKAL</p><h2>Pasar unit <span>virtual</span></h2></div><span className="market-note"><LockKeyhole size={13} /> TANPA UANG ASLI</span></div>
        <div className="market-explainer"><HardDrive size={15} /><span>Setiap pembelian menambahkan <b>unit terpisah</b> ke inventori. Pasang unit di Ruang Miner agar power-nya aktif; beli unit yang sama lebih dari satu kali untuk membangun farm.</span></div>
        <div className="market-grid">
          {MINERS.filter((miner) => miner.id !== "starter-cat").map((miner, index) => {
            const units = save?.minerUnits.filter((unit) => unit.minerId === miner.id) || [];
            const installed = units.filter((unit) => unit.placed).length;
            const affordable = Boolean(save && save.balance >= miner.price);
            return <article className={`market-card panel ${units.length ? "market-owned" : ""}`} key={miner.id}>
              <div className={`market-art market-art-${index}`}><div className="market-ring" /><Image src="/images/legion-cat-mascot-512.png" width={102} height={102} alt="" /><span className="market-power"><Zap size={12} /> +{miner.power} TH/s / UNIT</span></div>
              <div className="market-card-body"><span className="item-type">{miner.label.toUpperCase()} · UNIT FISIK</span><h3>{miner.name}</h3><p>{miner.description} Unit baru masuk ke inventori, bukan otomatis dipasang.</p><div className="market-bottom"><span className="item-price"><Coins size={15} /> {formatNumber(miner.price)} <small>LC / UNIT</small></span><button className="buy-button" type="button" disabled={!save || !affordable} onClick={() => onAction((current, time) => purchaseMinerUnit(current, miner.id, time), `${miner.name} masuk inventori.`)}><Plus size={13} /> BELI UNIT</button></div>{units.length > 0 && <span className="owned-caption"><Check size={11} /> {units.length} UNIT · {installed} TERPASANG</span>}</div>
            </article>;
          })}
        </div>
        <div className="market-subheading"><div><span className="section-label"><Server size={13} /> BAY RAK SERVER</span><h3>Rak server kucing</h3></div><span>RAK MEMBERI SLOT + POWER SAAT TERPASANG</span></div>
        <div className="market-grid rack-market-grid">
          {SERVER_RACKS.map((rack, index) => {
            const units = save?.rackUnits.filter((unit) => unit.rackId === rack.id) || [];
            const installed = units.filter((unit) => unit.placed).length;
            const affordable = Boolean(save && save.balance >= rack.price);
            return <article className={`market-card panel ${units.length ? "market-owned" : ""}`} key={rack.id}>
              <div className={`market-art rack-market-art market-art-${index}`}><div className="market-ring" /><div className="rack-market-icon"><Server size={43} /><span>🐈</span></div><span className="market-power"><Zap size={12} /> +{formatNumber(rack.power)} TH/s · {rack.slots} SLOT</span></div>
              <div className="market-card-body"><span className="item-type">{rack.label.toUpperCase()} · RACK FISIK</span><h3>{rack.name}</h3><p>{rack.description} Pasang rack dari Inventori agar power dan kapasitasnya aktif.</p><div className="market-bottom"><span className="item-price"><Coins size={15} /> {formatNumber(rack.price)} <small>LC / UNIT</small></span><button className="buy-button" type="button" disabled={!save || !affordable} onClick={() => onAction((current, time) => purchaseRackUnit(current, rack.id, time), `${rack.name} masuk inventori.`)}><Plus size={13} /> BELI RAK</button></div>{units.length > 0 && <span className="owned-caption"><Check size={11} /> {units.length} UNIT · {installed} TERPASANG</span>}</div>
            </article>;
          })}
        </div>
      </section>
    </section>
  );
}
