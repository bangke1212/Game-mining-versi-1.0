export type WorkerStatus = "online" | "offline" | "fault";
export type WorkerKind = "CPU" | "GPU" | "ASIC" | "HIGH-EFFICIENCY" | "EXPERIMENTAL";
export type Worker = { id: string; name: string; kind: WorkerKind; hashrate: number; efficiency: number; status: WorkerStatus; temperature: number; power: number; level: number; blocks: number; shares: number; cost: number };
export type Block = { height: number; hash: string; previous: string; nonce: number; difficulty: number; timestamp: string; reward: number; txs: number };
export type Tx = { id: string; from: string; to: string; amount: number; fee: number; timestamp: string; status: "PENDING" | "CONFIRMED" | "FAILED" };
export type SimConfig = { speed: number; interval: number; difficulty: number; reward: number; halving: number; simPrice: number; electricity: number; seed: number; failureRate: number; mode: string };
export const initialWorkers: Worker[] = [
  { id: "ASIC-07", name: "Atlas S9", kind: "ASIC", hashrate: 94, efficiency: 92, status: "online", temperature: 61, power: 3100, level: 4, blocks: 2, shares: 18420, cost: 1200 },
  { id: "GPU-12", name: "Rig Nebula", kind: "GPU", hashrate: 42, efficiency: 78, status: "online", temperature: 57, power: 1280, level: 3, blocks: 1, shares: 9021, cost: 760 },
  { id: "ASIC-03", name: "Forge Mini", kind: "ASIC", hashrate: 28, efficiency: 86, status: "fault", temperature: 74, power: 970, level: 2, blocks: 0, shares: 4818, cost: 420 },
  { id: "CPU-01", name: "Bootstrap Node", kind: "CPU", hashrate: 4.8, efficiency: 64, status: "online", temperature: 48, power: 180, level: 1, blocks: 0, shares: 880, cost: 180 },
];
export const initialConfig: SimConfig = { speed: 1, interval: 60, difficulty: 1, reward: 50, halving: 100, simPrice: 1, electricity: .1, seed: 1212, failureRate: 3, mode: "Balanced" };
export const genesis: Block = { height: 0, hash: "00000000GENESIS7f4a", previous: "—", nonce: 0, difficulty: 1, timestamp: "2026-10-14T07:00:00.000Z", reward: 0, txs: 0 };
