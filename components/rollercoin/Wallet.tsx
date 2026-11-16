"use client";
import { useState } from "react";
import { CalendarCheck, Coins, Gift, Wallet as WalletIcon } from "lucide-react";
import { COINS, DAILY_LOGIN_RLT, QUEST_BLOCKS_RLT, QUEST_GAMES_RLT } from "@/lib/rollercoin/catalog";
import type { GameState } from "@/lib/rollercoin/types";
import { COIN_IDS } from "@/lib/rollercoin/types";
import { Badge, SectionTitle, fmtCoin, fmtRlt } from "./ui";

export default function Wallet({
  state,
  onClaimDaily,
  onClaimQuestGames,
  onClaimQuestBlocks,
}: {
  state: GameState;
  onClaimDaily: () => string | undefined;
  onClaimQuestGames: () => string | undefined;
  onClaimQuestBlocks: () => string | undefined;
}) {
  const [msg, setMsg] = useState("");
  const [simWithdraw, setSimWithdraw] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const run = (fn: () => string | undefined) => setMsg(fn() ?? "Claimed!");
  const totalCoins = COIN_IDS.reduce((s, c) => s + state.balances[c], 0);
  return (
    <>
      <SectionTitle eyebrow="WALLET / SIMULATED BALANCES" title="Wallet" action={<Badge tone="amber">{fmtRlt(state.rlt)}</Badge>} />
      <div className="metric-grid">
        <article className="metric-card"><div className="metric-icon"><Coins size={16} /></div><span>RLT balance</span><strong>{fmtRlt(state.rlt)}</strong><small>In-game only · cannot be withdrawn</small></article>
        <article className="metric-card lavender"><div className="metric-icon"><WalletIcon size={16} /></div><span>Coins mined (simulated)</span><strong>{totalCoins.toFixed(4)}</strong><small>Across {COIN_IDS.length} coins</small></article>
        <article className="metric-card amber"><div className="metric-icon"><CalendarCheck size={16} /></div><span>Login streak</span><strong>{state.daily.streak} day(s)</strong><small>Daily login +{DAILY_LOGIN_RLT} RLT</small></article>
      </div>

      <div className="overview-grid">
        <section className="panel">
          <SectionTitle eyebrow="COIN BALANCES (SIMULATED)" title="Mined coins" />
          {COIN_IDS.map((id) => (
            <div className="rack-row" key={id}>
              <div><strong>{COINS[id].name} ({id})</strong><small>Allocation {state.allocations[id]}% · block pool {COINS[id].blockReward} {id}</small></div>
              <b>{fmtCoin(state.balances[id], COINS[id].decimals)} {id}</b>
            </div>
          ))}
          <div className="rc-note" style={{ marginTop: 14 }}>
            <strong>Simulated withdrawal:</strong> this button only pretends to withdraw, for demo purposes.
            It does not send crypto anywhere and no wallet is ever connected.
          </div>
          <div className="rc-row">
            <button className="secondary-button" onClick={() => setSimWithdraw("Simulated withdrawal complete (demo only): 0.00000000 BTC sent nowhere. No real crypto moved.")}>
              Simulate withdrawal (demo)
            </button>
          </div>
          {simWithdraw && <p className="rc-muted">{simWithdraw}</p>}
        </section>

        <section className="panel">
          <SectionTitle eyebrow="DAILY QUESTS" title="Quests" action={<Badge>Reset daily</Badge>} />
          {msg && <div className="rc-note">{msg}</div>}
          <div className="rc-quest">
            <div><strong>Daily login</strong><small>Claim once per day · +{DAILY_LOGIN_RLT} RLT</small></div>
            <button className="primary-button" disabled={state.daily.dailyClaimedDate === today} onClick={() => run(onClaimDaily)}>
              {state.daily.dailyClaimedDate === today ? "Claimed ✓" : "Claim"}
            </button>
          </div>
          <div className="rc-quest">
            <div><strong>Play 3 mini-games</strong><small>{state.daily.miniGamesDate === today ? state.daily.miniGamesPlayedToday : 0} / 3 today · +{QUEST_GAMES_RLT} RLT</small></div>
            <button className="primary-button" disabled={state.daily.questGamesClaimedDate === today} onClick={() => run(onClaimQuestGames)}>
              {state.daily.questGamesClaimedDate === today ? "Claimed ✓" : "Claim"}
            </button>
          </div>
          <div className="rc-quest">
            <div><strong>Mine 5 blocks (total)</strong><small>{state.stats.blocksMined} block(s) mined · +{QUEST_BLOCKS_RLT} RLT</small></div>
            <button className="primary-button" disabled={state.daily.questBlocksClaimedDate === today} onClick={() => run(onClaimQuestBlocks)}>
              {state.daily.questBlocksClaimedDate === today ? "Claimed ✓" : "Claim"}
            </button>
          </div>
          <p className="rc-muted"><Gift size={13} /> Quests refresh every day. RLT from quests is spent in the Shop on miners, racks, and room upgrades.</p>
        </section>
      </div>
    </>
  );
}
