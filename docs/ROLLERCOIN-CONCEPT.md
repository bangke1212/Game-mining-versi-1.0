# RollerCoin Concept — What This Game Copies (and What It Does Not)

> **SIMULATION MODE — NO REAL CRYPTO, NO REAL MONEY, NO REAL WITHDRAWAL**
>
> This game is *inspired by the concept* of RollerCoin, a browser mining-simulator
> game. It is not affiliated with RollerCoin, does not use its branding, logos,
> or assets, and does not pay out any real cryptocurrency.

## The concept, as understood from RollerCoin's public description

RollerCoin is a browser game where you build a virtual mining farm instead of
buying real hardware. Its public core loop is:

1. **Play arcade mini-games** to earn *temporary* mining power.
2. **Collect virtual miners** (placed on racks in rooms) for *permanent* mining
   power that keeps working while you are away.
3. **Your mining power decides your share** of each coin's block reward pool.
   Rewards are split proportionally to power, roughly every 10 minutes per
   block in the original.
4. **RLT is the in-game token.** You earn it by playing and spend it on miners,
   racks, and upgrades. RLT itself cannot be withdrawn.
5. **Leagues** group players by total power, with bigger reward pools higher up.
6. **Multi-coin mining:** you choose which supported coins to mine (BTC, ETH,
   DOGE, SOL, BNB, LTC, …) and split your power between them.

## How this repo implements the same concept

| Concept | Implementation here |
|---|---|
| Temporary power from mini-games | `components/rollercoin/MiniGames.tsx` — Clicker Rush, Memory Match, Reaction Rush. Each gives GH/s for 10 minutes + a small RLT bonus. |
| Permanent power from miners | `lib/rollercoin/catalog.ts` — 6 virtual miners (12–1500 GH/s), bought with RLT and installed in racks. On/off per miner. |
| Racks & rooms | Rack 4-slot / 8-slot in the Shop; room expansion raises the rack cap. |
| RLT (in-game only) | Earned from mini-games, block bonuses, daily login, and quests. Spent in the Shop. Never withdrawable. |
| Block reward pool | `lib/rollercoin/engine.ts` — every block interval (default 60 s) the pool of each coin is shared by `playerPower / (playerPower + NETWORK_BASE_GH)`, then split by the player's allocation %. |
| Leagues | Bronze (0) → Silver (100) → Gold (500) → Diamond (2000) → Titan (10000 GH/s permanent power), each multiplying the reward pool (×1 → ×3). |
| Multi-coin allocation | Sliders per coin (BTC/ETH/DOGE/SOL/BNB/LTC) that always sum to 100%. |
| Wallet | RLT + per-coin simulated balances, quest log, and a clearly-labelled *simulated* withdrawal demo that sends nothing anywhere. |
| Save | `localStorage` key `rollercoin-state-v1`, migrated once from the old `bmmc-state` dashboard save. |

## Deliberate differences from the original

- **Block interval is 60 seconds by default** (configurable 30 s–5 min), not ~10
  minutes — so a player can actually see rewards while trying the game.
  The UI says this everywhere it matters.
- **The "network" is simulated** (`NETWORK_BASE_GH = 20000` in
  `lib/rollercoin/engine.ts`). There is no server, no other players, and no
  real reward pool — your share is computed against a fixed simulated network.
- **No accounts, no server, no payments.** Everything runs in the browser.
- **No RollerCoin branding, names of real miners, or copied art.** Miner names
  here (Pico Miner, Hash Falcon, …) are invented.

## What is intentionally NOT built

- Real crypto payouts, real wallets, seed phrases, or any payment integration.
- Any claim that playing earns real BTC/ETH/etc.
- Multiplayer, leaderboards against real players, or referrals.
- Copying RollerCoin's visual assets, logo, or trademarked presentation.

## Files

- `lib/rollercoin/types.ts` — `Miner`, `Rack`, `Room`, `Coin`, `League`, `GameState`, `MiniGameResult`
- `lib/rollercoin/catalog.ts` — miner/rack/coin/league catalogues
- `lib/rollercoin/engine.ts` — pure game logic (power, leagues, blocks, shop, quests)
- `lib/rollercoin/storage.ts` — localStorage load/save + migration
- `components/rollercoin/` — `MiningRoom`, `Shop`, `MiniGames`, `Wallet`, `League`, `ui`
- `app/page.tsx` — thin shell that wires state, the 1-second tick, and navigation
