# Plan — Roller-Mine Simulator (RollerCoin-like)

## Scope
Mengubah dashboard Blockchain Mining Mission Control menjadi game mining
virtual ala konsep RollerCoin: mini-game memberi temporary power, miner virtual
memberi permanent power, power dibagi ke beberapa coin, dan tiap simulated
block membagi reward pool secara proporsional. Semua nilai virtual; tidak ada
crypto, wallet, atau pembayaran asli. Detail konsep ada di
`docs/ROLLERCOIN-CONCEPT.md`.

## Implementasi
- `lib/rollercoin/types.ts` — tipe `Miner`, `Rack`, `Coin`, `League`, `GameState`, `MiniGameResult`.
- `lib/rollercoin/catalog.ts` — katalog miner (6), rack (2), coin (6), league (5).
- `lib/rollercoin/engine.ts` — fungsi murni: power permanen/sementara, league,
  preview & apply block reward, shop (beli/jual miner, beli rack, expand room),
  mini-game reward, daily login & quest.
- `lib/rollercoin/storage.ts` — localStorage `rollercoin-state-v1` + migrasi
  sekali dari `bmmc-state` lama.
- `components/rollercoin/` — `MiningRoom`, `Shop`, `MiniGames` (Clicker Rush,
  Memory Match, Reaction Rush), `Wallet`, `League`, `ui`.
- `app/page.tsx` — shell tipis: navigasi 8 menu, state + stateRef, tick 1 detik
  untuk countdown dan penutupan block. Logika game tidak lagi tinggal di page.
- `app/mine-3d-scene.tsx` — ruang mining 3D dipertahankan sebagai visual Mining Room.
- `app/globals.css` — visual system lama dipertahankan, ditambah class `rc-*`
  untuk shop, mini-game, slider alokasi, dan quest.

## Data model
`GameState` memuat saldo RLT, saldo tiap coin, miner yang dimiliki (on/off),
rack, room level, alokasi % per coin (total 100), temporary power dengan
`expiresAt`, riwayat block, event log, statistik, state harian (login streak,
quest), interval block, dan `nextBlockAt`. Tick 1 detik menutup block saat
`now >= nextBlockAt`: pool tiap coin = `blockReward × leagueMultiplier ×
playerShare × allocation`, dengan `playerShare = power / (power + 20000)`
terhadap simulated network.

## Design
Dipertahankan dari Mission Control Minimalism: charcoal, mint telemetry
`#8CFFD1`, amber, lavender, kartu rounded, sidebar + topbar, banner simulasi
permanen. Judul dan brand diubah menjadi Roller-Mine Simulator.

- **Brand Voice:** "Build your rig, mine the blocks." / "Every block here is simulated."
- **Signature brand color:** telemetry mint `#8CFFD1`.

## Project structure
- `app/` UI, 3D room, global styling.
- `lib/rollercoin/` domain game (types, catalog, engine, storage).
- `components/rollercoin/` komponen UI per fitur.
- `docs/ROLLERCOIN-CONCEPT.md` dokumentasi konsep.
- `public/` aset visual yang sudah ada (tidak diubah).
