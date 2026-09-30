import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { modeCookieName, supabaseConfigured } from "./config";

export async function updateSession(request: NextRequest) {
  if (!supabaseConfigured || request.cookies.get(modeCookieName)?.value !== "real") return NextResponse.next({ request });
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(values) {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );
  let authenticated = false;
  try { const { data, error } = await supabase.auth.getClaims(); authenticated = !error && Boolean(data?.claims); }
  catch { authenticated = false; }
  const protectedPath = /^\/(dashboard|requests|request|match)(\/|$)/.test(request.nextUrl.pathname);
  if (protectedPath && !authenticated) {
    const redirect = NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(request.nextUrl.pathname)}`, request.url));
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }
  return response;
}
