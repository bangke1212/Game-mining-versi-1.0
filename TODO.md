# TODO — Blockchain Mining Mission Control

- [x] Shell dashboard menampilkan banner permanen `SIMULATION MODE — NO REAL BLOCKCHAIN OR FINANCIAL VALUE`, sidebar dan topbar status simulasi.
- [x] Virtual Mining Room memiliki rack 3D, GPU/ASIC virtual, kipas, indikator, status worker dan kamera orbit/zoom.
- [x] Mining Overview menampilkan hashrate, worker aktif/offline, block count, reward SIM, transaksi, difficulty, block time, serta grafik ringkas.
- [x] Mining Fleet menampilkan spesifikasi virtual worker, toggle on/off, upgrade berbayar SIM, konsumsi daya, temperatur dan failure/recovery.
- [x] Blockchain Explorer menampilkan height, hash, previous hash, nonce, difficulty, timestamp, reward, transaksi dan validasi rantai.
- [x] Transaction Mempool mendukung transaksi virtual pending/confirmed/failed dan validasi saldo non-negatif.
- [x] Rewards & Economy menampilkan saldo, reward, supply, listrik virtual, revenue, profit/loss, ROI dan halving history.
- [x] System Metrics memisahkan virtual mining metrics dari process/server metrics.
- [x] Settings & Upgrades menyediakan simulation speed, interval, difficulty, reward, halving, SIM price, listrik, seed, failure rate dan presets.
- [x] Real-Time Event Log mencatat event kontrol, mining, transaction, reward, upgrade, failure, pause/resume dan reset.
- [x] State simulasi bertahan di localStorage dan refresh tidak membuat block atau reward baru.
- [x] Layout responsif untuk desktop dan mobile.
- [ ] Backend Node.js/file JSON dan endpoint REST dari brief master prompt belum dipindahkan ke repo Next.js ini; frontend MVP sengaja memprioritaskan simulator yang dapat langsung dipreview.
