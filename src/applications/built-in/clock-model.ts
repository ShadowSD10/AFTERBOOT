import type { Disposable } from "../../core/disposable";
import type { Clock } from "../../core/time/clock";
import { formatSystemTime, type SystemTime } from "../../shell/system-time";

export type ClockListener = (snapshot: SystemTime) => void;

export class ClockModel {
  readonly #clock: Clock;
  readonly #listeners = new Set<ClockListener>();
  #snapshot: SystemTime;
  #cancelTick: Disposable | null = null;
  #disposed = false;

  constructor(clock: Clock) {
    this.#clock = clock;
    this.#snapshot = formatSystemTime(clock.now());
  }

  get snapshot(): SystemTime {
    return this.#snapshot;
  }

  subscribe(listener: ClockListener): Disposable {
    if (this.#disposed) {
      throw new Error("Cannot subscribe to a disposed Clock model.");
    }

    this.#listeners.add(listener);
    if (this.#listeners.size === 1) {
      this.#scheduleNextTick();
    }

    let subscribed = true;
    return () => {
      if (!subscribed) {
        return;
      }
      subscribed = false;
      this.#listeners.delete(listener);
      if (this.#listeners.size === 0) {
        this.#cancelScheduledTick();
      }
    };
  }

  dispose(): void {
    if (this.#disposed) {
      return;
    }

    this.#disposed = true;
    this.#cancelScheduledTick();
    this.#listeners.clear();
  }

  #scheduleNextTick(): void {
    const now = this.#clock.now();
    const elapsedInSecond = ((now % 1_000) + 1_000) % 1_000;
    const delayMs = elapsedInSecond === 0 ? 1_000 : 1_000 - elapsedInSecond;

    this.#cancelTick = this.#clock.schedule(() => {
      this.#cancelTick = null;
      this.#snapshot = formatSystemTime(this.#clock.now());
      for (const listener of [...this.#listeners]) {
        listener(this.#snapshot);
      }
      if (!this.#disposed && this.#listeners.size > 0) {
        this.#scheduleNextTick();
      }
    }, delayMs);
  }

  #cancelScheduledTick(): void {
    this.#cancelTick?.();
    this.#cancelTick = null;
  }
}
