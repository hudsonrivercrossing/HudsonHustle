import { expect, test } from "@playwright/test";

test("can reach the setup screen", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Learn the board in a few minutes" })).toBeVisible();
  await page.getByRole("button", { name: "Skip tutorial" }).click();
  await expect(page.getByRole("heading", { name: "Hudson Hustle" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start new game" })).toBeVisible();
  await page.getByRole("button", { name: "How to play" }).click();
  await expect(page.getByRole("heading", { name: "Set up your first table" })).toBeVisible();
});
