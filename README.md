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
