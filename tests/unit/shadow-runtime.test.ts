import { describe, expect, it } from "vitest";

import {
  RuntimeTransitionError,
  ShadowRuntime,
  type RuntimeStateChanged,
} from "../../src/core/runtime/shadow-runtime";
import { FakeClock } from "../helpers/fake-clock";

describe("ShadowRuntime", () => {
  it("boots deterministically from startup to ready", () => {
    const clock = new FakeClock(1_000);
    const runtime = new ShadowRuntime(clock, { bootDurationMs: 500 });

    runtime.boot();

    expect(runtime.snapshot).toEqual({
      phase: "booting",
      bootCycle: 1,
      failureMessage: null,
    });
    clock.advanceBy(499);
    expect(runtime.snapshot.phase).toBe("booting");
    clock.advanceBy(1);
    expect(runtime.snapshot.phase).toBe("ready");
  });

  it("skips boot and cancels pending completion", () => {
    const clock = new FakeClock();
    const runtime = new ShadowRuntime(clock, { bootDurationMs: 500 });

    runtime.boot();
    expect(runtime.skipBoot()).toBe(true);
    expect(runtime.snapshot.phase).toBe("ready");
    expect(clock.pendingTaskCount).toBe(0);
    clock.advanceBy(500);
    expect(runtime.snapshot.phase).toBe("ready");
    expect(runtime.skipBoot()).toBe(false);
  });

  it("resets into a clean second boot cycle without reloading", () => {
    const clock = new FakeClock();
    const runtime = new ShadowRuntime(clock, { bootDurationMs: 100 });
    const events: RuntimeStateChanged[] = [];
    runtime.onStateChanged((event) => events.push(event));

    runtime.boot();
    runtime.skipBoot();
    runtime.reset();

    expect(runtime.snapshot).toEqual({
      phase: "booting",
      bootCycle: 2,
      failureMessage: null,
    });
    expect(events.map((event) => event.current)).toEqual([
      "booting",
      "ready",
      "resetting",
      "startup",
      "booting",
    ]);
  });

  it("enters failure state and recovers only through reset", () => {
    const clock = new FakeClock();
    const runtime = new ShadowRuntime(clock, { bootDurationMs: 100 });

    runtime.boot();
    runtime.fail(new Error("Boot integrity check failed."));

    expect(runtime.snapshot).toEqual({
      phase: "failed",
      bootCycle: 1,
      failureMessage: "Boot integrity check failed.",
    });
    expect(() => runtime.boot()).toThrow(RuntimeTransitionError);

    runtime.reset();
    expect(runtime.snapshot.phase).toBe("booting");
    expect(runtime.snapshot.bootCycle).toBe(2);
  });

  it("rejects invalid lifecycle transitions", () => {
    const runtime = new ShadowRuntime(new FakeClock(), { bootDurationMs: 100 });

    runtime.boot();

    expect(() => runtime.boot()).toThrow(
      "Invalid SHADOW OS runtime transition: booting -> booting",
    );
  });
});
