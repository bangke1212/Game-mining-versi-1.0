create table if not exists players (
  id text primary key,
  display_name text not null default 'Guest Miner',
  balance integer not null default 860,
  starter_level integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists catalog_items (
  id text primary key,
  name text not null,
  type text not null check (type in ('rig', 'gpu', 'booster')),
  description text not null,
  price integer not null check (price >= 0),
  hash_power integer not null default 0,
  energy_usage integer not null default 0,
  active boolean not null default true
);

create table if not exists player_items (
  id bigserial primary key,
  player_id text not null references players(id) on delete cascade,
  item_id text not null references catalog_items(id),
  quantity integer not null default 1 check (quantity > 0),
  equipped boolean not null default false,
  created_at timestamptz not null default now(),
  unique(player_id, item_id)
);

create table if not exists transactions (
  id bigserial primary key,
  player_id text not null references players(id) on delete cascade,
  item_id text references catalog_items(id),
  kind text not null check (kind in ('purchase', 'claim', 'upgrade', 'activation')),
  amount integer not null,
  status text not null default 'completed',
  created_at timestamptz not null default now()
);

create table if not exists leaderboard_scores (
  player_id text primary key references players(id) on delete cascade,
  display_name text not null default 'Guest Miner',
  hash_rate integer not null default 0,
  updated_at timestamptz not null default now()
);

insert into catalog_items (id, name, type, description, price, hash_power, energy_usage) values
  ('rig-silent-runner', 'Silent Runner Rig', 'rig', 'Compact second rig, +10 GH/s', 700, 10, 3),
  ('gpu-nebula-x1', 'Nebula GPU X1', 'gpu', 'Efficient board, +12 GH/s', 420, 12, 2),
  ('gpu-cryo-fan', 'Cryo Fan', 'gpu', 'Cooling module, +4 GH/s', 120, 4, 1),
  ('booster-pulse', 'Pulse Booster', 'booster', '2x output for one claim', 260, 0, 0)
on conflict (id) do nothing;
