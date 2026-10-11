import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  const existing = request.headers.get("cookie")?.match(/arcade_player=([^;]+)/)?.[1];
  const playerId = existing || randomUUID();
  const response = NextResponse.json({ playerId });
  if (!existing) response.cookies.set("arcade_player", playerId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 365, path: "/" });
  return response;
}
