# Blockchain Mining Mission Control

Dashboard simulasi mining blockchain yang terinspirasi NASA Mission Control. Aplikasi ini mensimulasikan worker, hashrate, block, transaksi, reward, virtual electricity cost, upgrade, failure/recovery, dan event log tanpa terhubung ke blockchain publik.

> **SIMULATION MODE — NO REAL BLOCKCHAIN OR FINANCIAL VALUE**
>
> Semua angka SIM, harga, profit, hashrate dan daya adalah parameter virtual untuk pembelajaran serta tidak memiliki nilai uang.

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

Aplikasi memiliki sembilan area: Mining Overview, Virtual Mining Room, Mining Fleet, Blockchain Explorer, Transaction Mempool, Rewards & Economy, System Metrics, Settings & Upgrades, serta Real-Time Event Log. State simulator disimpan di `localStorage`, sehingga refresh tidak menciptakan block atau reward baru. Tombol reset meminta konfirmasi dan membuat state genesis virtual baru.

## Catatan teknis

Repo awal merupakan dashboard OreOps berbasis Next.js dan React Three Fiber. Revisi ini mengganti domain UI menjadi Blockchain Mining Mission Control sambil mempertahankan stack Next.js, React, lucide-react, dan Three.js melalui React Three Fiber. Simulasi saat ini berjalan di browser sebagai MVP yang dapat langsung dipreview; backend Node.js/file JSON dan endpoint REST pada master prompt belum diaktifkan di repo ini.
