import { expect, test, type Page } from "@playwright/test";

type Creds = { email: string; password: string };

function getCreds(prefix: string): Creds | null {
  const email = process.env[`${prefix}_EMAIL`];
  const password = process.env[`${prefix}_PASSWORD`];
  if (!email || !password) return null;
  return { email, password };
}

async function signIn(page: Page, creds: Creds) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(creds.email);
  await page.getByLabel("Wachtwoord").fill(creds.password);
  await page.getByRole("button", { name: "Aanmelden" }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

test.describe("delegated admin permission model", () => {
  const globalAdmin = getCreds("E2E_GLOBAL_ADMIN");
  const tenantAdmin = getCreds("E2E_TENANT_ADMIN");
  const nonAdmin = getCreds("E2E_NON_ADMIN");

  test("global admin has access to scoped beheer pages and exports", async ({ page }) => {
    test.skip(!globalAdmin, "E2E_GLOBAL_ADMIN credentials ontbreken.");
    await signIn(page, globalAdmin!);

    await page.goto("/beheer");
    await expect(page.getByRole("heading", { name: "Beheer" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open intelligence dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open integraties & automations" })).toBeVisible();

    await page.goto("/beheer/intelligence");
    await expect(page.getByRole("heading", { name: /Data intelligence/i })).toBeVisible();

    await page.goto("/beheer/integraties");
    await expect(page.getByRole("heading", { name: /Integraties en automatisatie/i })).toBeVisible();

    const responses = await Promise.all([
      page.request.get("/api/exports/kpi"),
      page.request.get("/api/exports/reports"),
      page.request.get("/api/exports/audit"),
    ]);
    for (const response of responses) {
      expect(response.status()).toBe(200);
    }
  });

  test("tenant admin has access to scoped pages and tenant-safe exports", async ({ page }) => {
    test.skip(!tenantAdmin, "E2E_TENANT_ADMIN credentials ontbreken.");
    await signIn(page, tenantAdmin!);

    await page.goto("/beheer");
    await expect(page.getByRole("heading", { name: "Beheer" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open intelligence dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open integraties & automations" })).toBeVisible();

    await page.goto("/beheer/intelligence");
    await expect(page.getByRole("heading", { name: /Data intelligence/i })).toBeVisible();

    await page.goto("/beheer/integraties");
    await expect(page.getByRole("heading", { name: /Integraties en automatisatie/i })).toBeVisible();

    const responses = await Promise.all([
      page.request.get("/api/exports/kpi"),
      page.request.get("/api/exports/reports"),
      page.request.get("/api/exports/audit"),
    ]);
    for (const response of responses) {
      expect(response.status()).toBe(200);
    }
  });

  test("non-admin cannot access beheer scoped pages or exports", async ({ page }) => {
    test.skip(!nonAdmin, "E2E_NON_ADMIN credentials ontbreken.");
    await signIn(page, nonAdmin!);

    await page.goto("/beheer");
    await expect(page).not.toHaveURL(/\/beheer(\/|$)/);

    for (const path of ["/beheer/intelligence", "/beheer/integraties"]) {
      await page.goto(path);
      await expect(page).not.toHaveURL(new RegExp(`${path.replace("/", "\\/")}$`));
    }

    const responses = await Promise.all([
      page.request.get("/api/exports/kpi"),
      page.request.get("/api/exports/reports"),
      page.request.get("/api/exports/audit"),
    ]);
    for (const response of responses) {
      expect([401, 403]).toContain(response.status());
    }
  });
});
