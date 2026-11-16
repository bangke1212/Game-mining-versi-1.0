# TODO — Roller-Mine Simulator (RollerCoin-like)

- [x] Banner permanen `SIMULATION MODE — NO REAL CRYPTO · NO REAL MONEY · NO REAL WITHDRAWAL` di semua halaman.
- [x] Engine RollerCoin-like di `lib/rollercoin/`: permanent power (miner di rack) + temporary power (mini-game, ada expiry).
- [x] RLT sebagai mata uang in-game: didapat dari mini-game, bonus block, daily login, dan quest; dipakai di Shop; tidak bisa di-withdraw.
- [x] Shop: 6 miner virtual (12–1500 GH/s), 2 rack, expand room, harga RLT jelas.
- [x] Mining Room: rack + miner yang dimiliki, on/off, jual kembali (refund 50%), scene 3D dipertahankan.
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
