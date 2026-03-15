import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const checks: Record<string, { status: "ok" | "error"; latencyMs?: number; error?: string }> = {};
  const start = Date.now();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    const dbStart = Date.now();
    try {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
      });
      const { error } = await supabase.from("setup_checklist").select("key").limit(1);
      checks.database = error
        ? { status: "error", latencyMs: Date.now() - dbStart, error: error.message }
        : { status: "ok", latencyMs: Date.now() - dbStart };
    } catch (err) {
      checks.database = {
        status: "error",
        latencyMs: Date.now() - dbStart,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  } else {
    checks.database = { status: "error", error: "Supabase not configured" };
  }

  checks.runtime = { status: "ok", latencyMs: 0 };

  const allOk = Object.values(checks).every((c) => c.status === "ok");

  return NextResponse.json(
    {
      status: allOk ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      totalLatencyMs: Date.now() - start,
      checks,
      version: process.env.npm_package_version || "0.1.0",
      environment: process.env.NODE_ENV || "development",
    },
    { status: allOk ? 200 : 503 },
  );
}
