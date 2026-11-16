# TODO — Roller-Mine Simulator (RollerCoin-like)

- [x] Banner permanen `SIMULATION MODE — NO REAL CRYPTO · NO REAL MONEY · NO REAL WITHDRAWAL` di semua halaman.
- [x] Engine RollerCoin-like di `lib/rollercoin/`: permanent power (miner di rack) + temporary power (mini-game, ada expiry).
- [x] RLT sebagai mata uang in-game: didapat dari mini-game, bonus block, daily login, dan quest; dipakai di Shop; tidak bisa di-withdraw.
- [x] Shop: 6 miner virtual (12–1500 GH/s), 2 rack, expand room, harga RLT jelas.
- [x] Mining Room: rack + miner yang dimiliki, on/off, jual kembali (refund 50%). Sejak 2026-11-16: rack 3D diganti Rig Rack 2D (`components/rollercoin/RigRack.tsx`) — tiap miner satu kartu slot bernomor dengan live GH/s, suhu, fan, watt, uptime, tombol on/off + jual; slot kosong bergaris putus-putus; tidak ada lagi label 3D yang tumpang tindih. File 3D (`app/mine-3d-scene.tsx`, `app/r3f.css`) dan data lama (`lib/oreops-data.ts`) dihapus.
- [x] Alokasi power per coin (BTC/ETH/DOGE/SOL/BNB/LTC) dengan slider yang selalu total 100%.
- [x] Block reward: interval default 60 detik (dipercepat untuk demo, dijelaskan di UI), countdown, history block, pembagian pool proporsional.
- [x] League: Bronze → Silver → Gold → Diamond → Titan berdasarkan permanent power, pengali pool ×1 → ×3.
- [x] Wallet: saldo RLT + tiap coin (simulasi), daily quest / login streak, tombol "withdraw simulasi" yang jelas hanya demo.
- [x] Mini-games yang benar-benar bisa dimainkan: Clicker Rush, Memory Match, Reaction Rush — masing-masing memberi temporary power + RLT.
- [x] Save localStorage (`rollercoin-state-v1`), migrasi sekali dari state lama `bmmc-state`, reset dengan konfirmasi.
- [x] `app/page.tsx` dipecah menjadi shell tipis + komponen di `components/rollercoin/`.
- [x] `docs/ROLLERCOIN-CONCEPT.md` mendokumentasikan konsep yang ditiru dan yang tidak ditiru.
- [ ] Backend / multiplayer / leaderboard pemain asli — sengaja tidak dibuat (game ini murni simulasi browser).
- [ ] Payout crypto asli — sengaja tidak dibuat, dan tidak akan dibuat.
- [x] Live Rig Telemetry (`lib/rollercoin/telemetry.ts` + `components/rollercoin/LiveTelemetry.tsx`): live GH/s per miner (±3% deterministik), suhu, fan, watt, uptime, sparkline 60 detik, countdown block, boost dengan countdown mm:ss; tampil di Overview (strip) dan Mining Room (lengkap). Label 3D kini memakai miner asli dari state, bukan nama hardcoded.
- [x] Rig Rack 2D ganti scene 3D (2026-11-16): `components/rollercoin/RigRack.tsx`, konten live dirender hanya setelah mount (tidak ada lagi hydration mismatch), deskripsi miner tampil penuh tanpa ellipsis aneh. Diverifikasi di browser sungguhan (Playwright headless Chromium): HP 390×844 + desktop 1280×900, tidak ada horizontal overflow, tidak ada unit rack yang tumpang tindih, tidak ada teks terpotong, 0× "ASIC-07"/"GPU-12"/"CUTE ASIC BAY".
