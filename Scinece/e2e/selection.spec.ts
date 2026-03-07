import { expect, test } from "@playwright/test";

test("pick Zn as A and CuSO4 as B", async ({ page }) => {
  await page.goto("/");

  await page.getByTestId("reactant-a-btn").click();
  await page.getByRole("button", { name: "Zn" }).click();
  await page.getByRole("button", { name: /Set as Reactant A/i }).click();
  await expect(page.getByTestId("reactant-a-value")).toHaveText("Zn");

  await page.getByTestId("reactant-b-btn").click();
  await page.getByRole("button", { name: "compounds" }).click();
  await page.getByRole("button", { name: "CuSO4" }).click();
  await expect(page.getByTestId("reactant-b-value")).toHaveText("CuSO4");
});
