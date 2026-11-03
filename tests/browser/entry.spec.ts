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
  await page.keyboard.down("Shift");
  await page.keyboard.down("w");
  await expect(page.getByText("Whispering Woods")).toBeVisible({
    timeout: 20000,
  });
  await page.keyboard.up("w");
  await page.keyboard.up("Shift");
  await page.getByRole("link", { name: "Return to camp" }).click();
  await expect(page.getByRole("heading", { name: "Soulforge" })).toBeVisible();
  expect(errors).toEqual([]);
});
