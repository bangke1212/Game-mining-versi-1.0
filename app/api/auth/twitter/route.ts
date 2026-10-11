import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";

const cookieOptions = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", maxAge: 600, path: "/" };

function redirectUri(request: Request) {
  return process.env.TWITTER_REDIRECT_URI || new URL("/api/auth/twitter/callback", request.url).toString();
}

export async function GET(request: Request) {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const authSecret = process.env.AUTH_SECRET;
  if (!clientId || !authSecret) return NextResponse.redirect(new URL("/?auth=missing_config", request.url));

  const state = randomBytes(24).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const params = new URLSearchParams({ response_type: "code", client_id: clientId, redirect_uri: redirectUri(request), scope: "users.read tweet.read offline.access", state, code_challenge: challenge, code_challenge_method: "S256" });
  const response = NextResponse.redirect(`https://x.com/i/oauth2/authorize?${params.toString()}`);
  response.cookies.set("twitter_oauth_state", state, cookieOptions);
  response.cookies.set("twitter_code_verifier", verifier, cookieOptions);
  return response;
}
