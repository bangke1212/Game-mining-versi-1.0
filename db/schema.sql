-- LegionCoin physical GPU inventory and server-rack schema
-- PostgreSQL 14+. This is an optional persistence contract; the shipped game
-- remains a static, offline-first application and does not connect to this DB.

CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name VARCHAR(24) NOT NULL DEFAULT 'Penjelajah Paw',
  virtual_balance_lc NUMERIC(20, 6) NOT NULL DEFAULT 120 CHECK (virtual_balance_lc >= 0),
  xp BIGINT NOT NULL DEFAULT 0 CHECK (xp >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per real GPU model / VRAM variant. Physical specifications and
-- game-balance values are deliberately separate. TH/s and LC are simulated.
CREATE TABLE IF NOT EXISTS gpu_catalog (
  id VARCHAR(64) PRIMARY KEY CHECK (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  manufacturer VARCHAR(48) NOT NULL,
  model_name VARCHAR(100) NOT NULL,
  generation VARCHAR(24) NOT NULL,
  vram_gb SMALLINT NOT NULL CHECK (vram_gb > 0),
  memory_type VARCHAR(24),
  reference_url TEXT,
  image_asset_path TEXT,
  image_source_url TEXT,
  image_license TEXT,
  virtual_power_ths NUMERIC(14, 2) CHECK (virtual_power_ths IS NULL OR virtual_power_ths >= 0),
  virtual_price_lc NUMERIC(20, 2) CHECK (virtual_price_lc IS NULL OR virtual_price_lc >= 0),
  is_market_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (manufacturer, model_name, vram_gb)
);

CREATE TABLE IF NOT EXISTS rack_catalog (
  id VARCHAR(64) PRIMARY KEY CHECK (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name VARCHAR(100) NOT NULL,
  slot_count SMALLINT NOT NULL CHECK (slot_count > 0),
  virtual_power_ths NUMERIC(14, 2) CHECK (virtual_power_ths IS NULL OR virtual_power_ths >= 0),
  virtual_price_lc NUMERIC(20, 2) CHECK (virtual_price_lc IS NULL OR virtual_price_lc >= 0),
  image_asset_path TEXT,
  image_source_url TEXT,
  image_license TEXT,
  is_market_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mining_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  name VARCHAR(64) NOT NULL DEFAULT 'Markas 01',
  base_gpu_slots SMALLINT NOT NULL DEFAULT 6 CHECK (base_gpu_slots >= 0),
  grid_width SMALLINT NOT NULL DEFAULT 12 CHECK (grid_width > 0),
  grid_height SMALLINT NOT NULL DEFAULT 8 CHECK (grid_height > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (id, player_id)
);

-- A rack is in the player's inventory while room_id/x/y are NULL. Setting all
-- three places the physical rack in a room. Each player owns distinct units.
CREATE TABLE IF NOT EXISTS player_rack_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  rack_model_id VARCHAR(64) NOT NULL REFERENCES rack_catalog(id) ON DELETE RESTRICT,
  room_id UUID,
  room_x SMALLINT CHECK (room_x IS NULL OR room_x >= 0),
  room_y SMALLINT CHECK (room_y IS NULL OR room_y >= 0),
  level SMALLINT NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 99),
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  installed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT player_rack_location_check CHECK (
    (room_id IS NULL AND room_x IS NULL AND room_y IS NULL AND installed_at IS NULL)
    OR
    (room_id IS NOT NULL AND room_x IS NOT NULL AND room_y IS NOT NULL AND installed_at IS NOT NULL)
  ),
  CONSTRAINT player_rack_owner_room_fk FOREIGN KEY (room_id, player_id)
    REFERENCES mining_rooms(id, player_id) ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED,
  -- Composite target lets a GPU prove it refers to a rack owned by the same
  -- player and installed in the same room.
  CONSTRAINT player_rack_identity_room_uq UNIQUE (id, player_id, room_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS player_rack_room_position_uq
  ON player_rack_units (room_id, room_x, room_y)
  WHERE room_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS player_rack_inventory_idx
  ON player_rack_units (player_id, room_id, created_at);

-- A GPU unit is a separate owned item. location_kind='inventory' has no room
-- or slot; 'room' occupies one base room slot; 'rack' occupies a numbered slot
-- in one installed rack.
CREATE TABLE IF NOT EXISTS player_gpu_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  gpu_model_id VARCHAR(64) NOT NULL REFERENCES gpu_catalog(id) ON DELETE RESTRICT,
  level SMALLINT NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 99),
  location_kind VARCHAR(12) NOT NULL DEFAULT 'inventory'
    CHECK (location_kind IN ('inventory', 'room', 'rack')),
  room_id UUID,
  room_slot_no SMALLINT,
  rack_unit_id UUID,
  rack_slot_no SMALLINT,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  installed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT gpu_location_fields_check CHECK (
    (location_kind = 'inventory'
      AND room_id IS NULL AND room_slot_no IS NULL
      AND rack_unit_id IS NULL AND rack_slot_no IS NULL AND installed_at IS NULL)
    OR
    (location_kind = 'room'
      AND room_id IS NOT NULL AND room_slot_no IS NOT NULL AND room_slot_no > 0
      AND rack_unit_id IS NULL AND rack_slot_no IS NULL AND installed_at IS NOT NULL)
    OR
    (location_kind = 'rack'
      AND room_id IS NOT NULL AND room_slot_no IS NULL
      AND rack_unit_id IS NOT NULL AND rack_slot_no IS NOT NULL AND rack_slot_no > 0
      AND installed_at IS NOT NULL)
  ),
  CONSTRAINT gpu_owner_room_fk FOREIGN KEY (room_id, player_id)
    REFERENCES mining_rooms(id, player_id) ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT gpu_rack_owner_room_fk FOREIGN KEY (rack_unit_id, player_id, room_id)
    REFERENCES player_rack_units(id, player_id, room_id) ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED
);

CREATE UNIQUE INDEX IF NOT EXISTS gpu_rack_slot_uq
  ON player_gpu_units (rack_unit_id, rack_slot_no)
  WHERE location_kind = 'rack';

CREATE UNIQUE INDEX IF NOT EXISTS gpu_room_slot_uq
  ON player_gpu_units (room_id, room_slot_no)
  WHERE location_kind = 'room';

CREATE INDEX IF NOT EXISTS gpu_inventory_by_player_idx
  ON player_gpu_units (player_id, location_kind, created_at);

CREATE INDEX IF NOT EXISTS gpu_units_by_room_idx
  ON player_gpu_units (player_id, room_id, location_kind);

-- Validate room-slot limits and the chosen rack's installed state/capacity.
CREATE OR REPLACE FUNCTION legioncoin_validate_gpu_placement()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  available_room_slots SMALLINT;
  available_rack_slots SMALLINT;
  installed_room_id UUID;
BEGIN
  IF NEW.location_kind = 'room' THEN
    SELECT base_gpu_slots INTO available_room_slots
      FROM mining_rooms
      WHERE id = NEW.room_id AND player_id = NEW.player_id
      FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Mining room does not belong to this player.';
    END IF;

    IF NEW.room_slot_no > available_room_slots THEN
      RAISE EXCEPTION 'Room slot % exceeds base room capacity %.', NEW.room_slot_no, available_room_slots;
    END IF;
  ELSIF NEW.location_kind = 'rack' THEN
    PERFORM 1 FROM mining_rooms
      WHERE id = NEW.room_id AND player_id = NEW.player_id
      FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Mining room does not belong to this player.';
    END IF;

    SELECT c.slot_count, r.room_id
      INTO available_rack_slots, installed_room_id
      FROM player_rack_units AS r
      JOIN rack_catalog AS c ON c.id = r.rack_model_id
      WHERE r.id = NEW.rack_unit_id AND r.player_id = NEW.player_id
      FOR UPDATE OF r, c;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Rack unit does not belong to this player.';
    END IF;

    IF installed_room_id IS NULL THEN
      RAISE EXCEPTION 'Install the rack in a room before placing a GPU in it.';
    END IF;

    IF installed_room_id IS DISTINCT FROM NEW.room_id THEN
      RAISE EXCEPTION 'GPU and rack must be in the same room.';
    END IF;

    IF NEW.rack_slot_no > available_rack_slots THEN
      RAISE EXCEPTION 'Rack slot % exceeds rack capacity %.', NEW.rack_slot_no, available_rack_slots;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS gpu_placement_validation_trigger ON player_gpu_units;
CREATE TRIGGER gpu_placement_validation_trigger
  BEFORE INSERT OR UPDATE OF location_kind, room_id, room_slot_no, rack_unit_id, rack_slot_no
  ON player_gpu_units
  FOR EACH ROW EXECUTE FUNCTION legioncoin_validate_gpu_placement();

-- Prevent storing/removing a rack while GPUs still occupy its slots. Move the
-- GPU units back to inventory or another valid placement first.
CREATE OR REPLACE FUNCTION legioncoin_prevent_nonempty_rack_storage()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.room_id IS NOT NULL AND NEW.room_id IS NULL
     AND EXISTS (
       SELECT 1 FROM player_gpu_units
       WHERE rack_unit_id = OLD.id AND location_kind = 'rack'
     ) THEN
    RAISE EXCEPTION 'Move GPUs out of this rack before storing it.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rack_storage_guard_trigger ON player_rack_units;
CREATE TRIGGER rack_storage_guard_trigger
  BEFORE UPDATE OF room_id ON player_rack_units
  FOR EACH ROW EXECUTE FUNCTION legioncoin_prevent_nonempty_rack_storage();

CREATE OR REPLACE FUNCTION legioncoin_validate_rack_room_position()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  room_grid_width SMALLINT;
  room_grid_height SMALLINT;
BEGIN
  IF NEW.room_id IS NOT NULL THEN
    SELECT grid_width, grid_height
      INTO room_grid_width, room_grid_height
      FROM mining_rooms
      WHERE id = NEW.room_id AND player_id = NEW.player_id
      FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Mining room does not belong to this player.';
    END IF;

    IF NEW.room_x >= room_grid_width OR NEW.room_y >= room_grid_height THEN
      RAISE EXCEPTION 'Rack coordinates (%, %) are outside the room grid (% x %).',
        NEW.room_x, NEW.room_y, room_grid_width, room_grid_height;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rack_room_position_validation_trigger ON player_rack_units;
CREATE TRIGGER rack_room_position_validation_trigger
  BEFORE INSERT OR UPDATE OF room_id, room_x, room_y ON player_rack_units
  FOR EACH ROW EXECUTE FUNCTION legioncoin_validate_rack_room_position();

-- Capacity/grid changes must not strand already placed hardware outside the
-- room's valid base slots or grid boundaries.
CREATE OR REPLACE FUNCTION legioncoin_guard_room_capacity_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.base_gpu_slots < OLD.base_gpu_slots AND EXISTS (
    SELECT 1 FROM player_gpu_units
    WHERE room_id = OLD.id
      AND location_kind = 'room'
      AND room_slot_no > NEW.base_gpu_slots
  ) THEN
    RAISE EXCEPTION 'Move GPUs out of room slots above the new base capacity before reducing it.';
  END IF;

  IF (NEW.grid_width < OLD.grid_width OR NEW.grid_height < OLD.grid_height)
     AND EXISTS (
       SELECT 1 FROM player_rack_units
       WHERE room_id = OLD.id
         AND (room_x >= NEW.grid_width OR room_y >= NEW.grid_height)
     ) THEN
    RAISE EXCEPTION 'Move racks inside the new room grid before reducing its dimensions.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS room_capacity_guard_trigger ON mining_rooms;
CREATE TRIGGER room_capacity_guard_trigger
  BEFORE UPDATE OF base_gpu_slots, grid_width, grid_height ON mining_rooms
  FOR EACH ROW EXECUTE FUNCTION legioncoin_guard_room_capacity_update();

-- Rack model is part of the purchased physical unit identity and cannot be
-- swapped after purchase. Catalog capacity may still change only when no
-- placed GPU would exceed the new capacity.
CREATE OR REPLACE FUNCTION legioncoin_prevent_rack_model_swap()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.rack_model_id IS DISTINCT FROM OLD.rack_model_id THEN
    RAISE EXCEPTION 'A purchased rack unit cannot change its model.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rack_model_immutable_trigger ON player_rack_units;
CREATE TRIGGER rack_model_immutable_trigger
  BEFORE UPDATE OF rack_model_id ON player_rack_units
  FOR EACH ROW EXECUTE FUNCTION legioncoin_prevent_rack_model_swap();

CREATE OR REPLACE FUNCTION legioncoin_guard_rack_capacity_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slot_count < OLD.slot_count AND EXISTS (
    SELECT 1
      FROM player_rack_units AS r
      JOIN player_gpu_units AS g ON g.rack_unit_id = r.id
      WHERE r.rack_model_id = OLD.id
        AND g.location_kind = 'rack'
        AND g.rack_slot_no > NEW.slot_count
  ) THEN
    RAISE EXCEPTION 'Move GPUs out of rack slots above the new capacity before reducing it.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rack_catalog_capacity_guard_trigger ON rack_catalog;
CREATE TRIGGER rack_catalog_capacity_guard_trigger
  BEFORE UPDATE OF slot_count ON rack_catalog
  FOR EACH ROW EXECUTE FUNCTION legioncoin_guard_rack_capacity_update();

COMMENT ON TABLE gpu_catalog IS 'Physical product metadata. LC pricing and TH/s values are simulation-only game settings.';
COMMENT ON TABLE player_gpu_units IS 'One row per owned physical GPU instance; rack slots are unique and capacity-checked.';
COMMENT ON TABLE player_rack_units IS 'One row per owned rack instance; a non-NULL room_id means the rack is installed.';
COMMENT ON COLUMN gpu_catalog.image_asset_path IS 'Use a locally hosted image with verified reuse rights; do not hotlink unlicensed product imagery.';
COMMENT ON COLUMN gpu_catalog.virtual_power_ths IS 'Fictional LegionCoin game balance value; not a real mining benchmark.';
