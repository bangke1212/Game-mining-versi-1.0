# LegionCoin — Paw Power Mining Game

LegionCoin adalah game browser offline dengan loop mining yang **sepenuhnya simulasi**. Pemain meng-upgrade rig, membangun rak server kucing, memainkan arcade, mengustomisasi avatar kucing penambang, meningkatkan Mining Power, naik liga, dan berbagi reward pool virtual. Maskotnya Kapten Paw.

> Tidak ada penambangan kripto sungguhan, blockchain, dompet eksternal, nilai tukar, deposit, atau penarikan. Semua LC, power, liga, pool, dan rival adalah data game lokal.

## Susunan dashboard

Markas menampilkan ringkasan dan pintasan. Workshop Avatar, Arcade, Ruang Miner, Rak Server, Liga & Pool, Pasar Rig & Rak, serta Dompet Virtual masing-masing dibuka sebagai layar terpisah melalui menu samping atau pintasan Markas; memilih modul tidak lagi hanya menggulir halaman panjang yang sama.

## Mekanisme game

- **Rig mining:** tingkatkan rig langsung dari ruang kerja atau pasar. Tiap level menambah power permanen dan harganya meningkat; level maksimum 99.
- **Kustomisasi avatar:** pilih dari lima warna bulu dan lima aksesori, lihat pratinjau langsung, dan gunakan avatar yang sama di profil, Markas, serta Arcade. Kosmetik gratis dan tidak mengubah saldo, power, hadiah, atau liga.
- **Rak server kucing:** beli dan tingkatkan PurrStack Mini, Whisker Tower, serta Meow Cluster 9. Power rak ikut menambah Mining Power permanen; level maksimum 99.
- **Efek upgrade:** upgrade rig atau rak yang berhasil memicu kilau, lompatan maskot, label level-up, dan chime singkat yang disintesis melalui Web Audio. Efek suara tidak memakai file atau koneksi jaringan, dan animasi mengikuti preferensi reduced-motion perangkat.
- **Arcade:** **Paw Rush** memberi power sementara selama tujuh hari setelah minimal lima tangkapan; **Bit Catch** memberi skor dengan mengambil koin data dan menghindari bug; **Memory Mine** memberi skor lewat permainan mencocokkan kartu. Bonus arcade menambah LC virtual dengan batas total **40 LC per hari**.
- **Migrasi save:** save versi 1/2 dimigrasikan otomatis ke versi 3 saat game dibuka; level miner, saldo, serta progres lama dipertahankan dan avatar mendapat tampilan default.
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
