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

async function launchNotepad(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Applications" }).click();
  const drawer = page.getByRole("dialog", { name: "Applications" });
  const notesEntry = drawer.getByRole("button", { name: "Notes" });
  const marker = notesEntry.locator(".application-drawer__marker");
  await expect(notesEntry).toBeVisible();
  await expect(marker).toHaveText("✎");
  await expect(marker).toHaveAttribute("aria-hidden", "true");
  await notesEntry.click();
  await expect(page.getByRole("dialog", { name: "Notes" })).toBeVisible();
}

test("edits temporary text through one running Notepad instance", async ({ page }) => {
  const failures = await openDesktop(page);
  await launchNotepad(page);

  const notepad = page.getByRole("dialog", { name: "Notes" });
  const editor = page.getByRole("textbox", { name: "Notes editor" });
  const task = page.getByRole("button", { name: "Focus Notes" });
  await expect(editor).toBeFocused();
  await expect(task).toHaveCount(1);

  await page.keyboard.insertText("First line\nSecond line");
  await expect(editor).toHaveValue("First line\nSecond line");
  await page.keyboard.press("Control+A");
  await page.keyboard.insertText("Revised text\nWith two lines");
  await expect(editor).toHaveValue("Revised text\nWith two lines");
  await page.keyboard.press("Escape");
  await expect(editor).toHaveValue("Revised text\nWith two lines");

  await launchNotepad(page);
  await expect(page.getByRole("dialog", { name: "Notes" })).toHaveCount(1);
  await expect(task).toHaveCount(1);
  await expect(editor).toHaveValue("Revised text\nWith two lines");

  const titleBar = notepad.locator(".os-window__titlebar");
  const initialBounds = await notepad.boundingBox();
  const titleBounds = await titleBar.boundingBox();
  expect(initialBounds).not.toBeNull();
  expect(titleBounds).not.toBeNull();
  await page.mouse.move(titleBounds!.x + 80, titleBounds!.y + 20);
  await page.mouse.down();
  await page.mouse.move(titleBounds!.x + 130, titleBounds!.y + 55, { steps: 3 });
  await page.mouse.up();
  expect((await notepad.boundingBox())!.x).toBeGreaterThan(initialBounds!.x + 30);

  const resizeHandle = notepad.locator(".os-window__resize-handle");
  const handleBounds = await resizeHandle.boundingBox();
  expect(handleBounds).not.toBeNull();
  await page.mouse.move(handleBounds!.x + 8, handleBounds!.y + 8);
  await page.mouse.down();
  await page.mouse.move(handleBounds!.x + 68, handleBounds!.y + 48, { steps: 3 });
  await page.mouse.up();
  await expect(editor).toHaveValue("Revised text\nWith two lines");

  const desktop = page.getByLabel("SHADOW OS desktop work area");
  await desktop.focus();
  await page.keyboard.press("Shift+F10");
  await page.getByRole("menuitem", { name: "Refresh Desktop" }).click();
  await expect(editor).toHaveValue("Revised text\nWith two lines");

  await notepad.getByRole("button", { name: "Minimize window" }).click();
  await expect(notepad).toBeHidden();
  await page.getByRole("button", { name: "Restore Notes" }).click();
  await expect(notepad).toBeVisible();
  await expect(editor).toHaveValue("Revised text\nWith two lines");

  await notepad.getByRole("button", { name: "Maximize window" }).click();
  await expect(notepad).toHaveAttribute("data-mode", "maximized");
  await notepad.getByRole("button", { name: "Restore window" }).click();
  await expect(notepad).toHaveAttribute("data-mode", "normal");
  await expect(editor).toHaveValue("Revised text\nWith two lines");

  const nativeContextMenu = await editor.evaluate((surface) => {
    const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
    surface.dispatchEvent(event);
    return !event.defaultPrevented;
  });
  expect(nativeContextMenu).toBe(true);

  await notepad.getByRole("button", { name: "Close window" }).click();
  await expect(notepad).toHaveCount(0);
  await expect(task).toHaveCount(0);

  await launchNotepad(page);
  await expect(page.getByRole("textbox", { name: "Notes editor" })).toBeFocused();
  await expect(page.getByRole("textbox", { name: "Notes editor" })).toHaveValue("");
  expect(failures).toEqual([]);
});

test("discards Notepad text on restart and remains usable on mobile", async ({ page }) => {
  const failures = monitorPageFailures(page);
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/");
  await page.getByRole("button", { name: "Skip boot sequence" }).click();
  await launchNotepad(page);

  const editor = page.getByRole("textbox", { name: "Notes editor" });
  await editor.fill("Temporary mobile text");
  await expect(editor).toHaveValue("Temporary mobile text");
  const mobileBounds = await page.getByRole("dialog", { name: "Notes" }).evaluate((notepad) => {
    const windowBounds = notepad.getBoundingClientRect();
    const workAreaBounds = notepad.parentElement!.getBoundingClientRect();
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
  await launchNotepad(page);
  await expect(page.getByRole("textbox", { name: "Notes editor" })).toHaveValue("");

  const pageSize = await page.locator("body").evaluate((body) => ({
    scrollWidth: body.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
  }));
  expect(pageSize.scrollWidth).toBeLessThanOrEqual(pageSize.viewportWidth);
  expect(failures).toEqual([]);
});
