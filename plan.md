# Plan — Blockchain Mining Mission Control

## Scope
Mengubah dashboard OreOps menjadi pusat kendali simulasi mining blockchain yang sepenuhnya virtual. UI tetap berupa aplikasi Next.js single-page yang responsif, dengan state simulasi tersimpan di localStorage agar dapat dilanjutkan setelah refresh.

## Implementasi
- `app/page.tsx`: shell dashboard, navigasi 9 menu, mesin simulasi interval 3 detik, worker controls, transaksi, upgrade, pause/resume/reset, settings dan event log.
- `app/mine-3d-scene.tsx`: ruang mining 3D berbasis React Three Fiber dengan rack, ASIC/GPU virtual, kipas, indikator, kamera orbit dan HUD.
- `app/globals.css`: visual system dark charcoal, mint telemetry, amber warnings, rounded control-room cards, responsive mobile layout.
- `lib/oreops-data.ts`: diganti dengan model virtual workers, blocks, transactions dan config.
- `public/manus-routes.json`: manifest rute dashboard.

## Data model
State memuat workers, blocks, transactions, events, history, balance SIM, total supply dan config. Tick menghitung hashrate aktif, virtual power cost, block probability berbasis hashrate/network/difficulty, reward dan transaction confirmations. Semua ekonomi diberi label SIMULATED.

## Design
Tiga style alternatif: Mission Control Minimalism (0.06), Terminal Luxe (0.04), Neon Observatory (0.08). Dipilih **Mission Control Minimalism**.

- **Design Movement:** NASA mission-control meets Linear operations software.
- **Core Principles:** information density tanpa kebisingan, status selalu terlihat, virtual data dipisahkan dari metrik server, kontrol terasa aman dan reversible.
- **Color Philosophy:** charcoal sebagai ruang observasi; mint untuk sistem sehat; amber untuk perhatian; coral untuk fault; lavender untuk data blockchain.
- **Layout Paradigm:** sidebar mission selector + command topbar + responsive asymmetric content panels, bukan landing page terpusat.
- **Signature Elements:** SIMULATED ribbon, cyan/mint telemetry rails, block/hash monospace chips.
- **Interaction Philosophy:** setiap aksi memberi feedback event; destructive reset memakai konfirmasi; worker state berubah langsung dan tersimpan.
- **Animation:** pulse lembut pada telemetry, shimmer pada mining rigs, fan rotation dan camera orbit pada 3D room.
- **Typography:** Geist/Inter-like sans untuk UI, DM Mono fallback untuk hashes, metrics, labels.
- **Brand Essence:** command center untuk memahami mining blockchain tanpa risiko nyata; tenang, teknis, edukatif.
- **Brand Voice:** “Run the model, not the risk.” / “Every block here is simulated.”
- **Wordmark:** hexagonal node mark + stacked `BLOCKCHAIN / MINING` lockup.
- **Signature brand color:** telemetry mint `#8CFFD1`.

## Project structure
- `app/` UI, 3D room, global styling.
- `lib/` domain constants and types.
- `public/` route manifest and existing visual assets.
- `README.md` beginner run instructions and simulation disclaimer.
