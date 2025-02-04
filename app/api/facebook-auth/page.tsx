import env from "@/env_file";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Authorization code not found" }, { status: 400 });
  }

  try {
    // Step 1: Exchange authorization code for short-lived access token
    const shortTokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${env.FACEBOOK_APP_ID}&redirect_uri=${env.FACEBOOK_REDIRECT_URI}&client_secret=${env.FACEBOOK_APP_SECRET}&code=${code}`
    );
    const shortTokenData = await shortTokenResponse.json();

    if (shortTokenData.error) {
      return NextResponse.json({ error: shortTokenData.error.message }, { status: 400 });
    }

    const shortLivedToken = shortTokenData.access_token;

    // Step 2: Exchange for long-lived token
    const longTokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${env.FACEBOOK_APP_ID}&client_secret=${env.FACEBOOK_APP_SECRET}&fb_exchange_token=${shortLivedToken}`
    );
    const longTokenData = await longTokenResponse.json();

    if (longTokenData.error) {
      return NextResponse.json({ error: longTokenData.error.message }, { status: 400 });
    }

    return NextResponse.json(longTokenData); // Send back long-lived token
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
