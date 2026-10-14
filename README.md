# OreOps — Mining Operations Control

OreOps adalah prototype command center operasi tambang berbasis web. Aplikasi ini mengubah data operasional tambang menjadi ruang visual interaktif bergaya strategy game: fleet, pit, haul road, crusher, stockpile, workshop, produksi, dan alert dapat dipilih langsung dari spatial operations view.

> Versi ini menggunakan data simulasi. Tidak ada koneksi telemetry tambang nyata, kontrol alat berat, atau tindakan keselamatan otomatis.

## Yang berubah dari LegionCoin

- Loop GPU/rig/LC diganti menjadi **fleet dispatch**, production tracking, asset health, dan safety awareness.
- Markas visual diganti dengan **North Ridge Mine · Pit 01**.
- Asset 3D-style yang dapat dipilih: haul truck, excavator, crusher, stockpile, dan mobile workshop.
- Dashboard menampilkan production today, fleet availability, active equipment, dan safety status.
- Detail asset menampilkan posisi, status, payload/throughput, fuel, last update, operational note, dan recent events.
- Layer dapat dipindah antara Fleet, Production, dan Safety.
- Active haul cycles dan operational alerts tersedia di bawah scene.
- Hierarki navigasi menampilkan portfolio → site → pit/facility → equipment.
- Material flow timeline menghubungkan loading face → haul route → crusher → stockpile.

## Arsitektur prototype

Frontend berdiri sendiri agar alur produk dapat diuji tanpa menunggu integrasi data lapangan.

```text
mock operational entities
          ↓
React state + selection model
          ↓
Next.js dashboard + React Three Fiber + GLTF scene
          ↓
KPI / fleet dispatch / asset detail / material flow / alerts
```

Tahap berikutnya dapat mengganti data simulasi dengan API, WebSocket, GPS/telemetry, dispatch system, SCADA, GIS, atau database operasional tanpa mengubah pola interaksi dashboard.

## Jalankan secara lokal

Memerlukan Node.js 20.9+.

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

Validasi production:

```bash
npm run lint
npm run build
npm run generate:model
```

## Fitur operasional tersinkron

**3D ↔ dispatch table.** Klik truck di Canvas atau klik baris tabel memilih `selectedId` yang sama. Baris aktif diberi highlight, dan keyboard Enter/Space juga didukung.

**Multi-site hierarchy.** Sidebar menyimpan konteks `portfolio → site → pit/facility → equipment`. Pergantian site mereset pit ke fasilitas pertama dan mengembalikan selection ke fleet baseline.

**Material flow timeline.** Panel timeline menghubungkan loading face, haul route, primary crusher, dan ore stockpile dengan status complete/live/scheduled, tonase, timestamp, serta target material.

## Catatan implementasi

Scene utama memakai **React Three Fiber**, `@react-three/drei`, dan model **GLTF lokal** di `public/models/north-ridge-mine.gltf`. Model dibuat dari generator `scripts/generate-mine-gltf.mjs` sehingga asset dapat diregenerasi tanpa Unity atau game engine.

`Mine3DScene` menjalankan simulasi dispatch otomatis untuk HT-204 dan HT-118. Setiap 900 ms, state machine menggerakkan unit melalui fase `loading → hauling → dumping → returning`, menghitung progress, dan memperbarui tabel active haul cycles. Asset GLTF dan truck dapat dipilih langsung dari Canvas. Kamera dapat di-orbit dengan drag dan di-zoom dengan scroll.

Production deployment sebaiknya menambahkan autentikasi, role-based access, data freshness indicator, audit event, offline/degraded mode, coordinate conversion, dan validasi bahwa dashboard tidak menjadi sumber kontrol langsung untuk equipment.
