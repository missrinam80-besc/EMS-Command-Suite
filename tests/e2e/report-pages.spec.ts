import { expect, test } from "@playwright/test";

test("demo login and navigate to trauma/opname pages", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Aanmelden" }).click();

  await expect(page).toHaveURL(/\/(zorg|personeel|organisatie|beheer|$)/);

  await page.goto("/zorg/patienten");
  await expect(page.getByText("Patientenregister")).toBeVisible();

  const firstPatientLink = page.locator('a[href^="/zorg/patienten/"]').first();
  await firstPatientLink.click();
  await expect(page).toHaveURL(/\/zorg\/patienten\//);

  await page.getByRole("link", { name: "Nieuw traumarapport" }).click();
  await expect(page).toHaveURL(/\/rapporten\/trauma\/nieuw/);
  await expect(page.getByRole("heading", { name: "Nieuw traumarapport" })).toBeVisible();

  await page.goto(page.url().replace("/rapporten/trauma/nieuw", "/rapporten/opname/nieuw"));
  await expect(page).toHaveURL(/\/rapporten\/opname\/nieuw/);
  await expect(page.getByRole("heading", { name: "Nieuw opnamerapport" })).toBeVisible();
});
