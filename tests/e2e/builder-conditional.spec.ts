import { expect, test } from "@playwright/test";

function randomSuffix() {
  return Date.now().toString().slice(-6);
}

test("builder condition operators update conditional JSON", async ({ page }) => {
  const suffix = randomSuffix();
  const reportTypeCode = `e2e_rt_${suffix}`;
  const templateCode = `e2e_tpl_${suffix}`;

  await page.goto("/login");
  await page.getByRole("button", { name: "Aanmelden" }).click();

  await page.goto("/beheer/rapporten-formulieren");
  await expect(page.getByRole("heading", { name: "Builder" })).toBeVisible();

  const reportTypeForm = page.locator('form[action*="createReportTypeAction"]').first();
  await reportTypeForm.getByPlaceholder("spoed_observatie").fill(reportTypeCode);
  await reportTypeForm.getByPlaceholder("Spoedobservatie").fill(`E2E RT ${suffix}`);
  await reportTypeForm.getByRole("button", { name: "Rapporttype aanmaken" }).click();

  const templateForm = page.locator('form[action*="createFormTemplateAction"]').first();
  await templateForm.getByPlaceholder("medicatie_registratie").fill(templateCode);
  await templateForm.getByPlaceholder("Medicatieregistratie").fill(`E2E Template ${suffix}`);
  await templateForm.locator('select[name="templateKind"]').selectOption("report");
  await templateForm.locator('select[name="reportTypeCode"]').selectOption(reportTypeCode);
  await templateForm.getByRole("button", { name: "Template aanmaken" }).click();

  const fieldForm = page.locator('form[action*="createFormFieldAction"]').first();

  await fieldForm.locator('select[name="templateId"]').selectOption({ label: new RegExp(`E2E Template ${suffix}`) });
  await fieldForm.getByPlaceholder("klinische_status").fill(`trigger_${suffix}`);
  await fieldForm.getByPlaceholder("Klinische status").fill(`Trigger ${suffix}`);
  await fieldForm.locator('select[name="fieldType"]').selectOption("select");
  await fieldForm.getByPlaceholder("Sectie key (bv. intake)").fill("general");
  await fieldForm.getByPlaceholder("Meerkeuzeopties (1 per lijn)").fill("P1\nP2\nP3");
  await fieldForm.getByRole("button", { name: "Veld aanmaken" }).click();

  await fieldForm.locator('select[name="templateId"]').selectOption({ label: new RegExp(`E2E Template ${suffix}`) });
  await fieldForm.getByPlaceholder("klinische_status").fill(`dependent_${suffix}`);
  await fieldForm.getByPlaceholder("Klinische status").fill(`Dependent ${suffix}`);
  await fieldForm.locator('select[name="fieldType"]').selectOption("text");
  await fieldForm.getByPlaceholder("Sectie key (bv. intake)").fill("general");
  await fieldForm.getByRole("button", { name: "Veld aanmaken" }).click();

  const templateCard = page.locator("article", { hasText: `E2E Template ${suffix}` }).first();
  const dependentForm = templateCard.locator("form", { has: page.locator(`input[value="dependent_${suffix}"]`) }).first();

  await dependentForm.locator('input[name="_condField"]').fill(`trigger_${suffix}`);
  await dependentForm.locator('select[name="_condOp"]').selectOption("in");
  await dependentForm.locator('input[name="_condVal"]').fill("P1,P2");

  await expect(dependentForm.locator('textarea[name="conditionalLogic"]')).toContainText('"operator":"in"');
  await expect(dependentForm.locator('textarea[name="conditionalLogic"]')).toContainText('"value":["P1","P2"]');
});
