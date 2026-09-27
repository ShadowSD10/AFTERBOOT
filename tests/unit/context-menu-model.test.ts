import { describe, expect, it } from "vitest";

import { clampOverlayPosition } from "../../src/shell/desktop/context-menu-model";

describe("clampOverlayPosition", () => {
  it("preserves an anchor that already fits inside the viewport", () => {
    expect(
      clampOverlayPosition(
        { x: 120, y: 80 },
        { width: 200, height: 120 },
        { width: 800, height: 600 },
      ),
    ).toEqual({ x: 120, y: 80 });
  });

  it("keeps the overlay inside every viewport edge", () => {
    expect(
      clampOverlayPosition(
        { x: 790, y: 590 },
        { width: 220, height: 160 },
        { width: 800, height: 600 },
      ),
    ).toEqual({ x: 572, y: 432 });
    expect(
      clampOverlayPosition(
        { x: -40, y: -20 },
        { width: 220, height: 160 },
        { width: 800, height: 600 },
      ),
    ).toEqual({ x: 8, y: 8 });
  });

  it("uses the margin when the overlay is larger than the viewport", () => {
    expect(
      clampOverlayPosition(
        { x: 100, y: 100 },
        { width: 500, height: 400 },
        { width: 320, height: 240 },
      ),
    ).toEqual({ x: 8, y: 8 });
  });
});
