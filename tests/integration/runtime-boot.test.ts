import { describe, expect, it } from "vitest";

import { ShadowRuntime } from "../../src/core/runtime/shadow-runtime";
import { FakeClock } from "../helpers/fake-clock";

describe("SHADOW OS boot workflow", () => {
  it("boots, resets, and completes another boot cycle deterministically", () => {
    const clock = new FakeClock(Date.UTC(2042, 6, 9, 4, 5, 6));
    const runtime = new ShadowRuntime(clock, { bootDurationMs: 1_000 });
    const phases: string[] = [];
    const unsubscribe = runtime.onStateChanged((event) => phases.push(event.current));

    runtime.boot();
    clock.advanceBy(1_000);
    runtime.reset();
    clock.advanceBy(1_000);
    unsubscribe();

    expect(runtime.snapshot).toEqual({
      phase: "ready",
      bootCycle: 2,
      failureMessage: null,
    });
    expect(phases).toEqual(["booting", "ready", "resetting", "startup", "booting", "ready"]);
  });
});
