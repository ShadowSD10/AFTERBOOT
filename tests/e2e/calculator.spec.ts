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

async function launchCalculator(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Applications" }).click();
  const drawer = page.getByRole("dialog", { name: "Applications" });
  const calculatorEntry = drawer.getByRole("button", { name: "Calculator" });
  const marker = calculatorEntry.locator(".application-drawer__marker");
  const icon = marker.locator("svg.application-drawer__calculator-icon");
  await expect(calculatorEntry).toBeVisible();
  await expect(marker).toHaveAttribute("aria-hidden", "true");
  await expect(marker).toBeEmpty();
  await expect(icon).toBeVisible();
  await expect(icon).toHaveAttribute("viewBox", "0 0 32 32");
  await expect(icon).toHaveAttribute("aria-hidden", "true");
  await calculatorEntry.click();
  await expect(page.getByRole("dialog", { name: "Calculator" })).toBeVisible();
}

async function pressKeys(page: Page, names: readonly string[]): Promise<void> {
  const calculator = page.getByRole("dialog", { name: "Calculator" });
  for (const name of names) {
    await calculator.getByRole("button", { name, exact: true }).click();
  }
}

test("performs basic pointer calculations through one Calculator instance", async ({ page }) => {
  const failures = await openDesktop(page);
  await launchCalculator(page);

  const calculator = page.getByRole("dialog", { name: "Calculator" });
  const surface = calculator.locator(".calculator-app");
  const display = calculator.getByLabel("Calculator display");
  const task = page.getByRole("button", { name: "Focus Calculator" });
  await expect(surface).toBeFocused();
  await expect(display).toHaveText("0");
  await expect(task).toHaveCount(1);

  await pressKeys(page, ["1", "2", "Add", "5", "Equals"]);
  await expect(display).toHaveText("17");

  await pressKeys(page, ["Clear", "5", "Subtract", "8", "Equals"]);
  await expect(display).toHaveText("-3");

  await pressKeys(page, ["Clear", "6", "Multiply", "7", "Equals"]);
  await expect(display).toHaveText("42");

  await pressKeys(page, ["Clear", "8", "Divide", "2", "Equals"]);
  await expect(display).toHaveText("4");

  await pressKeys(page, [
    "Clear",
    "1",
    "Decimal point",
    "5",
    "Add",
    "2",
    "Decimal point",
    "2",
    "5",
    "Equals",
  ]);
  await expect(display).toHaveText("3.75");

  await pressKeys(page, ["Clear", "1", "2", "3", "Backspace"]);
  await expect(display).toHaveText("12");

  await pressKeys(page, ["Clear", "9", "Divide", "0", "Equals"]);
  await expect(display).toHaveText("ERROR");
  await expect(display).toHaveAttribute("data-state", "error");
  await calculator.getByRole("button", { name: "Clear" }).click();
  await expect(display).toHaveText("0");

  await calculator.getByRole("button", { name: "Minimize window" }).click();
  await expect(calculator).toBeHidden();
  await launchCalculator(page);
  await expect(calculator).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Calculator" })).toHaveCount(1);
  await expect(task).toHaveCount(1);

  await calculator.getByRole("button", { name: "Close window" }).click();
  await expect(calculator).toHaveCount(0);
  await launchCalculator(page);
  await expect(page.getByLabel("Calculator display")).toHaveText("0");
  expect(failures).toEqual([]);
});

test("supports calculator keyboard input, restart, and the mobile viewport", async ({ page }) => {
  const failures = monitorPageFailures(page);
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/");
  await page.getByRole("button", { name: "Skip boot sequence" }).click();
  await launchCalculator(page);

  const calculator = page.getByRole("dialog", { name: "Calculator" });
  const surface = calculator.locator(".calculator-app");
  const display = calculator.getByLabel("Calculator display");
  await expect(surface).toBeFocused();

  await page.keyboard.type("12+5");
  await page.keyboard.press("Enter");
  await expect(display).toHaveText("17");

  await page.keyboard.press("Escape");
  await expect(display).toHaveText("0");
  await expect(calculator).toBeVisible();

  await page.keyboard.type("9/0=");
  await expect(display).toHaveText("ERROR");
  await page.keyboard.press("c");
  await expect(display).toHaveText("0");

  const mobileBounds = await calculator.evaluate((windowElement) => {
    const windowBounds = windowElement.getBoundingClientRect();
    const workAreaBounds = windowElement.parentElement!.getBoundingClientRect();
    const bounds = (rect: DOMRect): Record<"x" | "y" | "width" | "height", number> => ({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    });
    return { window: bounds(windowBounds), workArea: bounds(workAreaBounds) };
  });
  expect(mobileBounds.window).toEqual(mobileBounds.workArea);

  await page.getByRole("button", { name: "Restart SHADOW OS" }).click();
  await page.getByRole("button", { name: "Skip boot sequence" }).click();
  await launchCalculator(page);
  await expect(page.getByLabel("Calculator display")).toHaveText("0");

  const pageSize = await page.locator("body").evaluate((body) => ({
    scrollWidth: body.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
  }));
  expect(pageSize.scrollWidth).toBeLessThanOrEqual(pageSize.viewportWidth);
  expect(failures).toEqual([]);
});
