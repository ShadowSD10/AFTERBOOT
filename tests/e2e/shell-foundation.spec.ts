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

async function openDesktop(page: Page): Promise<string[]> {
  const failures = monitorPageFailures(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Skip boot sequence" }).click();
  await expect(page.getByRole("heading", { name: "Desktop ready" })).toBeVisible();
  return failures;
}

async function openDrawer(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Applications" }).click();
  await expect(page.getByRole("dialog", { name: "Applications" })).toBeVisible();
}

async function launchDiagnostics(page: Page): Promise<void> {
  await openDrawer(page);
  await page
    .getByRole("dialog", { name: "Applications" })
    .getByRole("button", { name: /System Diagnostics/ })
    .click();
  await expect(page.getByRole("dialog", { name: "System Diagnostics" })).toBeVisible();
}

test("discovers applications in the drawer while the task strip tracks running windows", async ({
  page,
}) => {
  const failures = await openDesktop(page);
  const trigger = page.getByRole("button", { name: "Applications" });
  const taskStrip = page.getByRole("navigation", { name: "Open windows" });

  await expect(taskStrip.getByRole("button")).toHaveCount(0);
  await trigger.focus();
  await page.keyboard.press("Enter");
  const drawer = page.getByRole("dialog", { name: "Applications" });
  const diagnostics = drawer.getByRole("button", { name: /System Diagnostics/ });
  await expect(diagnostics).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(trigger).toBeFocused();

  await openDrawer(page);
  await page.locator(".system-header").click();
  await expect(drawer).toBeHidden();

  await launchDiagnostics(page);
  await expect(taskStrip.getByRole("button", { name: "Focus System Diagnostics" })).toHaveCount(1);
  expect(failures).toEqual([]);
});

test("provides a scoped keyboard-accessible desktop context menu", async ({ page }) => {
  const failures = await openDesktop(page);
  const desktop = page.getByLabel("SHADOW OS desktop work area");

  const desktopPrevented = await desktop.evaluate((surface) => {
    const event = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: 40,
      clientY: 40,
    });
    surface.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(desktopPrevented).toBe(true);
  const menu = page.getByRole("menu", { name: "Desktop actions" });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "Refresh Desktop" })).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();

  await desktop.focus();
  await page.keyboard.press("Shift+F10");
  await expect(menu).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await expect(menu.getByRole("menuitem", { name: "Applications" })).toBeFocused();
  await page.keyboard.press("Enter");
  const drawer = page.getByRole("dialog", { name: "Applications" });
  await expect(drawer).toBeVisible();

  await drawer.getByRole("button", { name: /System Diagnostics/ }).click();
  await expect(page.getByRole("dialog", { name: "System Diagnostics" })).toBeVisible();
  const applicationPrevented = await page.locator(".diagnostics-app").evaluate((surface) => {
    const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
    surface.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(applicationPrevented).toBe(false);
  expect(failures).toEqual([]);
});

test("refreshes desktop presentation without navigation or application loss", async ({ page }) => {
  const failures = await openDesktop(page);
  await launchDiagnostics(page);
  const primary = page.getByRole("dialog", { name: "System Diagnostics" });
  await primary.getByRole("button", { name: "Open lifecycle detail" }).click();
  const detail = page.getByRole("dialog", { name: "Lifecycle Detail 01" });
  await detail.getByRole("button", { name: "Maximize window" }).click();
  const primaryBounds = await primary.boundingBox();
  const detailBounds = await detail.boundingBox();
  await page.evaluate(() => {
    document.documentElement.dataset.refreshSentinel = "present";
  });

  const desktop = page.getByLabel("SHADOW OS desktop work area");
  await desktop.focus();
  await page.keyboard.press("Shift+F10");
  await page.getByRole("menuitem", { name: "Refresh Desktop" }).click();

  await expect(page.getByText("Desktop refreshed 1")).toHaveText("Desktop refreshed 1");
  await expect(page.getByText("ENVIRONMENT / CYCLE 01")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(2);
  await expect(detail).toHaveAttribute("data-mode", "maximized");
  await expect(detail).toHaveAttribute("data-active", "true");
  expect(await primary.boundingBox()).toEqual(primaryBounds);
  expect(await detail.boundingBox()).toEqual(detailBounds);
  expect(await page.evaluate(() => document.documentElement.dataset.refreshSentinel)).toBe(
    "present",
  );

  await desktop.focus();
  await page.keyboard.press("Shift+F10");
  await expect(page.getByRole("menu", { name: "Desktop actions" })).toBeVisible();
  await page.locator(".system-header").click();
  await expect(page.getByRole("menu", { name: "Desktop actions" })).toBeHidden();
  expect(failures).toEqual([]);
});
