import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const PUBLIC_PATHS = ["/", "/login", "/register", "/forgot-password", "/reset-password"];
const API_PUBLIC_PATHS = [
  "/api/auth/register",
  "/api/auth/login",
  "/api/auth/dev-login",
  "/api/integrations/webhook",
  "/api/billing/webhook",
  "/api/health",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets — pass through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Public pages — pass through (AuthProvider handles client-side redirects)
  const normalizedPath = pathname === "" ? "/" : pathname;
  const isPublicPage = PUBLIC_PATHS.some((p) => normalizedPath === p || normalizedPath === p + "/");
  if (isPublicPage || !pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Public APIs — pass through
  const isPublicApi = API_PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublicApi) {
    return NextResponse.next();
  }

  // Protected API routes — verify auth via Authorization header
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    // Fallback: try to extract from Supabase auth cookie
    const allCookies = request.cookies.getAll();
    const ref = new URL(supabaseUrl).hostname.split(".")[0];
    const authCookie = allCookies.find(
      (c) => c.name === `sb-${ref}-auth-token` || c.name.includes("auth-token"),
    );

    if (!authCookie?.value) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    try {
      const parsed = JSON.parse(authCookie.value);
      const cookieToken = Array.isArray(parsed) ? parsed[0] : parsed?.access_token || parsed;

      if (typeof cookieToken === "string" && cookieToken.length > 20) {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          auth: { persistSession: false },
        });
        const { data } = await supabase.auth.getUser(cookieToken);
        if (data?.user) return NextResponse.next();
      }
    } catch {
      // cookie parsing failed
    }

    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Verify Bearer token
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });
    const { data } = await supabase.auth.getUser(token);
    if (!data?.user) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
