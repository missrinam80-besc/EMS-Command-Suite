import { expect, test, type Page } from "@playwright/test";

type TenantCreds = {
  email: string;
  password: string;
  ownPatientId: string;
  ownPatientLabel?: string;
  foreignPatientId: string;
  foreignPatientLabel?: string;
};

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Ontbrekende env var: ${name}`);
  }
  return value;
}

const tenantA: TenantCreds = {
  email: requiredEnv("E2E_TENANT_A_EMAIL"),
  password: requiredEnv("E2E_TENANT_A_PASSWORD"),
  ownPatientId: requiredEnv("E2E_TENANT_A_PATIENT_ID"),
  ownPatientLabel: process.env.E2E_TENANT_A_PATIENT_LABEL,
  foreignPatientId: requiredEnv("E2E_TENANT_B_PATIENT_ID"),
  foreignPatientLabel: process.env.E2E_TENANT_B_PATIENT_LABEL,
};

const tenantB: TenantCreds = {
  email: requiredEnv("E2E_TENANT_B_EMAIL"),
  password: requiredEnv("E2E_TENANT_B_PASSWORD"),
  ownPatientId: requiredEnv("E2E_TENANT_B_PATIENT_ID"),
  ownPatientLabel: process.env.E2E_TENANT_B_PATIENT_LABEL,
  foreignPatientId: requiredEnv("E2E_TENANT_A_PATIENT_ID"),
  foreignPatientLabel: process.env.E2E_TENANT_A_PATIENT_LABEL,
};

async function signIn(page: Page, creds: TenantCreds) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(creds.email);
  await page.getByLabel("Wachtwoord").fill(creds.password);
  await page.getByRole("button", { name: "Aanmelden" }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

function normalizeText(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

async function assertTenantIsolation(page: Page, creds: TenantCreds) {
  await page.goto(`/zorg/patienten/${creds.ownPatientId}`);
  await expect(page).toHaveURL(new RegExp(`/zorg/patienten/${creds.ownPatientId}`));

  if (creds.ownPatientLabel) {
    const body = normalizeText(await page.locator("body").innerText());
    expect(body).toContain(normalizeText(creds.ownPatientLabel));
  }

  await page.goto(`/zorg/patienten/${creds.foreignPatientId}`);
  const foreignBody = normalizeText(await page.locator("body").innerText());

  if (creds.foreignPatientLabel) {
    expect(foreignBody).not.toContain(normalizeText(creds.foreignPatientLabel));
  }
}

test.describe("cross-tenant isolation", () => {
  test("tenant A sees own patient and not tenant B patient", async ({ page, request }) => {
    await signIn(page, tenantA);
    await assertTenantIsolation(page, tenantA);

    const exports = await Promise.all([
      request.get("/api/exports/kpi"),
      request.get("/api/exports/reports"),
      request.get("/api/exports/audit"),
    ]);
    for (const response of exports) {
      expect(response.status()).toBe(200);
    }
  });

  test("tenant B sees own patient and not tenant A patient", async ({ page, request }) => {
    await signIn(page, tenantB);
    await assertTenantIsolation(page, tenantB);

    const exports = await Promise.all([
      request.get("/api/exports/kpi"),
      request.get("/api/exports/reports"),
      request.get("/api/exports/audit"),
    ]);
    for (const response of exports) {
      expect(response.status()).toBe(200);
    }
  });
});
