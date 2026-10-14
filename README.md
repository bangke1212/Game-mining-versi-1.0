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
- Site switcher berpindah antara North Ridge Mine dan South Valley Mine.

## Arsitektur prototype

Saat ini frontend sengaja berdiri sendiri agar alur produk dapat diuji tanpa menunggu integrasi data lapangan.

```text
mock operational entities
          ↓
React state + selection model
          ↓
Next.js dashboard + CSS spatial scene
          ↓
KPI / fleet dispatch / asset detail / alerts
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
```

## Catatan implementasi

Scene saat ini menggunakan CSS perspective/isometric agar ringan dan tidak memerlukan Unity atau game engine. Struktur komponen dan data sudah dipisahkan secara konseptual sehingga dapat ditingkatkan ke React Three Fiber + GLTF/GLB terrain ketika model 3D nyata dibutuhkan.

Production deployment sebaiknya menambahkan autentikasi, role-based access, data freshness indicator, audit event, offline/degraded mode, coordinate conversion, dan validasi bahwa dashboard tidak menjadi sumber kontrol langsung untuk equipment.
