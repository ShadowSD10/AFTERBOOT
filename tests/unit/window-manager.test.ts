import { describe, expect, it } from "vitest";

import { toApplicationInstanceId, toWindowId } from "../../src/core/identity/identifiers";
import { WINDOW_CASCADE_OFFSET, WindowManager } from "../../src/shell/windows/window-manager";
import { FakeIdGenerator } from "../helpers/fake-id-generator";

const WORK_AREA = { x: 0, y: 0, width: 1200, height: 800 } as const;
const OWNER_ID = toApplicationInstanceId("application-instance-1");

function createManager(): WindowManager {
  return new WindowManager(new FakeIdGenerator(), WORK_AREA);
}

describe("WindowManager", () => {
  it("centers the first window and cascades subsequent windows deterministically", () => {
    const manager = createManager();

    const firstId = manager.open({ ownerId: OWNER_ID, title: "Primary" });
    const secondId = manager.open({ ownerId: OWNER_ID, title: "Secondary" });

    expect(firstId).toBe("window-1");
    expect(manager.snapshot.windows[0]?.bounds).toEqual({
      x: 280,
      y: 190,
      width: 640,
      height: 420,
    });
    expect(manager.snapshot.windows[1]?.bounds).toEqual({
      x: 280 + WINDOW_CASCADE_OFFSET,
      y: 190 + WINDOW_CASCADE_OFFSET,
      width: 640,
      height: 420,
    });
    expect(manager.snapshot.activeWindowId).toBe(secondId);
  });

  it("focuses visible windows with deterministic z-order", () => {
    const manager = createManager();
    const firstId = manager.open({ ownerId: OWNER_ID, title: "Primary" });
    const secondId = manager.open({ ownerId: OWNER_ID, title: "Secondary" });

    expect(manager.focus(firstId)).toBe(true);
    expect(manager.snapshot.activeWindowId).toBe(firstId);
    expect(
      manager.snapshot.windows.find((windowState) => windowState.id === firstId)?.focusOrder,
    ).toBeGreaterThan(
      manager.snapshot.windows.find((windowState) => windowState.id === secondId)?.focusOrder ?? 0,
    );
  });

  it("moves and resizes normal windows within work-area constraints", () => {
    const manager = createManager();
    const windowId = manager.open({ ownerId: OWNER_ID, title: "Primary" });

    expect(manager.move(windowId, { x: 900, y: -100 })).toBe(true);
    expect(manager.snapshot.windows[0]?.bounds).toEqual({ x: 560, y: 0, width: 640, height: 420 });

    expect(manager.resize(windowId, { x: 1_000, y: 700, width: 100, height: 100 })).toBe(true);
    expect(manager.snapshot.windows[0]?.bounds).toEqual({
      x: 880,
      y: 580,
      width: 320,
      height: 220,
    });
  });

  it("minimizes the active window and focuses the next visible window", () => {
    const manager = createManager();
    const firstId = manager.open({ ownerId: OWNER_ID, title: "Primary" });
    const secondId = manager.open({ ownerId: OWNER_ID, title: "Secondary" });

    expect(manager.minimize(secondId)).toBe(true);
    expect(manager.snapshot.activeWindowId).toBe(firstId);
    expect(manager.snapshot.windows[1]?.mode).toBe("minimized");
    expect(manager.focus(secondId)).toBe(false);
  });

  it("maximizes and restores the previous normal geometry", () => {
    const manager = createManager();
    const windowId = manager.open({ ownerId: OWNER_ID, title: "Primary" });
    manager.move(windowId, { x: 80, y: 90 });
    const normalBounds = manager.snapshot.windows[0]?.bounds;

    expect(manager.maximize(windowId)).toBe(true);
    expect(manager.snapshot.windows[0]).toMatchObject({ mode: "maximized", bounds: WORK_AREA });
    expect(manager.move(windowId, { x: 10, y: 10 })).toBe(false);

    expect(manager.restore(windowId)).toBe(true);
    expect(manager.snapshot.windows[0]).toMatchObject({ mode: "normal", bounds: normalBounds });
  });

  it("restores a window minimized from maximized back to maximized", () => {
    const manager = createManager();
    const windowId = manager.open({ ownerId: OWNER_ID, title: "Primary" });
    manager.maximize(windowId);
    manager.minimize(windowId);

    expect(manager.restore(windowId)).toBe(true);
    expect(manager.snapshot.windows[0]).toMatchObject({ mode: "maximized", bounds: WORK_AREA });
  });

  it("removes closed windows and selects the top remaining window", () => {
    const manager = createManager();
    const firstId = manager.open({ ownerId: OWNER_ID, title: "Primary" });
    const secondId = manager.open({ ownerId: OWNER_ID, title: "Secondary" });

    expect(manager.close(secondId)).toBe(true);
    expect(manager.snapshot.windows.map((windowState) => windowState.id)).toEqual([firstId]);
    expect(manager.snapshot.activeWindowId).toBe(firstId);
    expect(manager.close(toWindowId("missing"))).toBe(false);
  });

  it("reconstrains windows when the work area changes", () => {
    const manager = createManager();
    const normalId = manager.open({ ownerId: OWNER_ID, title: "Normal" });
    const maximizedId = manager.open({ ownerId: OWNER_ID, title: "Maximized" });
    manager.move(normalId, { x: 500, y: 300 });
    manager.maximize(maximizedId);

    manager.setWorkArea({ x: 0, y: 0, width: 500, height: 400 });

    expect(manager.snapshot.windows[0]?.bounds).toEqual({ x: 0, y: 0, width: 500, height: 400 });
    expect(manager.snapshot.windows[1]?.bounds).toEqual({ x: 0, y: 0, width: 500, height: 400 });
  });

  it("emits immutable facts and resets without stale windows", () => {
    const manager = createManager();
    const reasons: string[] = [];
    manager.onStateChanged((event) => reasons.push(event.reason));
    const windowId = manager.open({ ownerId: OWNER_ID, title: "Primary" });
    manager.minimize(windowId);
    manager.restore(windowId);
    manager.close(windowId);
    manager.open({ ownerId: OWNER_ID, title: "Fresh" });
    manager.reset();

    expect(reasons).toEqual([
      "window-opened",
      "window-minimized",
      "window-restored",
      "window-closed",
      "window-opened",
      "windows-reset",
    ]);
    expect(manager.snapshot.windows).toEqual([]);
    expect(Object.isFrozen(manager.snapshot)).toBe(true);
  });

  it("rejects invalid work areas, dimensions, and impossible constraints", () => {
    expect(
      () => new WindowManager(new FakeIdGenerator(), { x: 0, y: 0, width: 0, height: 1 }),
    ).toThrow("Work area dimensions must be positive.");
    const manager = createManager();
    expect(() =>
      manager.open({
        ownerId: OWNER_ID,
        title: "Invalid",
        constraints: { minWidth: 500, maxWidth: 400 },
      }),
    ).toThrow("Maximum window width must not be smaller than its minimum.");
    const windowId = manager.open({ ownerId: OWNER_ID, title: "Primary" });
    expect(() => manager.move(windowId, { x: Number.NaN, y: 0 })).toThrow(
      "Window bounds must contain only finite values.",
    );
  });
});
