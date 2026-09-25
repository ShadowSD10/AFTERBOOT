import type { Disposable } from "../../src/core/disposable";
import type { Clock } from "../../src/core/time/clock";

interface ScheduledTask {
  readonly id: number;
  readonly runAt: number;
  readonly task: () => void;
  cancelled: boolean;
}

export class FakeClock implements Clock {
  readonly #tasks: ScheduledTask[] = [];
  #currentTime: number;
  #nextTaskId = 1;

  constructor(initialTime = 0) {
    this.#currentTime = initialTime;
  }

  now(): number {
    return this.#currentTime;
  }

  schedule(task: () => void, delayMs: number): Disposable {
    if (!Number.isFinite(delayMs) || delayMs < 0) {
      throw new RangeError("Scheduled delay must be a finite, non-negative number.");
    }

    const scheduledTask: ScheduledTask = {
      id: this.#nextTaskId,
      runAt: this.#currentTime + delayMs,
      task,
      cancelled: false,
    };
    this.#nextTaskId += 1;
    this.#tasks.push(scheduledTask);

    return () => {
      scheduledTask.cancelled = true;
    };
  }

  advanceBy(durationMs: number): void {
    if (!Number.isFinite(durationMs) || durationMs < 0) {
      throw new RangeError("Advance duration must be a finite, non-negative number.");
    }

    const targetTime = this.#currentTime + durationMs;

    while (true) {
      const nextTask = this.#nextTaskAtOrBefore(targetTime);

      if (!nextTask) {
        break;
      }

      this.#currentTime = nextTask.runAt;
      nextTask.cancelled = true;
      nextTask.task();
    }

    this.#currentTime = targetTime;
  }

  get pendingTaskCount(): number {
    return this.#tasks.filter((task) => !task.cancelled).length;
  }

  #nextTaskAtOrBefore(targetTime: number): ScheduledTask | undefined {
    return this.#tasks
      .filter((task) => !task.cancelled && task.runAt <= targetTime)
      .sort((left, right) => left.runAt - right.runAt || left.id - right.id)[0];
  }
}
