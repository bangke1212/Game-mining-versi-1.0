import { NextResponse } from "next/server";
import { getState, performAction } from "@/lib/game-store";

function playerId(request: Request) { return request.headers.get("cookie")?.match(/arcade_player=([^;]+)/)?.[1] || "demo-player"; }
export async function GET(request: Request) { return NextResponse.json(await getState(playerId(request))); }
export async function POST(request: Request) {
  try { const body = await request.json(); const state = await performAction(playerId(request), body.action, body.itemId); return NextResponse.json(state); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Transaksi gagal" }, { status: 400 }); }
}
