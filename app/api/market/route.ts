import { NextResponse } from "next/server";

const catalog = [
  { id: "cooling", name: "Cryo Fan", description: "+4 GH/s cooling module", price: 120, effect: 4 },
  { id: "gpu", name: "Nebula GPU", description: "+12 GH/s mining board", price: 420, effect: 12 },
  { id: "booster", name: "Pulse Booster", description: "2× output for 60 seconds", price: 260, effect: 0 },
];

export async function GET() {
  return NextResponse.json({ currency: "NEX", catalog, economy: "virtual-only" });
}
