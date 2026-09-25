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

async function launchDiagnostics(page: Page): Promise<void> {
  await page.getByRole("button", { name: "System Diagnostics" }).click();
  await expect(page.getByRole("dialog", { name: "System Diagnostics" })).toBeVisible();
}

test("launches one application instance and coordinates multiple owned windows", async ({
  page,
}) => {
  const failures = await openDesktop(page);
  const launcher = page.getByRole("button", { name: "System Diagnostics", exact: true });

  await launcher.click();
  const primary = page.getByRole("dialog", { name: "System Diagnostics" });
  await expect(primary).toBeVisible();
  await expect(primary).toContainText("application-instance-1");

  await launcher.click();
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await expect(primary).toHaveAttribute("data-active", "true");

  await primary.getByRole("button", { name: "Open lifecycle detail" }).click();
  const detail = page.getByRole("dialog", { name: "Lifecycle Detail 01" });
  await expect(detail).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(2);
  await expect(detail).toHaveAttribute("data-active", "true");

  await page.getByRole("button", { name: "Focus System Diagnostics" }).click();
  await expect(primary).toHaveAttribute("data-active", "true");
  await expect(detail).toHaveAttribute("data-active", "false");
  expect(failures).toEqual([]);
});

test("moves and resizes a floating window with pointer input", async ({ page }) => {
  const failures = await openDesktop(page);
  await launchDiagnostics(page);
  const dialog = page.getByRole("dialog", { name: "System Diagnostics" });
  const initial = await dialog.boundingBox();
  expect(initial).not.toBeNull();

  const titleBar = dialog.locator(".os-window__titlebar");
  const titleBounds = await titleBar.boundingBox();
  expect(titleBounds).not.toBeNull();
  await page.mouse.move(titleBounds!.x + 80, titleBounds!.y + 20);
  await page.mouse.down();
  await page.mouse.move(titleBounds!.x + 150, titleBounds!.y + 70, { steps: 4 });
  await page.mouse.up();
  const moved = await dialog.boundingBox();
  expect(moved!.x).toBeGreaterThan(initial!.x + 50);
  expect(moved!.y).toBeGreaterThan(initial!.y + 30);

  const resizeHandle = dialog.locator(".os-window__resize-handle");
  const handleBounds = await resizeHandle.boundingBox();
  expect(handleBounds).not.toBeNull();
  await page.mouse.move(handleBounds!.x + 8, handleBounds!.y + 8);
  await page.mouse.down();
  await page.mouse.move(handleBounds!.x + 88, handleBounds!.y + 58, { steps: 4 });
  await page.mouse.up();
  const resized = await dialog.boundingBox();
  expect(resized!.width).toBeGreaterThan(moved!.width + 60);
  expect(resized!.height).toBeGreaterThan(moved!.height + 35);
  expect(failures).toEqual([]);
});

test("minimizes, restores, maximizes, restores, and closes a window", async ({ page }) => {
  const failures = await openDesktop(page);
  await launchDiagnostics(page);
  const dialog = page.getByRole("dialog", { name: "System Diagnostics" });

  await dialog.getByRole("button", { name: "Minimize window" }).click();
  await expect(dialog).toBeHidden();
  const restoreTask = page.getByRole("button", { name: "Restore System Diagnostics" });
  await expect(restoreTask).toBeFocused();
  await restoreTask.press("Enter");
  await expect(dialog).toBeVisible();

  await dialog.getByRole("button", { name: "Maximize window" }).click();
  await expect(dialog).toHaveAttribute("data-mode", "maximized");
  await dialog.getByRole("button", { name: "Restore window" }).click();
  await expect(dialog).toHaveAttribute("data-mode", "normal");

  await dialog.getByRole("button", { name: "Close window" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("button", { name: "System Diagnostics" })).toBeFocused();
  expect(failures).toEqual([]);
});

test("supports keyboard launch and window controls without global shortcuts", async ({ page }) => {
  const failures = await openDesktop(page);
  const launcher = page.getByRole("button", { name: "System Diagnostics" });
  await launcher.focus();
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog", { name: "System Diagnostics" });
  await expect(dialog).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "Minimize window" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Restore System Diagnostics" })).toBeFocused();
  expect(failures).toEqual([]);
});

test("fills the mobile work area with only the active window", async ({ page }) => {
  const failures = monitorPageFailures(page);
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/");
  await page.getByRole("button", { name: "Skip boot sequence" }).click();
  await launchDiagnostics(page);
  const primary = page.getByRole("dialog", { name: "System Diagnostics" });
  await primary.getByRole("button", { name: "Open lifecycle detail" }).click();
  const detail = page.getByRole("dialog", { name: "Lifecycle Detail 01" });
  const workArea = await page.getByLabel("Open application windows").boundingBox();
  const detailBounds = await detail.boundingBox();

  expect(detailBounds).toEqual(workArea);
  await expect(primary).toBeHidden();
  await page.getByRole("button", { name: "Focus System Diagnostics" }).click();
  await expect(primary).toBeVisible();
  await expect(detail).toBeHidden();
  const pageSize = await page.locator("body").evaluate((body) => ({
    scrollWidth: body.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
  }));
  expect(pageSize.scrollWidth).toBeLessThanOrEqual(pageSize.viewportWidth);
  expect(failures).toEqual([]);
});

test("restart disposes open applications and returns to a clean desktop", async ({ page }) => {
  const failures = await openDesktop(page);
  await launchDiagnostics(page);
  await page
    .getByRole("dialog", { name: "System Diagnostics" })
    .getByRole("button", { name: "Open lifecycle detail" })
    .click();

  await page.getByRole("button", { name: "Restart SHADOW OS" }).click();
  await page.getByRole("button", { name: "Skip boot sequence" }).click();

  await expect(page.getByText("ENVIRONMENT / CYCLE 02")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await launchDiagnostics(page);
  await expect(page.getByText("application-instance-2")).toBeVisible();
  expect(failures).toEqual([]);
});
