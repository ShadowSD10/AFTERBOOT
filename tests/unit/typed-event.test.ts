import { describe, expect, it, vi } from "vitest";

import { TypedEvent } from "../../src/core/events/typed-event";

describe("TypedEvent", () => {
  it("delivers facts synchronously and supports disposal", () => {
    const event = new TypedEvent<{ readonly value: number }>();
    const listener = vi.fn();
    const unsubscribe = event.subscribe(listener);

    event.emit({ value: 1 });
    unsubscribe();
    event.emit({ value: 2 });

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith({ value: 1 });
  });

  it("uses a listener snapshot when subscriptions change during dispatch", () => {
    const event = new TypedEvent<{ readonly value: number }>();
    const calls: string[] = [];
    let unsubscribeSecond = (): void => undefined;

    event.subscribe(() => {
      calls.push("first");
      unsubscribeSecond();
    });
    unsubscribeSecond = event.subscribe(() => calls.push("second"));

    event.emit({ value: 1 });
    event.emit({ value: 2 });

    expect(calls).toEqual(["first", "second", "first"]);
  });
});
