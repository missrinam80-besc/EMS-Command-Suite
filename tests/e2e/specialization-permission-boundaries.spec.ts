import { expect, test, type Page } from "@playwright/test";

type SpecialistEnv = {
  allowedEmail?: string;
  allowedPassword?: string;
  blockedEmail?: string;
  blockedPassword?: string;
  patientId?: string;
  traumaReportId?: string;
};

const specEnv: SpecialistEnv = {
  allowedEmail: process.env.E2E_SPEC_TRAUMA_ALLOWED_EMAIL,
  allowedPassword: process.env.E2E_SPEC_TRAUMA_ALLOWED_PASSWORD,
  blockedEmail: process.env.E2E_SPEC_TRAUMA_BLOCKED_EMAIL,
  blockedPassword: process.env.E2E_SPEC_TRAUMA_BLOCKED_PASSWORD,
  patientId: process.env.E2E_SPEC_TRAUMA_PATIENT_ID,
  traumaReportId: process.env.E2E_SPEC_TRAUMA_REPORT_ID,
};

function hasSpecEnv() {
  return Boolean(
    specEnv.allowedEmail &&
      specEnv.allowedPassword &&
      specEnv.blockedEmail &&
      specEnv.blockedPassword &&
      specEnv.patientId &&
      specEnv.traumaReportId,
  );
}

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Wachtwoord").fill(password);
  await page.getByRole("button", { name: "Aanmelden" }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

test.describe("specialization permission boundaries", () => {
  test("authorized specialist can open trauma report edit page", async ({ page }) => {
    test.skip(!hasSpecEnv(), "Specialization e2e env ontbreekt.");
    await signIn(page, specEnv.allowedEmail!, specEnv.allowedPassword!);

    await page.goto(
      `/zorg/patienten/${specEnv.patientId}/rapporten/trauma/${specEnv.traumaReportId}/bewerken`,
    );
    await expect(page).toHaveURL(
      new RegExp(
        `/zorg/patienten/${specEnv.patientId}/rapporten/trauma/${specEnv.traumaReportId}/bewerken`,
      ),
    );
  });

  test("non-specialist is blocked from trauma report edit page", async ({ page }) => {
    test.skip(!hasSpecEnv(), "Specialization e2e env ontbreekt.");
    await signIn(page, specEnv.blockedEmail!, specEnv.blockedPassword!);

    await page.goto(
      `/zorg/patienten/${specEnv.patientId}/rapporten/trauma/${specEnv.traumaReportId}/bewerken`,
    );
    await expect(page).not.toHaveURL(
      new RegExp(
        `/zorg/patienten/${specEnv.patientId}/rapporten/trauma/${specEnv.traumaReportId}/bewerken`,
      ),
    );
  });
});
