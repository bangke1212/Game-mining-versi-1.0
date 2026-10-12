# LegionCoin — Paw Power Mining Game

LegionCoin adalah game browser offline dengan loop play-to-earn yang **sepenuhnya simulasi**. Pemain mengembangkan rig virtual, memainkan mini-game, meningkatkan Mining Power, naik liga, dan berbagi reward pool virtual. Maskotnya Kapten Paw, seekor kucing penambang.

> Tidak ada penambangan kripto sungguhan, blockchain, dompet eksternal, nilai tukar, deposit, atau penarikan. Semua LC, power, liga, pool, dan rival adalah data game lokal.

## Mekanisme game

- **Power permanen:** beli atau tingkatkan miner menggunakan saldo LC virtual. Power permanen menentukan liga.
- **Power sementara:** mini-game **Paw Rush** memberi boost selama tujuh hari. Boost menambah porsi reward, tetapi tidak menaikkan liga.
- **Liga dan reward pool:** tiap liga memiliki pool harian simulasi dan rival bot lokal. Reward dihitung secara proporsional menurut power pemain dan power rival, mengikuti konsep pembagian pool kompetitif.
- **Progres offline:** pendapatan virtual bertambah ketika aplikasi ditutup, dengan akumulasi maksimal 24 jam per sesi kembali.
- **Save lokal:** progres tersimpan di `localStorage` browser/perangkat yang sama. Menghapus data situs akan menghapus save. Tidak ada sinkronisasi antarperangkat.

## Jalankan secara lokal

Memerlukan Node.js 20.9+.

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`. Jalankan `npm run build` untuk menghasilkan static export di `out/`.

## Deploy ke Vercel

1. Impor repository ini ke Vercel dan pilih preset **Next.js**.
2. Biarkan Build Command dan Output Directory menggunakan nilai default Next.js. Konfigurasi `output: "export"` menghasilkan folder `out/` untuk publikasi statis.
3. Tidak dibutuhkan database, kredensial OAuth, environment variable, API route, maupun backend.
4. Deploy harus disajikan melalui HTTPS agar PWA dan service worker dapat bekerja. Setelah kunjungan pertama, file game dan aset yang telah dicache dapat dipakai offline.

## Data & privasi

Game hanya menggunakan `localStorage` untuk menyimpan save di perangkat pemain dan service worker untuk cache aset aplikasi. Tidak ada koneksi API atau analitik pihak ketiga. Fitur kirim/tarik sengaja nonaktif karena LC bukan aset kripto.
