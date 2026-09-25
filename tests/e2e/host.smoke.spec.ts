import { expect, test, type Page } from "@playwright/test";

function monitorPageFailures(page: Page): string[] {
  const failures: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      failures.push(`console: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => failures.push(`page: ${error.message}`));
  page.on("requestfailed", (request) => {
    failures.push(`request: ${request.url()} ${request.failure()?.errorText ?? "unknown failure"}`);
  });

  return failures;
}

test("boots into the desktop through a keyboard-accessible skip", async ({ page }) => {
  const failures = monitorPageFailures(page);

  const response = await page.goto("/");

  expect(response?.ok()).toBe(true);
  await expect(page.getByRole("heading", { name: "System bootstrap" })).toBeVisible();
  await expect(page.getByText("SHADOW OS")).toBeVisible();
  await expect(page.locator("#app")).toHaveAttribute("data-runtime-phase", "booting");

  await page.keyboard.press("Tab");
  const skipButton = page.getByRole("button", { name: "Skip boot sequence" });
  await expect(skipButton).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page.getByRole("heading", { name: "Desktop ready" })).toBeVisible();
  await expect(page.locator("#app")).toHaveAttribute("data-runtime-phase", "ready");
  await expect(page.getByLabel("SHADOW OS system clock").getByRole("time")).toHaveText(
    /^\d{2}:\d{2}:\d{2}$/,
  );
  expect(failures).toEqual([]);
});

test("reduced motion reaches the desktop without a blocking boot delay", async ({ page }) => {
  const failures = monitorPageFailures(page);
  await page.emulateMedia({ reducedMotion: "reduce" });

  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  await expect(page.getByRole("heading", { name: "Desktop ready" })).toBeVisible();
  await expect(page.locator("#app")).toHaveAttribute("data-runtime-phase", "ready");
  expect(failures).toEqual([]);
});

test("resets and completes another boot cycle without reloading", async ({ page }) => {
  const failures = monitorPageFailures(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Skip boot sequence" }).click();
  await expect(page.getByText("ENVIRONMENT / CYCLE 01")).toBeVisible();
  const navigationEntriesBefore = await page.evaluate(
    () => performance.getEntriesByType("navigation").length,
  );

  await page.getByRole("button", { name: "Restart SHADOW OS" }).click();
  await expect(page.getByRole("heading", { name: "System bootstrap" })).toBeVisible();
  await page.getByRole("button", { name: "Skip boot sequence" }).click();

  await expect(page.getByText("ENVIRONMENT / CYCLE 02")).toBeVisible();
  expect(await page.evaluate(() => performance.getEntriesByType("navigation").length)).toBe(
    navigationEntriesBefore,
  );
  expect(failures).toEqual([]);
});

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 360, height: 740 },
] as const) {
  test(`keeps the ready shell usable at the ${viewport.name} viewport`, async ({ page }) => {
    const failures = monitorPageFailures(page);
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");
    await page.getByRole("button", { name: "Skip boot sequence" }).click();

    await expect(page.getByRole("heading", { name: "Desktop ready" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Restart SHADOW OS" })).toBeVisible();
    const pageSize = await page.locator("body").evaluate((body) => ({
      scrollWidth: body.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    }));

    expect(pageSize.scrollWidth).toBeLessThanOrEqual(pageSize.viewportWidth);
    expect(failures).toEqual([]);
  });
}
