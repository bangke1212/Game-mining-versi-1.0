import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/game-store";

function playerId(request: Request) { return request.headers.get("cookie")?.match(/arcade_player=([^;]+)/)?.[1] || "demo-player"; }
export async function GET(request: Request) { return NextResponse.json({ entries: await getLeaderboard(playerId(request)) }); }
export async function POST(request: Request) { return NextResponse.json({ entries: await getLeaderboard(playerId(request)) }); }
