import { describe, expect, it } from "vitest";

import {
  BOOT_STAGES,
  RuntimeTransitionError,
  ShadowRuntime,
  type BootStageDurations,
  type RuntimeStateChanged,
} from "../../src/core/runtime/shadow-runtime";
import { FakeClock } from "../helpers/fake-clock";

const TEST_STAGE_DURATIONS: BootStageDurations = {
  "power-on": 10,
  firmware: 20,
  "system-initialization": 30,
  "system-core": 40,
  "system-clock": 50,
  "display-system": 60,
  "desktop-environment": 70,
  finalizing: 80,
};

function createRuntime(clock = new FakeClock()): ShadowRuntime {
  return new ShadowRuntime(clock, { bootStageDurations: TEST_STAGE_DURATIONS });
}

describe("ShadowRuntime", () => {
  it("advances through every boot stage deterministically before becoming ready", () => {
    const clock = new FakeClock(1_000);
    const runtime = createRuntime(clock);
    const observedStages: Array<string | null> = [];
    runtime.onStateChanged((event) => observedStages.push(event.snapshot.bootStage));

    runtime.boot();

    expect(runtime.snapshot).toEqual({
      phase: "booting",
      bootCycle: 1,
      bootStage: "power-on",
      failureMessage: null,
    });
    for (const stage of BOOT_STAGES) {
      expect(runtime.snapshot.bootStage).toBe(stage);
      clock.advanceBy(TEST_STAGE_DURATIONS[stage]);
    }

    expect(runtime.snapshot.phase).toBe("ready");
    expect(runtime.snapshot.bootStage).toBeNull();
    expect(observedStages).toEqual([...BOOT_STAGES, null]);
  });

  it.each(["power-on", "system-core", "finalizing"] as const)(
    "skips safely during %s and cancels pending progression",
    (targetStage) => {
      const clock = new FakeClock();
      const runtime = createRuntime(clock);

      runtime.boot();
      while (runtime.snapshot.bootStage !== targetStage) {
        const currentStage = runtime.snapshot.bootStage;
        expect(currentStage).not.toBeNull();
        clock.advanceBy(TEST_STAGE_DURATIONS[currentStage!]);
      }

      expect(runtime.skipBoot()).toBe(true);
      expect(runtime.snapshot.phase).toBe("ready");
      expect(runtime.snapshot.bootStage).toBeNull();
      expect(clock.pendingTaskCount).toBe(0);
      clock.advanceBy(1_000);
      expect(runtime.snapshot.phase).toBe("ready");
      expect(runtime.skipBoot()).toBe(false);
    },
  );

  it("resets into a fresh boot sequence without stale callbacks", () => {
    const clock = new FakeClock();
    const runtime = createRuntime(clock);
    const events: RuntimeStateChanged[] = [];
    runtime.onStateChanged((event) => events.push(event));

    runtime.boot();
    clock.advanceBy(TEST_STAGE_DURATIONS["power-on"]);
    runtime.reset();

    expect(runtime.snapshot).toEqual({
      phase: "booting",
      bootCycle: 2,
      bootStage: "power-on",
      failureMessage: null,
    });
    expect(clock.pendingTaskCount).toBe(1);
    clock.advanceBy(TEST_STAGE_DURATIONS["power-on"]);
    expect(runtime.snapshot.bootStage).toBe("firmware");
    expect(clock.pendingTaskCount).toBe(1);
    expect(events.at(-1)?.snapshot.bootCycle).toBe(2);
  });

  it("enters failure state and recovers only through reset", () => {
    const clock = new FakeClock();
    const runtime = createRuntime(clock);

    runtime.boot();
    runtime.fail(new Error("Boot integrity check failed."));

    expect(runtime.snapshot).toEqual({
      phase: "failed",
      bootCycle: 1,
      bootStage: null,
      failureMessage: "Boot integrity check failed.",
    });
    expect(() => runtime.boot()).toThrow(RuntimeTransitionError);

    runtime.reset();
    expect(runtime.snapshot.phase).toBe("booting");
    expect(runtime.snapshot.bootCycle).toBe(2);
  });

  it("rejects invalid lifecycle transitions", () => {
    const runtime = createRuntime();

    runtime.boot();

    expect(() => runtime.boot()).toThrow(
      "Invalid SHADOW OS runtime transition: booting -> booting",
    );
  });

  it("rejects an invalid boot stage duration", () => {
    expect(
      () =>
        new ShadowRuntime(new FakeClock(), {
          bootStageDurations: { ...TEST_STAGE_DURATIONS, firmware: Number.NaN },
        }),
    ).toThrow("Boot stage duration for firmware must be finite and non-negative.");
  });
});
