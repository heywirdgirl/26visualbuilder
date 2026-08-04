// src/app/auth/callback/route.ts

import { createClient } from "@/core/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
      const isLocalEnv = process.env.NODE_ENV === "development";

      const baseUrl = isLocalEnv
        ? origin
        : forwardedHost
          ? `${forwardedProto}://${forwardedHost}`
          : origin;

      return NextResponse.redirect(new URL(next, baseUrl).toString());
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}