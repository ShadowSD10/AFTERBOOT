import type { Disposable } from "../disposable";

export interface Clock {
  now(): number;
  schedule(task: () => void, delayMs: number): Disposable;
}
