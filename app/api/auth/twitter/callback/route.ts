import { NextResponse } from "next/server";
import { createSession, type AuthUser } from "@/lib/auth";

const cookieOptions = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 30, path: "/" };

function redirectUri(request: Request) {
  return process.env.TWITTER_REDIRECT_URI || new URL("/api/auth/twitter/callback", request.url).toString();
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookies = request.headers.get("cookie") || "";
  const savedState = cookies.match(/(?:^|; )twitter_oauth_state=([^;]+)/)?.[1];
  const verifier = cookies.match(/(?:^|; )twitter_code_verifier=([^;]+)/)?.[1];
  const fail = (reason: string) => NextResponse.redirect(new URL(`/?auth=${reason}`, request.url));
  if (!code || !state || !savedState || state !== savedState || !verifier) return fail("invalid_state");

  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;
  const authSecret = process.env.AUTH_SECRET;
  if (!clientId || !clientSecret || !authSecret) return fail("missing_config");

  const tokenBody = new URLSearchParams({ code, grant_type: "authorization_code", client_id: clientId, redirect_uri: redirectUri(request), code_verifier: verifier });
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const tokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${basicAuth}` }, body: tokenBody });
  if (!tokenResponse.ok) return fail("token_exchange_failed");
  const token = await tokenResponse.json() as { access_token?: string };
  if (!token.access_token) return fail("token_missing");

  const profileResponse = await fetch("https://api.twitter.com/2/users/me?user.fields=profile_image_url", { headers: { Authorization: `Bearer ${token.access_token}` } });
  if (!profileResponse.ok) return fail("profile_failed");
  const profile = await profileResponse.json() as { data?: { id: string; name: string; username: string; profile_image_url?: string } };
  if (!profile.data) return fail("profile_missing");
  const user: AuthUser = { id: profile.data.id, name: profile.data.name, username: profile.data.username, profileImageUrl: profile.data.profile_image_url };
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set("arcade_session", createSession(user), cookieOptions);
  response.cookies.set("arcade_player", user.id, { ...cookieOptions, maxAge: 60 * 60 * 24 * 365 });
  response.cookies.delete("twitter_oauth_state");
  response.cookies.delete("twitter_code_verifier");
  return response;
}
