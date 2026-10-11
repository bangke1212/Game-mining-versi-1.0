import { NextResponse } from "next/server";
import { getCatalog, usingDatabase } from "@/lib/game-store";
export async function GET() { return NextResponse.json({ economy: "virtual-only", database: usingDatabase() ? "postgres" : "demo", catalog: getCatalog() }); }
