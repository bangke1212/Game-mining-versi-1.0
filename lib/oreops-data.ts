export type Status = "running" | "idle" | "warning" | "maintenance";
export type AssetKind = "truck" | "excavator" | "crusher" | "stockpile" | "workshop";
export type Asset = { id: string; label: string; kind: AssetKind; status: Status; position: string; detail: string; metric: string; value: string; icon: string };
export type Pit = { id: string; name: string; depth: string };
export type MineSite = { id: string; name: string; region: string; pits: Pit[] };
export type Portfolio = { name: string; sites: MineSite[] };
export type MaterialFlowStep = { name: string; type: string; value: string; time: string; state: "complete" | "active" | "pending" };

export const statusLabel: Record<Status, string> = { running: "RUNNING", idle: "IDLE", warning: "WARNING", maintenance: "SERVICE" };
export const statusColor: Record<Status, string> = { running: "#63e6a6", idle: "#9aa8b9", warning: "#f5ba62", maintenance: "#ef767a" };
export const portfolio: Portfolio = { name: "Aurora Mining Group", sites: [{ id: "north-ridge", name: "North Ridge Mine", region: "Kalimantan · Indonesia", pits: [{ id: "pit-01", name: "Pit 01", depth: "−184 m" }, { id: "pit-02", name: "Pit 02", depth: "−96 m" }] }, { id: "south-valley", name: "South Valley Mine", region: "Sulawesi · Indonesia", pits: [{ id: "pit-03", name: "Pit 03", depth: "−142 m" }, { id: "plant-01", name: "Processing Plant", depth: "Surface" }] }] };
export const assets: Asset[] = [
  { id: "HT-204", label: "Haul Truck 204", kind: "truck", status: "running", position: "truck-a", detail: "Mengangkut ore dari Pit North ke Crusher 01", metric: "Payload", value: "218 t", icon: "🚚" },
  { id: "HT-118", label: "Haul Truck 118", kind: "truck", status: "warning", position: "truck-b", detail: "Menunggu loading point selama 04:12", metric: "Wait time", value: "04:12", icon: "🚚" },
  { id: "EX-07", label: "Excavator EX-07", kind: "excavator", status: "running", position: "excavator", detail: "Loading ore grade tinggi di loading face A", metric: "Cycle", value: "29.4 s", icon: "⛏" },
  { id: "CR-01", label: "Primary Crusher 01", kind: "crusher", status: "running", position: "crusher", detail: "Feed normal dengan throughput stabil", metric: "Throughput", value: "1,240 t/h", icon: "◈" },
  { id: "SP-03", label: "Ore Stockpile 03", kind: "stockpile", status: "idle", position: "stockpile", detail: "Stockpile berada di bawah batas optimal", metric: "Inventory", value: "12,840 t", icon: "▰" },
  { id: "WS-01", label: "Mobile Workshop", kind: "workshop", status: "maintenance", position: "workshop", detail: "PM service untuk Dozer DZ-12 sedang berlangsung", metric: "Progress", value: "68%", icon: "⚙" },
];
export const materialFlow: MaterialFlowStep[] = [
  { name: "Loading face A", type: "ORE · HIGH GRADE", value: "640 t", time: "14:26:18", state: "complete" },
  { name: "HT-204 · Haul route", type: "IN TRANSIT · 218 t", value: "72%", time: "14:29:02", state: "active" },
  { name: "Primary Crusher 01", type: "FEED · 1,240 t/h", value: "Queue 02", time: "14:31:44", state: "active" },
  { name: "Ore Stockpile 03", type: "DESTINATION · 12,840 t", value: "ETA 02:14", time: "14:34:00", state: "pending" },
];
