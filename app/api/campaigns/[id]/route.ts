import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { adminClient } from "@/lib/supabase-admin";
import { ApiError, apiErrorResponse } from "@/lib/api-error";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function getAuthUser(request: Request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) throw new ApiError("UNAUTHORIZED", "Token ausente.", 401);

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
  const { data } = await supabase.auth.getUser(token);
  if (!data?.user) throw new ApiError("UNAUTHORIZED", "Token inválido.", 401);

  const orgId = data.user.user_metadata?.organization_id as string | undefined;
  if (!orgId) throw new ApiError("FORBIDDEN", "Usuário sem organização.", 403);

  return { user: data.user, orgId };
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { orgId } = await getAuthUser(request);
    const { id } = await params;
    const body = await request.json();

    const allowedFields = [
      "name", "source", "medium", "investment", "impressions", "clicks",
      "leads", "booked", "received", "won", "revenue", "period_start", "period_end",
    ];

    const fields: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) fields[key] = body[key];
    }

    const { data, error } = await adminClient
      .from("campaigns")
      .update(fields)
      .eq("id", id)
      .eq("organization_id", orgId)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { orgId } = await getAuthUser(request);
    const { id } = await params;

    const { error } = await adminClient
      .from("campaigns")
      .delete()
      .eq("id", id)
      .eq("organization_id", orgId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
