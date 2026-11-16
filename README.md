# Roller-Mine Simulator — Mining Game (Simulation)

Game mining 2D/virtual ala konsep RollerCoin: bangun rig virtual, main
mini-game untuk power sementara, beli miner untuk power permanen, bagi power
ke beberapa coin, dan kumpulkan bagianmu dari tiap simulated block.

> **SIMULATION MODE — NO REAL CRYPTO, NO REAL MONEY, NO REAL WITHDRAWAL**
>
> Semua RLT, coin, hashrate, dan reward adalah angka virtual untuk permainan.
> Game ini tidak terhubung ke blockchain, wallet, atau pembayaran apa pun, dan
> tidak menghasilkan crypto asli. Terinspirasi konsep RollerCoin (lihat
> `docs/ROLLERCOIN-CONCEPT.md`), bukan clone bermerek dan bukan afiliasi.

## Cara main

1. **Main mini-game** (Clicker Rush, Memory Match, Reaction Rush) untuk dapat
   temporary mining power (+GH/s selama 10 menit) dan bonus RLT.
2. **Beli miner di Shop** pakai RLT, pasang di rack di Mining Room — itu
   permanent power kamu.
3. **Atur alokasi power** per coin (BTC, ETH, DOGE, SOL, BNB, LTC) di menu
   Blocks & Leagues. Total selalu 100%.
4. **Tiap block** (default 60 detik, bisa diubah di Settings) reward pool tiap
   coin dibagi proporsional dengan power kamu. Naik league (Bronze → Titan)
   untuk pengali reward pool yang lebih besar.
5. **Klaim daily login & quest** di Wallet untuk RLT tambahan.

## Jalankan untuk pemula

1. Pastikan Node.js 20 atau lebih baru terpasang.
2. Jalankan `npm install` dari folder repo.
3. Jalankan `npm run dev`.
4. Buka URL yang ditampilkan Next.js, biasanya `http://localhost:3000`.

Perintah validasi:

```bash
npm run lint
npm run build
```

## Menu yang tersedia

Delapan area: Mining Overview, Mining Room (termasuk scene 3D), Miner Shop,
Mini-Games, Wallet & Quests, Blocks & Leagues, Settings, serta Event Log.
Progress disimpan di `localStorage` key `rollercoin-state-v1`, sehingga refresh
tidak menghapus progress. State lama dashboard (`bmmc-state`) dimigrasi sekali
menjadi grant RLT. Tombol reset meminta konfirmasi.

## Struktur repo

- `lib/rollercoin/types.ts` — tipe `Miner`, `Rack`, `Coin`, `League`, `GameState`
- `lib/rollercoin/catalog.ts` — katalog miner, rack, coin, league
- `lib/rollercoin/engine.ts` — logika inti (power, league, block reward, shop, quest)
- `lib/rollercoin/storage.ts` — load/save localStorage + migrasi state lama
- `components/rollercoin/` — `MiningRoom`, `Shop`, `MiniGames`, `Wallet`, `League`
- `app/page.tsx` — shell tipis (navigasi + tick 1 detik), bukan lagi 1 file 26KB
- `app/mine-3d-scene.tsx` — ruang mining 3D (React Three Fiber), dipertahankan
- `docs/ROLLERCOIN-CONCEPT.md` — konsep yang ditiru dan yang sengaja tidak ditiru

## Catatan teknis

Next.js 16 (static export) + React 19 + TypeScript + lucide-react + Three.js
via React Three Fiber. Semua simulasi berjalan di browser; tidak ada backend,
tidak ada network call eksternal untuk game ini.
