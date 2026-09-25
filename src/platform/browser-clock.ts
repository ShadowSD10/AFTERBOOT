import type { Disposable } from "../core/disposable";
import type { Clock } from "../core/time/clock";

export class BrowserClock implements Clock {
  now(): number {
    return Date.now();
  }

  schedule(task: () => void, delayMs: number): Disposable {
    const timeoutId = globalThis.setTimeout(task, delayMs);

    return () => globalThis.clearTimeout(timeoutId);
  }
}
