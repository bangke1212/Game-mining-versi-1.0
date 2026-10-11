# Arcade Nexus Mining

MVP **virtual mining simulator** berbasis Next.js. Pemain mengelola mining rig, mengumpulkan NEX virtual, melakukan upgrade, dan membeli item dari shop marketplace.

> Game ini tidak melakukan crypto mining sungguhan, tidak memakai CPU pengguna untuk mining, dan semua NEX bersifat virtual.

## Fitur

- Dashboard mining floor dengan hash rate dan estimasi yield
- Reward timer dan tombol claim
- Upgrade Starter Rig
- Aktivasi rig kedua
- Shop marketplace dengan item Cryo Fan, Nebula GPU, dan Pulse Booster
- Inventory/progres tersimpan di browser dengan `localStorage`
- API katalog marketplace di `/api/market`
- Responsive untuk desktop dan mobile

## Menjalankan lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Deploy ke Vercel

1. Import repository GitHub ini ke Vercel.
2. Framework preset: **Next.js**.
3. Build command: `next build` atau default Vercel.
4. Install command: `npm install`.
5. Tidak ada environment variable yang diperlukan untuk MVP ini.

## Roadmap full-stack berikutnya

- Auth pemain
- Database cloud untuk progres lintas perangkat
- Leaderboard server-side
- Admin catalog untuk item dan harga
- Payment gateway untuk item digital (opsional)
