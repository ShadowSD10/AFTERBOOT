import { expect, test } from "@playwright/test";

test("loads the AFTERBOOT host with SHADOW OS branding", async ({ page }) => {
  const pageFailures: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      pageFailures.push(message.text());
    }
  });
  page.on("pageerror", (error) => pageFailures.push(error.message));

  const response = await page.goto("/");

  expect(response?.ok()).toBe(true);
  await expect(page.getByRole("heading", { name: "AFTERBOOT" })).toBeVisible();
  await expect(page.getByText("SHADOW OS")).toBeVisible();
  await expect(page.getByRole("status")).toContainText("being prepared");
  expect(pageFailures).toEqual([]);
});
