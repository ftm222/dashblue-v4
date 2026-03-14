import { NextResponse } from "next/server";

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number = 400,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function apiErrorResponse(err: unknown): NextResponse<ApiErrorBody> {
  if (err instanceof ApiError) {
    return NextResponse.json(
      { code: err.code, message: err.message, details: err.details },
      { status: err.status },
    );
  }

  const message = err instanceof Error ? err.message : "Erro interno do servidor";
  console.error("[API Error]", err);

  return NextResponse.json(
    { code: "INTERNAL_ERROR", message },
    { status: 500 },
  );
}
