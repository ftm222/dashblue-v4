import { describe, it, expect } from "vitest";
import { ApiError, apiErrorResponse } from "@/lib/api-error";

describe("ApiError", () => {
  it("should create error with code, message, and status", () => {
    const err = new ApiError("TEST_ERROR", "Test message", 422);
    expect(err.code).toBe("TEST_ERROR");
    expect(err.message).toBe("Test message");
    expect(err.status).toBe(422);
    expect(err.name).toBe("ApiError");
  });

  it("should default to status 400", () => {
    const err = new ApiError("BAD", "Bad request");
    expect(err.status).toBe(400);
  });
});

describe("apiErrorResponse", () => {
  it("should return correct response for ApiError", () => {
    const err = new ApiError("NOT_FOUND", "Resource not found", 404);
    const response = apiErrorResponse(err);
    expect(response.status).toBe(404);
  });

  it("should return 500 for generic errors", () => {
    const response = apiErrorResponse(new Error("Unexpected"));
    expect(response.status).toBe(500);
  });

  it("should return 500 for non-Error values", () => {
    const response = apiErrorResponse("string error");
    expect(response.status).toBe(500);
  });
});
