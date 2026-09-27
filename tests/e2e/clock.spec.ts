import { expect, test, type Page } from "@playwright/test";

async function installTimerCounter(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const originalSetTimeout = window.setTimeout.bind(window);
    const originalClearTimeout = window.clearTimeout.bind(window);
    const activeTimers = new Set<number>();

    window.setTimeout = ((
      handler: TimerHandler,
      timeout?: number,
      ...arguments_: unknown[]
    ): number => {
      if (typeof handler !== "function") {
        const timeoutId = originalSetTimeout(handler, timeout, ...arguments_);
        activeTimers.add(timeoutId);
        return timeoutId;
      }

      const callback = handler as (...callbackArguments: unknown[]) => void;
      let timeoutId = 0;
      const trackedHandler = (...callbackArguments: unknown[]): void => {
        activeTimers.delete(timeoutId);
        callback(...callbackArguments);
      };
      timeoutId = originalSetTimeout(trackedHandler, timeout, ...arguments_);
      activeTimers.add(timeoutId);
      return timeoutId;
    }) as typeof window.setTimeout;

    window.clearTimeout = ((timeoutId?: number): void => {
      if (timeoutId !== undefined) {
        activeTimers.delete(timeoutId);
      }
      originalClearTimeout(timeoutId);
    }) as typeof window.clearTimeout;

    Object.defineProperty(window, "__afterbootActiveTimerCount", {
      get: () => activeTimers.size,
    });
  });
}

async function activeTimerCount(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      (window as unknown as Window & { readonly __afterbootActiveTimerCount: number })
        .__afterbootActiveTimerCount,
  );
}

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

async function launchClock(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Applications" }).click();
  const drawer = page.getByRole("dialog", { name: "Applications" });
  const clockEntry = drawer.getByRole("button", { name: "Clock" });
  await expect(clockEntry).toBeVisible();
  await clockEntry.click();
  await expect(page.getByRole("dialog", { name: "Clock" })).toBeVisible();
}

test("displays and updates the injected local time through one Clock instance", async ({
  page,
}) => {
  await installTimerCounter(page);
  const failures = await openDesktop(page);
  const baselineTimers = await activeTimerCount(page);
  await launchClock(page);

  const clockWindow = page.getByRole("dialog", { name: "Clock" });
  const time = clockWindow.locator(".clock-app__time");
  const date = clockWindow.locator(".clock-app__date");
  const task = page.getByRole("button", { name: "Focus Clock" });
  const initialIso = await time.getAttribute("datetime");
  expect(initialIso).not.toBeNull();

  const expected = await page.evaluate((timestamp) => {
    const value = new Date(timestamp!);
    const pad = (part: number): string => part.toString().padStart(2, "0");
    return {
      time: `${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`,
      date: `${value.getFullYear()}.${pad(value.getMonth() + 1)}.${pad(value.getDate())}`,
    };
  }, initialIso);

  await expect(time).toHaveText(expected.time);
  await expect(date).toHaveText(expected.date);
  await expect(time).toHaveAttribute("aria-label", `Current time: ${expected.time}`);
  await expect(date).toHaveAttribute("aria-label", `Current date: ${expected.date}`);
  await expect(task).toHaveCount(1);
  expect(await activeTimerCount(page)).toBe(baselineTimers + 1);

  await expect.poll(() => time.getAttribute("datetime"), { timeout: 2_500 }).not.toBe(initialIso);

  await launchClock(page);
  await expect(page.getByRole("dialog", { name: "Clock" })).toHaveCount(1);
  await expect(task).toHaveCount(1);
  expect(await activeTimerCount(page)).toBe(baselineTimers + 1);

  await clockWindow.getByRole("button", { name: "Minimize window" }).click();
  await expect(clockWindow).toBeHidden();
  expect(await activeTimerCount(page)).toBe(baselineTimers + 1);
  await page.getByRole("button", { name: "Restore Clock" }).click();
  await expect(clockWindow).toBeVisible();

  await clockWindow.getByRole("button", { name: "Close window" }).click();
  await expect(clockWindow).toHaveCount(0);
  await expect(task).toHaveCount(0);
  expect(await activeTimerCount(page)).toBe(baselineTimers);

  await launchClock(page);
  await expect(page.getByRole("dialog", { name: "Clock" })).toHaveCount(1);
  await expect(page.getByRole("dialog", { name: "Clock" }).locator(".clock-app__time")).toHaveText(
    /^\d{2}:\d{2}:\d{2}$/,
  );
  expect(await activeTimerCount(page)).toBe(baselineTimers + 1);
  expect(failures).toEqual([]);
});

test("keeps Clock contained and restart-safe at the mobile viewport", async ({ page }) => {
  const failures = monitorPageFailures(page);
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/");
  await page.getByRole("button", { name: "Skip boot sequence" }).click();
  await launchClock(page);

  const clockWindow = page.getByRole("dialog", { name: "Clock" });
  const time = clockWindow.locator(".clock-app__time");
  const date = clockWindow.locator(".clock-app__date");
  await expect(time).toHaveText(/^\d{2}:\d{2}:\d{2}$/);
  await expect(date).toHaveText(/^\d{4}\.\d{2}\.\d{2}$/);

  const mobileBounds = await clockWindow.evaluate((windowElement) => {
    const windowBounds = windowElement.getBoundingClientRect();
    const workAreaBounds = windowElement.parentElement!.getBoundingClientRect();
    const timeBounds = windowElement.querySelector(".clock-app__time")!.getBoundingClientRect();
    const bounds = (rect: DOMRect): Record<"x" | "y" | "width" | "height", number> => ({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    });
    return {
      window: bounds(windowBounds),
      workArea: bounds(workAreaBounds),
      time: bounds(timeBounds),
    };
  });
  expect(mobileBounds.window).toEqual(mobileBounds.workArea);
  expect(mobileBounds.time.x).toBeGreaterThanOrEqual(mobileBounds.window.x);
  expect(mobileBounds.time.x + mobileBounds.time.width).toBeLessThanOrEqual(
    mobileBounds.window.x + mobileBounds.window.width,
  );

  await page.getByRole("button", { name: "Restart SHADOW OS" }).click();
  await page.getByRole("button", { name: "Skip boot sequence" }).click();
  await expect(page.getByRole("dialog", { name: "Clock" })).toHaveCount(0);
  await launchClock(page);
  await expect(page.getByRole("dialog", { name: "Clock" }).locator(".clock-app__time")).toHaveText(
    /^\d{2}:\d{2}:\d{2}$/,
  );

  const pageSize = await page.locator("body").evaluate((body) => ({
    scrollWidth: body.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
  }));
  expect(pageSize.scrollWidth).toBeLessThanOrEqual(pageSize.viewportWidth);
  expect(failures).toEqual([]);
});
