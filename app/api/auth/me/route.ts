import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth";

export async function GET(request: Request) {
  const value = request.headers.get("cookie")?.match(/(?:^|; )arcade_session=([^;]+)/)?.[1];
  return NextResponse.json({ user: readSession(value) });
}
