import { describe, expect, it } from "vitest";

import {
  BOOT_STAGES,
  ShadowRuntime,
  type BootStageDurations,
} from "../../src/core/runtime/shadow-runtime";
import { FakeClock } from "../helpers/fake-clock";

const STAGE_DURATIONS: BootStageDurations = Object.fromEntries(
  BOOT_STAGES.map((stage) => [stage, 10]),
) as unknown as BootStageDurations;

describe("SHADOW OS boot workflow", () => {
  it("boots, resets, and completes another boot cycle deterministically", () => {
    const clock = new FakeClock(Date.UTC(2042, 6, 9, 4, 5, 6));
    const runtime = new ShadowRuntime(clock, { bootStageDurations: STAGE_DURATIONS });
    const observedStages: string[] = [];
    const unsubscribe = runtime.onStateChanged((event) => {
      if (event.snapshot.bootStage) {
        observedStages.push(`${event.snapshot.bootCycle}:${event.snapshot.bootStage}`);
      }
    });

    runtime.boot();
    clock.advanceBy(BOOT_STAGES.length * 10);
    runtime.reset();
    clock.advanceBy(BOOT_STAGES.length * 10);
    unsubscribe();

    expect(runtime.snapshot).toEqual({
      phase: "ready",
      bootCycle: 2,
      bootStage: null,
      failureMessage: null,
    });
    expect(observedStages).toEqual([
      ...BOOT_STAGES.map((stage) => `1:${stage}`),
      ...BOOT_STAGES.map((stage) => `2:${stage}`),
    ]);
  });
});
