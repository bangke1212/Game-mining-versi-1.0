import { createHmac, timingSafeEqual } from "crypto";

export type AuthUser = { id: string; name: string; username: string; profileImageUrl?: string };

function secret() {
  return process.env.AUTH_SECRET || "development-only-change-me";
}

function encode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signature(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSession(user: AuthUser) {
  const payload = encode(JSON.stringify({ ...user, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 }));
  return `${payload}.${signature(payload)}`;
}

export function readSession(value?: string | null): AuthUser | null {
  if (!value) return null;
  const [payload, provided] = value.split(".");
  if (!payload || !provided) return null;
  const expected = signature(payload);
  if (provided.length !== expected.length || !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) return null;
  try {
    const session = JSON.parse(decode(payload)) as AuthUser & { exp: number };
    if (!session.exp || session.exp < Date.now() || !session.id || !session.username) return null;
    return { id: session.id, name: session.name, username: session.username, profileImageUrl: session.profileImageUrl };
  } catch {
    return null;
  }
}
