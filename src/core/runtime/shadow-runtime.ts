import type { Disposable } from "../disposable";
import { TypedEvent, type EventListener } from "../events/typed-event";
import type { Clock } from "../time/clock";

export type RuntimePhase = "startup" | "booting" | "ready" | "resetting" | "failed";

export type RuntimeTransitionReason =
  | "boot-requested"
  | "boot-completed"
  | "boot-skipped"
  | "reset-requested"
  | "reset-completed"
  | "runtime-failed";

export interface RuntimeSnapshot {
  readonly phase: RuntimePhase;
  readonly bootCycle: number;
  readonly failureMessage: string | null;
}

export interface RuntimeStateChanged {
  readonly type: "runtime-state-changed";
  readonly previous: RuntimePhase;
  readonly current: RuntimePhase;
  readonly reason: RuntimeTransitionReason;
  readonly occurredAt: number;
  readonly snapshot: RuntimeSnapshot;
}

export interface ShadowRuntimeOptions {
  readonly bootDurationMs: number;
}

const ALLOWED_TRANSITIONS: Readonly<Record<RuntimePhase, readonly RuntimePhase[]>> = {
  startup: ["booting", "resetting", "failed"],
  booting: ["ready", "resetting", "failed"],
  ready: ["resetting", "failed"],
  resetting: ["startup", "failed"],
  failed: ["resetting"],
};

export class RuntimeTransitionError extends Error {
  constructor(previous: RuntimePhase, current: RuntimePhase) {
    super(`Invalid SHADOW OS runtime transition: ${previous} -> ${current}`);
    this.name = "RuntimeTransitionError";
  }
}

export class ShadowRuntime {
  readonly #clock: Clock;
  readonly #options: ShadowRuntimeOptions;
  readonly #stateChanged = new TypedEvent<RuntimeStateChanged>();
  #snapshot: RuntimeSnapshot = freezeSnapshot("startup", 0, null);
  #cancelBoot: Disposable | null = null;

  constructor(clock: Clock, options: ShadowRuntimeOptions) {
    if (!Number.isFinite(options.bootDurationMs) || options.bootDurationMs < 0) {
      throw new RangeError("Boot duration must be a finite, non-negative number.");
    }

    this.#clock = clock;
    this.#options = options;
  }

  get snapshot(): RuntimeSnapshot {
    return this.#snapshot;
  }

  onStateChanged(listener: EventListener<RuntimeStateChanged>): Disposable {
    return this.#stateChanged.subscribe(listener);
  }

  boot(): void {
    if (this.#snapshot.phase !== "startup") {
      throw new RuntimeTransitionError(this.#snapshot.phase, "booting");
    }

    const nextCycle = this.#snapshot.bootCycle + 1;
    this.#transition("booting", "boot-requested", nextCycle, null);
    this.#cancelBoot = this.#clock.schedule(() => {
      this.#cancelBoot = null;
      this.#transition("ready", "boot-completed", nextCycle, null);
    }, this.#options.bootDurationMs);
  }

  skipBoot(): boolean {
    if (this.#snapshot.phase !== "booting") {
      return false;
    }

    this.#cancelPendingBoot();
    this.#transition("ready", "boot-skipped", this.#snapshot.bootCycle, null);
    return true;
  }

  reset(): void {
    this.#cancelPendingBoot();
    this.#transition("resetting", "reset-requested", this.#snapshot.bootCycle, null);
    this.#transition("startup", "reset-completed", this.#snapshot.bootCycle, null);
    this.boot();
  }

  fail(error: unknown): void {
    if (this.#snapshot.phase === "failed") {
      return;
    }

    this.#cancelPendingBoot();
    this.#transition("failed", "runtime-failed", this.#snapshot.bootCycle, toFailureMessage(error));
  }

  dispose(): void {
    this.#cancelPendingBoot();
    this.#stateChanged.clear();
  }

  #cancelPendingBoot(): void {
    this.#cancelBoot?.();
    this.#cancelBoot = null;
  }

  #transition(
    phase: RuntimePhase,
    reason: RuntimeTransitionReason,
    bootCycle: number,
    failureMessage: string | null,
  ): void {
    const previous = this.#snapshot.phase;

    if (!ALLOWED_TRANSITIONS[previous].includes(phase)) {
      throw new RuntimeTransitionError(previous, phase);
    }

    this.#snapshot = freezeSnapshot(phase, bootCycle, failureMessage);
    this.#stateChanged.emit(
      Object.freeze({
        type: "runtime-state-changed",
        previous,
        current: phase,
        reason,
        occurredAt: this.#clock.now(),
        snapshot: this.#snapshot,
      }),
    );
  }
}

function freezeSnapshot(
  phase: RuntimePhase,
  bootCycle: number,
  failureMessage: string | null,
): RuntimeSnapshot {
  return Object.freeze({ phase, bootCycle, failureMessage });
}

function toFailureMessage(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return "An unknown runtime failure occurred.";
}
