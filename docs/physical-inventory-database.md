# Skema database inventori GPU LegionCoin

Dokumen ini mendefinisikan kontrak PostgreSQL dan JSON untuk penyimpanan unit GPU, rack server, dan penempatan slot. **Ini belum mengubah runtime game:** LegionCoin yang dipublikasikan tetap game offline yang memakai `localStorage`. File SQL menjadi dasar jika sinkronisasi akun/backend ditambahkan kemudian.

## Berkas

- `db/schema.sql` — tabel, indeks, foreign key, dan trigger validasi PostgreSQL.
- `db/seed-gpu-catalog.sql` — katalog contoh GPU NVIDIA RTX 4060–5090 dan rack virtual yang sudah ada.
- `schemas/legioncoin-physical-inventory.schema.json` — validasi struktur payload JSON Draft 2020-12.

## Relasi utama

- `players` menyimpan identitas game, LC virtual, dan XP. Sistem login tidak ditentukan oleh skema ini.
- `mining_rooms` menyimpan ruangan pemain dan jumlah slot dasar.
- `gpu_catalog` menyimpan metadata produk fisik (model, generasi, VRAM, tipe memori) serta path aset dan sumber/izin gambar. Nilai `virtual_power_ths` dan `virtual_price_lc` adalah konfigurasi game yang terpisah dari spesifikasi nyata.
- `rack_catalog` menyimpan model rack, jumlah slot GPU, dan nilai simulasi.
- `player_gpu_units` menyimpan **satu baris untuk satu GPU yang dimiliki**. `location_kind=inventory` berarti disimpan; `room` memakai nomor slot dasar; `rack` menyimpan `rack_unit_id` dan nomor slot fisik.
- `player_rack_units` menyimpan **satu baris untuk satu rack**. `room_id` serta koordinat `room_x/room_y` kosong berarti rack masih di inventori; nilai terisi berarti rack terpasang di ruangan tersebut.

Foreign key komposit mencegah unit mengarah ke ruangan atau rack milik pemain lain. Indeks unik mencegah dua GPU menempati satu slot yang sama. Trigger memeriksa bahwa rack telah dipasang, slot GPU berada dalam kapasitas rack, dan rack berisi GPU harus dikosongkan sebelum disimpan. Trigger tambahan mencegah pengurangan kapasitas ruang/grid atau jumlah slot rack jika perubahan itu akan membuat penempatan lama tidak valid; tipe rack yang sudah dibeli tidak dapat ditukar.

Integrasi backend harus memvalidasi payload dan menjalankan pembelian, pembayaran LC virtual, serta perubahan penempatan dalam transaksi atomik. JSON Schema memeriksa bentuk data, tetapi backend wajib mengecek ID unit unik, referensi room/rack yang benar-benar ada, kepemilikan pemain, konsistensi room GPU dengan room rack, slot unik, nomor slot dalam kapasitas katalog, dan batas koordinat grid. Jangan mengandalkan JSON Schema saja untuk invariant lintas-record.

## Contoh payload JSON

```json
{
  "schemaVersion": 1,
  "playerId": "10000000-0000-4000-8000-000000000001",
  "rooms": [
    {
      "id": "20000000-0000-4000-8000-000000000001",
      "name": "Markas 01",
      "baseGpuSlots": 6,
      "grid": { "width": 12, "height": 8 }
    }
  ],
  "rackUnits": [
    {
      "id": "30000000-0000-4000-8000-000000000001",
      "rackModelId": "purrstack-mini",
      "level": 1,
      "location": {
        "kind": "room",
        "roomId": "20000000-0000-4000-8000-000000000001",
        "x": 2,
        "y": 1
      }
    },
    {
      "id": "30000000-0000-4000-8000-000000000002",
      "rackModelId": "whisker-tower",
      "level": 1,
      "location": { "kind": "inventory" }
    }
  ],
  "gpuUnits": [
    {
      "id": "40000000-0000-4000-8000-000000000001",
      "gpuModelId": "rtx-4060-8gb",
      "level": 1,
      "location": {
        "kind": "rack",
        "roomId": "20000000-0000-4000-8000-000000000001",
        "rackUnitId": "30000000-0000-4000-8000-000000000001",
        "slotNo": 1
      }
    },
    {
      "id": "40000000-0000-4000-8000-000000000002",
      "gpuModelId": "rtx-5090-32gb",
      "level": 1,
      "location": { "kind": "inventory" }
    }
  ]
}
```

JSON Schema memeriksa tipe data, field wajib, level, dan bentuk lokasi. Ia tidak dapat memastikan ID tidak berulang di antara objek berbeda, nomor slot tidak bentrok, referensi silang seperti `rackUnitId` memang ada, GPU dan rack berada di room yang sama, atau kepemilikan sama; database dan service backend menegakkan aturan tersebut.

## Batasan model

Skema ini memisahkan fakta produk (misalnya VRAM) dari `virtual_power_ths` dan `virtual_price_lc`. Angka TH/s dan LC hanya untuk keseimbangan LegionCoin, bukan klaim hashrate, keuntungan, atau operasi mining nyata. Seed GPU tidak mengaktifkan kartu di pasar dan membiarkan harga/power virtual kosong. Seed rack mempertahankan harga/power virtual dari catalog game offline yang sudah ada.

Foto produk tidak disalin otomatis dari halaman vendor. Isi `image_asset_path`, `image_source_url`, dan `image_license` hanya setelah memilih aset yang boleh dipakai. Untuk PWA offline, gunakan aset lokal yang hak pemakaiannya jelas, bukan hotlink gambar vendor.
