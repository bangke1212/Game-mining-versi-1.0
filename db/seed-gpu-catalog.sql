-- Example physical GPU catalog entries for LegionCoin's future database mode.
-- These rows describe product family/model and VRAM; they do NOT imply actual
-- crypto-mining profitability and leave GPU virtual LC price/power unset.
-- Before displaying product photos, provide a local image asset and verify its reuse license.

INSERT INTO gpu_catalog (
  id, manufacturer, model_name, generation, vram_gb, memory_type, reference_url,
  is_market_enabled
) VALUES
  ('rtx-4060-8gb', 'NVIDIA', 'GeForce RTX 4060', '40-series', 8, 'GDDR6',
   'https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4060-4060ti/', FALSE),
  ('rtx-4060-ti-8gb', 'NVIDIA', 'GeForce RTX 4060 Ti', '40-series', 8, 'GDDR6',
   'https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4060-4060ti/', FALSE),
  ('rtx-4060-ti-16gb', 'NVIDIA', 'GeForce RTX 4060 Ti', '40-series', 16, 'GDDR6',
   'https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4060-4060ti/', FALSE),
  ('rtx-4070-super-12gb', 'NVIDIA', 'GeForce RTX 4070 SUPER', '40-series', 12, 'GDDR6X',
   'https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4070-family/', FALSE),
  ('rtx-4070-ti-super-16gb', 'NVIDIA', 'GeForce RTX 4070 Ti SUPER', '40-series', 16, 'GDDR6X',
   'https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4070-family/', FALSE),
  ('rtx-4080-super-16gb', 'NVIDIA', 'GeForce RTX 4080 SUPER', '40-series', 16, 'GDDR6X',
   'https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4080-family/', FALSE),
  ('rtx-4090-24gb', 'NVIDIA', 'GeForce RTX 4090', '40-series', 24, 'GDDR6X',
   'https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4090/', FALSE),
  ('rtx-5060-8gb', 'NVIDIA', 'GeForce RTX 5060', '50-series', 8, 'GDDR7',
   'https://www.nvidia.com/en-sg/geforce/graphics-cards/50-series/rtx-5060-family/', FALSE),
  ('rtx-5060-ti-8gb', 'NVIDIA', 'GeForce RTX 5060 Ti', '50-series', 8, 'GDDR7',
   'https://www.nvidia.com/en-sg/geforce/graphics-cards/50-series/rtx-5060-family/', FALSE),
  ('rtx-5060-ti-16gb', 'NVIDIA', 'GeForce RTX 5060 Ti', '50-series', 16, 'GDDR7',
   'https://www.nvidia.com/en-sg/geforce/graphics-cards/50-series/rtx-5060-family/', FALSE),
  ('rtx-5070-12gb', 'NVIDIA', 'GeForce RTX 5070', '50-series', 12, 'GDDR7',
   'https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5070-family/', FALSE),
  ('rtx-5070-ti-16gb', 'NVIDIA', 'GeForce RTX 5070 Ti', '50-series', 16, 'GDDR7',
   'https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5070-family/', FALSE),
  ('rtx-5080-16gb', 'NVIDIA', 'GeForce RTX 5080', '50-series', 16, 'GDDR7',
   'https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5080/', FALSE),
  ('rtx-5090-32gb', 'NVIDIA', 'GeForce RTX 5090', '50-series', 32, 'GDDR7',
   'https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Existing fictional server-rack models from the offline game. These rows do
-- carry over their LC price and TH/s values, which remain simulated game data.
INSERT INTO rack_catalog (
  id, name, slot_count, virtual_power_ths, virtual_price_lc, is_market_enabled
) VALUES
  ('purrstack-mini', 'PurrStack Mini', 3, 90, 460, TRUE),
  ('whisker-tower', 'Whisker Tower', 5, 260, 1380, TRUE),
  ('meow-cluster', 'Meow Cluster 9', 8, 720, 3950, TRUE)
ON CONFLICT (id) DO NOTHING;
