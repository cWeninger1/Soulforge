import { test, expect } from "@playwright/test";
test("register, create, equip, save, sign back in and delete a traveler", async ({
  page,
  context,
}) => {
  test.skip(
    !process.env.FIRESTORE_EMULATOR_HOST,
    "Requires the local Firebase Emulator Suite",
  );
  const email = "traveler-" + crypto.randomUUID() + "@example.test";
  const password = "test-password-123";
  await page.goto("/account");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Register", exact: true }).click();
  await page.getByLabel("Character name").fill("Reed Walker");
  for (let i = 0; i < 5; i++)
    await page.getByRole("button", { name: /Strength \d+ \+/ }).click();
  await page
    .getByRole("button", { name: "Create character", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Continue adventure" }),
  ).toBeVisible();
  const olderSession = await context.newPage();
  await olderSession.goto("/account");
  await expect(
    olderSession.getByRole("button", { name: "Continue adventure" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue adventure" }).click();
  await page.getByRole("button", { name: "Inventory (I)" }).click();
  await page.getByRole("button", { name: "Willow Crook", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Remove Willow Crook" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Save and return to camp" }).click();
  await expect(
    page.getByRole("button", { name: "Continue adventure" }),
  ).toBeVisible();
  await olderSession
    .getByRole("button", { name: "Continue adventure" })
    .click();
  await olderSession.getByRole("button", { name: "Inventory (I)" }).click();
  await olderSession
    .getByRole("button", { name: "Willow Crook", exact: true })
    .click();
  await expect(
    olderSession.getByRole("button", { name: "Reload cloud progress" }),
  ).toBeVisible();
  await olderSession
    .getByRole("button", { name: "Reload cloud progress" })
    .click();
  await olderSession
    .getByRole("button", { name: "Continue adventure" })
    .click();
  await olderSession.getByRole("button", { name: "Inventory (I)" }).click();
  await expect(
    olderSession.getByRole("button", { name: "Remove Willow Crook" }),
  ).toBeVisible();
  await olderSession.close();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(
    page.getByRole("button", { name: "Register", exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("button", { name: "Continue adventure" }).click();
  await page.getByRole("button", { name: "Inventory (I)" }).click();
  await expect(
    page.getByRole("button", { name: "Remove Willow Crook" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Save and return to camp" }).click();
  await page.getByRole("button", { name: "Delete account" }).click();
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Permanently delete" }).click();
  await expect(page.getByRole("button", { name: "Register" })).toBeVisible();
});
