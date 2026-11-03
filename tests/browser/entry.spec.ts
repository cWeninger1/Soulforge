import { test, expect } from "@playwright/test";
test("enter a rendered valley and return to camp", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("link", { name: "Enter Emberfall Valley" }).click();
  await expect(
    page.getByRole("heading", { name: "Emberfall Valley" }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toHaveCount(0);
  await expect(page.locator("canvas")).toBeVisible();
  await page.getByRole("button", { name: "Spellforge (K)" }).click();
  await page.getByLabel("Spell name").fill("Cinder Arrow");
  await page.getByRole("button", { name: "Save spell" }).click();
  await page
    .getByLabel("Slot 1", { exact: true })
    .selectOption({ label: "Cinder Arrow" });
  await page.getByRole("button", { name: "Spellforge (K)" }).click();
  await page.keyboard.down("Shift");
  await page.keyboard.down("w");
  await expect(page.getByText("Whispering Woods")).toBeVisible({
    timeout: 20000,
  });
  await page.keyboard.up("w");
  await page.keyboard.up("Shift");
  await page.getByRole("button", { name: "Target", exact: true }).click();
  await page.getByRole("button", { name: "1 · Cinder Arrow" }).click();
  await expect(
    page.getByText("Cast Cinder Arrow", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Attack (F)" }).click();
  await expect(
    page.getByText("Forest Wolf defeated", { exact: false }),
  ).toBeVisible({ timeout: 20000 });
  await page.getByRole("button", { name: "Character (C)" }).click();
  await page.getByRole("button", { name: "Increase Strength" }).click();
  await expect(page.getByText("4 points available")).toBeVisible();
  await page.getByRole("link", { name: "Return to camp" }).click();
  await expect(page.getByRole("heading", { name: "Soulforge" })).toBeVisible();
  expect(errors).toEqual([]);
});
