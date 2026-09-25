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

test("progresses from power-on through firmware and sequential services", async ({ page }) => {
  const failures = monitorPageFailures(page);
  const app = page.locator("#app");

  const response = await page.goto("/");

  expect(response?.ok()).toBe(true);
  await expect(page.getByRole("heading", { name: "SHADOW OS power on" })).toBeAttached();
  await expect(app).toHaveAttribute("data-boot-stage", "power-on");

  await expect(page.getByRole("heading", { name: "SHADOW SYSTEMS" })).toBeVisible();
  await expect(app).toHaveAttribute("data-boot-stage", "firmware");
  await expect(page.getByText("MEMORY")).toBeVisible();

  await expect(page.getByRole("heading", { name: "System initialization" })).toBeVisible();
  await expect(app).toHaveAttribute("data-boot-stage", "system-initialization");

  const coreService = page.getByRole("listitem").filter({ hasText: "System core" });
  const clockService = page.getByRole("listitem").filter({ hasText: "System clock" });
  const displayService = page.getByRole("listitem").filter({ hasText: "Display system" });

  await expect(app).toHaveAttribute("data-boot-stage", "system-core");
  await expect(coreService).toContainText("[ initializing ]", { ignoreCase: true });
  await expect(clockService).toContainText("[ waiting ]", { ignoreCase: true });

  await expect(app).toHaveAttribute("data-boot-stage", "system-clock");
  await expect(coreService).toContainText("[ ok ]", { ignoreCase: true });
  await expect(clockService).toContainText("[ initializing ]", { ignoreCase: true });

  await expect(app).toHaveAttribute("data-boot-stage", "display-system");
  await expect(clockService).toContainText("[ ok ]", { ignoreCase: true });
  await expect(displayService).toContainText("[ initializing ]", { ignoreCase: true });

  await expect(app).toHaveAttribute("data-boot-stage", "finalizing");
  await expect(displayService).toContainText("[ ok ]", { ignoreCase: true });
  await expect(page.getByText("Preparing desktop environment")).toBeVisible();

  await expect(page.getByRole("heading", { name: "Desktop ready" })).toBeVisible();
  await expect(app).toHaveAttribute("data-runtime-phase", "ready");
  expect(failures).toEqual([]);
});

test("boots into the desktop through a keyboard-accessible skip", async ({ page }) => {
  const failures = monitorPageFailures(page);
  await page.goto("/");

  await page.keyboard.press("Tab");
  const skipButton = page.getByRole("button", { name: "Skip boot sequence" });
  await expect(skipButton).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page.getByRole("heading", { name: "Desktop ready" })).toBeVisible();
  await expect(page.locator("#app")).toHaveAttribute("data-runtime-phase", "ready");
  expect(failures).toEqual([]);
});

test("reduced motion preserves a shorter coherent boot sequence", async ({ page }) => {
  const failures = monitorPageFailures(page);
  await page.emulateMedia({ reducedMotion: "reduce" });

  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  await expect(page.getByRole("heading", { name: "SHADOW SYSTEMS" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "System initialization" })).toBeVisible();
  await expect(page.locator("#app")).toHaveAttribute("data-boot-stage", "system-core");
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
  await expect(page.getByRole("heading", { name: "SHADOW OS power on" })).toBeAttached();
  await expect(page.locator("#app")).toHaveAttribute("data-boot-stage", "power-on");
  await page.getByRole("button", { name: "Skip boot sequence" }).click();

  await expect(page.getByText("ENVIRONMENT / CYCLE 02")).toBeVisible();
  expect(await page.evaluate(() => performance.getEntriesByType("navigation").length)).toBe(
    navigationEntriesBefore,
  );
  expect(failures).toEqual([]);
});

test("displays the local browser time while preserving the ISO instant", async ({ page }) => {
  const failures = monitorPageFailures(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Skip boot sequence" }).click();

  const clockPanel = page.getByLabel("SHADOW OS system clock");
  const timeElement = clockPanel.getByRole("time");
  const iso = await timeElement.getAttribute("datetime");
  expect(iso).not.toBeNull();
  const expected = await page.evaluate((timestamp) => {
    const value = new Date(timestamp!);
    const pad = (part: number): string => part.toString().padStart(2, "0");

    return {
      time: `${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`,
      date: `${value.getFullYear()}.${pad(value.getMonth() + 1)}.${pad(value.getDate())}`,
    };
  }, iso);

  await expect(timeElement).toHaveText(expected.time);
  await expect(clockPanel.locator(".system-clock__date")).toHaveText(expected.date);
  expect(new Date(iso!).toISOString()).toBe(iso);
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
