import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const PUBLIC_PATHS = ["/", "/login", "/register", "/forgot-password", "/reset-password"];
const API_PUBLIC_PATHS = ["/api/auth/register", "/api/integrations/webhook"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isPublicPage = PUBLIC_PATHS.some((p) => pathname === p);
  const isPublicApi = API_PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (isPublicPage || isPublicApi) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  const accessToken =
    request.cookies.get("sb-access-token")?.value ||
    request.cookies.get(`sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token`)?.value;

  let isAuthenticated = false;

  if (accessToken) {
    try {
      const parsed = JSON.parse(accessToken);
      const token = Array.isArray(parsed) ? parsed[0] : parsed?.access_token || parsed;

      if (typeof token === "string" && token.length > 20) {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false },
        });

        const { data } = await supabase.auth.getUser(token);
        isAuthenticated = !!data?.user;
      }
    } catch {
      isAuthenticated = false;
    }
  }

  if (!isAuthenticated) {
    const allCookies = request.cookies.getAll();
    const authCookie = allCookies.find(
      (c) => c.name.includes("auth-token") || c.name.includes("sb-"),
    );

    if (authCookie?.value) {
      try {
        const parsed = JSON.parse(authCookie.value);
        const token = Array.isArray(parsed) ? parsed[0] : parsed?.access_token || parsed;

        if (typeof token === "string" && token.length > 20) {
          const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            auth: { persistSession: false },
          });
          const { data } = await supabase.auth.getUser(token);
          isAuthenticated = !!data?.user;
        }
      } catch {
        isAuthenticated = false;
      }
    }
  }

  if (!isAuthenticated && pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (!isAuthenticated && !pathname.startsWith("/api/")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
