import { describe, expect, it, vi } from "vitest";

import { ClockModel } from "../../src/applications/built-in/clock-model";
import { FakeClock } from "../helpers/fake-clock";

describe("ClockModel", () => {
  it("formats the injected time deterministically", () => {
    const timestamp = new Date(2042, 6, 9, 4, 5, 6).getTime();
    const model = new ClockModel(new FakeClock(timestamp));

    expect(model.snapshot).toEqual({
      iso: new Date(timestamp).toISOString(),
      time: "04:05:06",
      date: "2042.07.09",
    });
  });

  it("aligns updates to second boundaries and keeps one scheduled tick", () => {
    const timestamp = new Date(2042, 6, 9, 4, 5, 6, 250).getTime();
    const clock = new FakeClock(timestamp);
    const model = new ClockModel(clock);
    const listener = vi.fn();

    const unsubscribe = model.subscribe(listener);
    expect(clock.pendingTaskCount).toBe(1);

    clock.advanceBy(749);
    expect(listener).not.toHaveBeenCalled();
    clock.advanceBy(1);
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ time: "04:05:07", date: "2042.07.09" }),
    );
    expect(clock.pendingTaskCount).toBe(1);

    clock.advanceBy(2_000);
    expect(listener).toHaveBeenCalledTimes(3);
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ time: "04:05:09", date: "2042.07.09" }),
    );
    expect(clock.pendingTaskCount).toBe(1);
    unsubscribe();
    expect(clock.pendingTaskCount).toBe(0);
  });

  it("updates the local date when the injected time crosses midnight", () => {
    const timestamp = new Date(2042, 11, 31, 23, 59, 59).getTime();
    const clock = new FakeClock(timestamp);
    const model = new ClockModel(clock);
    const listener = vi.fn();
    const unsubscribe = model.subscribe(listener);

    clock.advanceBy(1_000);

    expect(model.snapshot).toMatchObject({ time: "00:00:00", date: "2043.01.01" });
    expect(listener).toHaveBeenLastCalledWith(model.snapshot);
    unsubscribe();
  });

  it("shares one scheduled tick across subscribers and cancels it after the last unsubscribe", () => {
    const clock = new FakeClock();
    const model = new ClockModel(clock);

    const unsubscribeFirst = model.subscribe(() => undefined);
    const unsubscribeSecond = model.subscribe(() => undefined);
    expect(clock.pendingTaskCount).toBe(1);

    unsubscribeFirst();
    expect(clock.pendingTaskCount).toBe(1);
    unsubscribeSecond();
    expect(clock.pendingTaskCount).toBe(0);
  });

  it("does not accumulate timers across dispose and reopen cycles", () => {
    const clock = new FakeClock();
    const firstListener = vi.fn();
    const firstModel = new ClockModel(clock);
    firstModel.subscribe(firstListener);
    expect(clock.pendingTaskCount).toBe(1);

    firstModel.dispose();
    expect(clock.pendingTaskCount).toBe(0);
    clock.advanceBy(2_000);
    expect(firstListener).not.toHaveBeenCalled();

    const secondListener = vi.fn();
    const secondModel = new ClockModel(clock);
    secondModel.subscribe(secondListener);
    expect(clock.pendingTaskCount).toBe(1);
    clock.advanceBy(1_000);
    expect(secondListener).toHaveBeenCalledTimes(1);
    expect(clock.pendingTaskCount).toBe(1);

    secondModel.dispose();
    expect(clock.pendingTaskCount).toBe(0);
  });

  it("rejects subscriptions after disposal without scheduling work", () => {
    const clock = new FakeClock();
    const model = new ClockModel(clock);

    model.dispose();

    expect(() => model.subscribe(() => undefined)).toThrow(
      "Cannot subscribe to a disposed Clock model.",
    );
    expect(clock.pendingTaskCount).toBe(0);
  });
});
