
## Struktur OreOps saat ini

```text
app/
  page.tsx              # shell dashboard dan orchestration state
  mine-3d-scene.tsx     # Canvas R3F, GLTF terrain, truck route dan trails
  oreops-panels.tsx     # contextual site/equipment panel + operations tabs
  globals.css           # visual system command center
  r3f.css               # HUD dan label scene 3D
lib/
  oreops-data.ts        # domain model portfolio, sites, pits, assets, material flow
public/models/
  north-ridge-mine.gltf # terrain dan facility model
  haul-truck-pro.glb    # haul truck detail model
```

Struktur lama LegionCoin/arcade sudah dihapus dari runtime repository. Pola produk sekarang mengikuti referensi WareTrack: overview site saat belum memilih asset, drill-down contextual saat object dipilih, asset tabs di bawah scene, inventory snapshot, dan material flow timeline.
