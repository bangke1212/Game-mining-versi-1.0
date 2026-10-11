# Arcade Nexus Mining v1.1

MVP **virtual mining simulator** full-stack berbasis Next.js. Pemain mengelola mining rig, mengumpulkan NEX virtual, melakukan upgrade, membeli rig/GPU dari shop, dan menyimpan inventory melalui API server-side.

> Game ini tidak melakukan crypto mining sungguhan, tidak memakai CPU pengguna untuk mining, dan semua NEX bersifat virtual.

## Fitur full-stack

- Guest session dengan cookie httpOnly.
- Server-side balance dan validasi pembelian.
- Catalog rig, GPU, booster, dan harga dari source server.
- Inventory tersimpan melalui API.
- Pembelian dicatat sebagai transaksi.
- Upgrade Starter Rig dan aktivasi Silent Runner.
- Claim reward melalui endpoint server.
- PostgreSQL schema untuk Vercel/Neon.
- Fallback demo mode jika database belum dikonfigurasi.
- Responsive desktop/mobile.

## Endpoint

```text
POST /api/auth/guest   membuat atau memakai guest session
GET  /api/game         membaca state pemain
POST /api/game         action: claim | buy | upgrade | activate
GET  /api/shop         membaca catalog marketplace
```

## Menjalankan lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`. Tanpa database, aplikasi berjalan dalam **demo mode** dan data server dapat reset ketika proses restart.

## Mengaktifkan persistence di Vercel

1. Buat database Postgres melalui Vercel Storage/Neon.
2. Tambahkan environment variable `POSTGRES_URL` ke Development dan Production.
3. Jalankan isi `db/schema.sql` pada SQL editor database satu kali.
4. Redeploy project.
5. Badge pada header berubah dari `DEMO MODE` menjadi `DATABASE ONLINE`.

Environment variable tidak disimpan di repository.

## Deploy ke Vercel

1. Import repository GitHub ini ke Vercel.
2. Framework preset: **Next.js**.
3. Build command: default Vercel atau `next build`.
4. Install command: `npm install`.
5. Tambahkan `POSTGRES_URL` hanya setelah database dibuat.

## Catatan keamanan

- Harga item selalu diambil dari server, bukan dipercaya dari frontend.
- Saldo hanya dikurangi melalui API.
- Cookie player memakai `httpOnly` dan `sameSite=lax`.
- Ini masih guest auth untuk MVP; sebelum uang nyata atau crypto, tambahkan login provider, rate limiting, CSRF strategy, audit log, dan transaksi database yang lebih ketat.

## Roadmap berikutnya

- Login OAuth/email.
- Leaderboard server-side.
- Marketplace antar-pemain.
- Admin catalog untuk item dan harga.
- Payment gateway untuk item digital (opsional).

## Arah desain rig modular

Visual rig pada dashboard dibuat sebagai CSS illustration orisinal, bukan mengambil gambar atau aset RollerCoin/LEGO. Referensi eksternal yang dipakai untuk arah bentuk modular dan industrial:

- [Yanko Design — M2x2 modular brick workstation](https://www.yankodesign.com/2026/03/18/this-classic-1979-lego-computer-brick-hides-a-fully-functional-mac-mini-workstation-inside/) — bentuk wedge, panel layar miring, studs, dan kontrol modular.
- [Richard Bagnall — Sci-fi Planetary Mining Installation](https://r_bago.artstation.com/projects/Nq1Jog) — block-out modular, gantry, deck, crane, dan bahasa industrial sci-fi.

Implementasi game menggunakan bentuk balok generik, panel cyan, vents, antenna, LED, dan animasi telemetry agar tidak menyalin merek atau aset proprietary.

## Audio retro 8-bit

- Background music: `public/audio/mining-retro-8bit.wav`, loopable dan dijalankan setelah pemain menekan tombol `8-BIT AUDIO` agar sesuai aturan autoplay browser.
- SFX utama dibuat secara procedural melalui Web Audio API untuk klik, claim reward, pembelian, dan upgrade; tidak membutuhkan file tambahan.

## Leaderboard global

Leaderboard memakai tabel `leaderboard_scores` pada `db/schema.sql`. Server menghitung hash rate dari rig dan item yang tersimpan, kemudian melakukan upsert skor melalui `POST /api/leaderboard`. Frontend hanya menampilkan hasil server dan tidak mengirim angka hash rate dari client.

Dengan `POSTGRES_URL`, skor menjadi global lintas pemain dan diurutkan berdasarkan `hash_rate`. Tanpa database, fallback demo menampilkan bot seed dan skor pemain pada instance server saat ini; fallback tersebut bukan leaderboard production yang persistent.
