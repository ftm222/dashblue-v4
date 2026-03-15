import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  inviteSchema,
  tagSchema,
  goalSchema,
  profileUpdateSchema,
  validateBody,
} from "@/lib/validations";

describe("registerSchema", () => {
  it("should accept valid registration data", () => {
    const result = registerSchema.safeParse({
      name: "João Silva",
      email: "joao@example.com",
      password: "12345678",
    });
    expect(result.success).toBe(true);
  });

  it("should reject short name", () => {
    const result = registerSchema.safeParse({
      name: "J",
      email: "joao@example.com",
      password: "12345678",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid email", () => {
    const result = registerSchema.safeParse({
      name: "João",
      email: "not-an-email",
      password: "12345678",
    });
    expect(result.success).toBe(false);
  });

  it("should reject short password", () => {
    const result = registerSchema.safeParse({
      name: "João",
      email: "joao@example.com",
      password: "1234",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("should accept valid login data", () => {
    const result = loginSchema.safeParse({
      email: "user@test.com",
      password: "mypassword",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty password", () => {
    const result = loginSchema.safeParse({
      email: "user@test.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("inviteSchema", () => {
  it("should accept valid invite with all roles", () => {
    for (const role of ["owner", "admin", "manager", "viewer"]) {
      const result = inviteSchema.safeParse({
        name: "Maria",
        email: "maria@test.com",
        role,
      });
      expect(result.success).toBe(true);
    }
  });

  it("should default role to viewer", () => {
    const result = inviteSchema.safeParse({
      name: "Maria",
      email: "maria@test.com",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe("viewer");
    }
  });

  it("should reject invalid role", () => {
    const result = inviteSchema.safeParse({
      name: "Maria",
      email: "maria@test.com",
      role: "superadmin",
    });
    expect(result.success).toBe(false);
  });
});

describe("tagSchema", () => {
  it("should accept valid tag", () => {
    const result = tagSchema.safeParse({
      name: "Hot Lead",
      alias: "hot_lead",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty name", () => {
    const result = tagSchema.safeParse({
      name: "",
      alias: "test",
    });
    expect(result.success).toBe(false);
  });
});

describe("goalSchema", () => {
  it("should accept valid goal", () => {
    const result = goalSchema.safeParse({
      type: "revenue",
      target: 50000,
      periodStart: "2026-03-01",
      periodEnd: "2026-03-31",
    });
    expect(result.success).toBe(true);
  });

  it("should reject negative target", () => {
    const result = goalSchema.safeParse({
      type: "revenue",
      target: -100,
      periodStart: "2026-03-01",
      periodEnd: "2026-03-31",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid date format", () => {
    const result = goalSchema.safeParse({
      type: "leads",
      target: 100,
      periodStart: "03/01/2026",
      periodEnd: "03/31/2026",
    });
    expect(result.success).toBe(false);
  });
});

describe("profileUpdateSchema", () => {
  it("should accept partial updates", () => {
    const result = profileUpdateSchema.safeParse({ name: "Novo Nome" });
    expect(result.success).toBe(true);
  });

  it("should accept null phone", () => {
    const result = profileUpdateSchema.safeParse({ phone: null });
    expect(result.success).toBe(true);
  });
});

describe("validateBody", () => {
  it("should return data on success", () => {
    const result = validateBody(tagSchema, { name: "test", alias: "t" });
    expect(result.data).toEqual({ name: "test", alias: "t" });
    expect(result.error).toBeNull();
  });

  it("should return error on failure", () => {
    const result = validateBody(tagSchema, { name: "", alias: "" });
    expect(result.data).toBeNull();
    expect(result.error).toBeTruthy();
  });
});
