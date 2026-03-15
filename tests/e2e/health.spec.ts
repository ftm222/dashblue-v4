import { test, expect } from "@playwright/test";

test.describe("Health Check", () => {
  test("GET /api/health should return status", async ({ request }) => {
    const response = await request.get("/api/health");
    const body = await response.json();

    expect(body).toHaveProperty("status");
    expect(body).toHaveProperty("timestamp");
    expect(body).toHaveProperty("checks");
    expect(["healthy", "degraded"]).toContain(body.status);
  });
});

test.describe("Auth", () => {
  test("GET /overview without auth should redirect to login", async ({ page }) => {
    await page.goto("/overview");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("/login");
  });

  test("Landing page should be accessible", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Dashblue/);
  });
});
