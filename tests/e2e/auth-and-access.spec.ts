import { expect, test } from "@playwright/test";

test("unauthenticated user is redirected to login for protected route", async ({ page }) => {
  await page.goto("/zorg");
  await expect(page).toHaveURL(/\/login/);
});

test("demo login gives access to core modules and health endpoint", async ({ page, request }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Aanmelden" }).click();

  await page.goto("/zorg");
  await expect(page.getByRole("heading", { name: "Zorgmodule" })).toBeVisible();

  await page.goto("/personeel");
  await expect(page.getByRole("heading", { name: "Personeel" })).toBeVisible();

  await page.goto("/beheer");
  await expect(page.getByRole("heading", { name: "Beheer" })).toBeVisible();

  const response = await request.get("/api/health");
  expect([200, 503]).toContain(response.status());

  const payload = (await response.json()) as {
    status: string;
    checks: { supabaseConfigured: boolean; databaseHealthy: boolean };
  };

  expect(["ok", "degraded"]).toContain(payload.status);
  expect(typeof payload.checks.supabaseConfigured).toBe("boolean");
  expect(typeof payload.checks.databaseHealthy).toBe("boolean");
});
