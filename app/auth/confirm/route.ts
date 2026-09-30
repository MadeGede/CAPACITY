import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseConfigured, modeCookieName } from "@/lib/supabase/config";

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const code = request.nextUrl.searchParams.get("code");
  const type = request.nextUrl.searchParams.get("type") as "email" | "signup" | null;
  const response = NextResponse.redirect(new URL("/dashboard", request.url));
  if (!supabaseConfigured || (!tokenHash && !code)) return NextResponse.redirect(new URL("/login?error=confirmation", request.url));
  const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => request.cookies.getAll(), setAll: (values) => values.forEach(({ name, value, options }) => { request.cookies.set(name, value); response.cookies.set(name, value, options); }) },
  });
  try {
    const result = code ? await client.auth.exchangeCodeForSession(code) : await client.auth.verifyOtp({ token_hash: tokenHash!, type: type === "email" ? "email" : "signup" });
    if (result.error) return NextResponse.redirect(new URL("/login?error=confirmation", request.url));
  } catch { return NextResponse.redirect(new URL("/login?error=confirmation", request.url)); }
  response.cookies.set(modeCookieName, "real", { path: "/", sameSite: "lax", maxAge: 31536000 });
  return response;
}
