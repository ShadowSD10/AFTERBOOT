import type { Disposable } from "../../core/disposable";
import { TypedEvent, type EventListener } from "../../core/events/typed-event";
import { toWindowId, type IdGenerator, type WindowId } from "../../core/identity/identifiers";
import type {
  OpenWindowRequest,
  RestorableWindowMode,
  WindowBounds,
  WindowConstraints,
  WindowManagerSnapshot,
  WindowState,
  WindowStateChanged,
  WindowTransitionReason,
} from "./window-state";

export const DEFAULT_WINDOW_WIDTH = 640;
export const DEFAULT_WINDOW_HEIGHT = 420;
export const DEFAULT_MIN_WINDOW_WIDTH = 320;
export const DEFAULT_MIN_WINDOW_HEIGHT = 220;
export const WINDOW_CASCADE_OFFSET = 32;

export class WindowManager {
  readonly #idGenerator: IdGenerator;
  readonly #stateChanged = new TypedEvent<WindowStateChanged>();
  #snapshot: WindowManagerSnapshot;
  #focusOrder = 0;

  constructor(idGenerator: IdGenerator, workArea: WindowBounds) {
    this.#idGenerator = idGenerator;
    this.#snapshot = freezeSnapshot([], null, validateWorkArea(workArea));
  }

  get snapshot(): WindowManagerSnapshot {
    return this.#snapshot;
  }

  onStateChanged(listener: EventListener<WindowStateChanged>): Disposable {
    return this.#stateChanged.subscribe(listener);
  }

  open(request: OpenWindowRequest): WindowId {
    const id = toWindowId(this.#idGenerator.next("window"));
    const constraints = normalizeConstraints(request.constraints);
    const bounds = this.#initialBounds(
      request.preferredWidth ?? DEFAULT_WINDOW_WIDTH,
      request.preferredHeight ?? DEFAULT_WINDOW_HEIGHT,
      constraints,
    );
    const windowState = freezeWindow({
      id,
      ownerId: request.ownerId,
      title: request.title,
      bounds,
      normalBounds: bounds,
      constraints,
      mode: "normal",
      restoreMode: "normal",
      focusOrder: this.#nextFocusOrder(),
    });

    this.#replace([...this.#snapshot.windows, windowState], id, "window-opened", id);
    return id;
  }

  focus(windowId: WindowId): boolean {
    const target = this.#find(windowId);

    if (!target || target.mode === "minimized") {
      return false;
    }

    if (this.#snapshot.activeWindowId === windowId) {
      return true;
    }

    return this.#update(
      windowId,
      (windowState) => ({ ...windowState, focusOrder: this.#nextFocusOrder() }),
      "window-focused",
      windowId,
    );
  }

  move(windowId: WindowId, position: Pick<WindowBounds, "x" | "y">): boolean {
    return this.#updateNormalBounds(
      windowId,
      (windowState) => ({ ...windowState.normalBounds, ...position }),
      "window-moved",
    );
  }

  resize(windowId: WindowId, bounds: Pick<WindowBounds, "x" | "y" | "width" | "height">): boolean {
    return this.#updateNormalBounds(windowId, () => bounds, "window-resized");
  }

  minimize(windowId: WindowId): boolean {
    const target = this.#find(windowId);

    if (!target || target.mode === "minimized") {
      return false;
    }

    const restoreMode: RestorableWindowMode = target.mode;
    const windows = this.#snapshot.windows.map((windowState) =>
      windowState.id === windowId
        ? freezeWindow({ ...windowState, mode: "minimized", restoreMode })
        : windowState,
    );
    const activeWindowId = this.#topVisibleWindowId(windows, windowId);
    this.#replace(windows, activeWindowId, "window-minimized", windowId);
    return true;
  }

  maximize(windowId: WindowId): boolean {
    const target = this.#find(windowId);

    if (!target || target.mode !== "normal") {
      return false;
    }

    return this.#update(
      windowId,
      (windowState) => ({
        ...windowState,
        mode: "maximized",
        restoreMode: "maximized",
        bounds: this.#snapshot.workArea,
        focusOrder: this.#nextFocusOrder(),
      }),
      "window-maximized",
      windowId,
    );
  }

  restore(windowId: WindowId): boolean {
    const target = this.#find(windowId);

    if (!target || target.mode === "normal") {
      return false;
    }

    const restoredMode: RestorableWindowMode =
      target.mode === "minimized" ? target.restoreMode : "normal";
    const bounds = restoredMode === "maximized" ? this.#snapshot.workArea : target.normalBounds;

    return this.#update(
      windowId,
      (windowState) => ({
        ...windowState,
        mode: restoredMode,
        restoreMode: restoredMode,
        bounds,
        focusOrder: this.#nextFocusOrder(),
      }),
      "window-restored",
      windowId,
    );
  }

  close(windowId: WindowId): boolean {
    if (!this.#find(windowId)) {
      return false;
    }

    const windows = this.#snapshot.windows.filter((windowState) => windowState.id !== windowId);
    const activeWindowId =
      this.#snapshot.activeWindowId === windowId
        ? this.#topVisibleWindowId(windows)
        : this.#snapshot.activeWindowId;
    this.#replace(windows, activeWindowId, "window-closed", windowId);
    return true;
  }

  setWorkArea(workArea: WindowBounds): void {
    const validated = validateWorkArea(workArea);
    const windows = this.#snapshot.windows.map((windowState) => {
      const normalBounds = constrainBounds(
        windowState.normalBounds,
        windowState.constraints,
        validated,
      );
      const bounds = windowState.mode === "maximized" ? validated : normalBounds;
      return freezeWindow({ ...windowState, bounds, normalBounds });
    });
    this.#snapshot = freezeSnapshot(windows, this.#snapshot.activeWindowId, validated);
    this.#emit("work-area-changed", null);
  }

  reset(): void {
    if (this.#snapshot.windows.length === 0) {
      return;
    }

    this.#focusOrder = 0;
    this.#replace([], null, "windows-reset", null);
  }

  dispose(): void {
    this.reset();
    this.#stateChanged.clear();
  }

  #initialBounds(
    preferredWidth: number,
    preferredHeight: number,
    constraints: WindowConstraints,
  ): WindowBounds {
    const workArea = this.#snapshot.workArea;
    const baseBounds = constrainBounds(
      {
        x: workArea.x + (workArea.width - preferredWidth) / 2,
        y: workArea.y + (workArea.height - preferredHeight) / 2,
        width: preferredWidth,
        height: preferredHeight,
      },
      constraints,
      workArea,
    );
    const cascadeIndex = this.#snapshot.windows.length;

    return constrainBounds(
      {
        ...baseBounds,
        x: baseBounds.x + cascadeIndex * WINDOW_CASCADE_OFFSET,
        y: baseBounds.y + cascadeIndex * WINDOW_CASCADE_OFFSET,
      },
      constraints,
      workArea,
    );
  }

  #updateNormalBounds(
    windowId: WindowId,
    update: (windowState: WindowState) => WindowBounds,
    reason: WindowTransitionReason,
  ): boolean {
    const target = this.#find(windowId);

    if (!target || target.mode !== "normal") {
      return false;
    }

    return this.#update(
      windowId,
      (windowState) => {
        const bounds = constrainBounds(
          update(windowState),
          windowState.constraints,
          this.#snapshot.workArea,
        );
        return { ...windowState, bounds, normalBounds: bounds };
      },
      reason,
      this.#snapshot.activeWindowId,
    );
  }

  #update(
    windowId: WindowId,
    update: (windowState: WindowState) => WindowState,
    reason: WindowTransitionReason,
    activeWindowId: WindowId | null,
  ): boolean {
    if (!this.#find(windowId)) {
      return false;
    }

    const windows = this.#snapshot.windows.map((windowState) =>
      windowState.id === windowId ? freezeWindow(update(windowState)) : windowState,
    );
    this.#replace(windows, activeWindowId, reason, windowId);
    return true;
  }

  #replace(
    windows: readonly WindowState[],
    activeWindowId: WindowId | null,
    reason: WindowTransitionReason,
    windowId: WindowId | null,
  ): void {
    this.#snapshot = freezeSnapshot(windows, activeWindowId, this.#snapshot.workArea);
    this.#emit(reason, windowId);
  }

  #emit(reason: WindowTransitionReason, windowId: WindowId | null): void {
    this.#stateChanged.emit(
      Object.freeze({
        type: "window-state-changed",
        reason,
        windowId,
        snapshot: this.#snapshot,
      }),
    );
  }

  #find(windowId: WindowId): WindowState | undefined {
    return this.#snapshot.windows.find((windowState) => windowState.id === windowId);
  }

  #topVisibleWindowId(
    windows: readonly WindowState[],
    excludedWindowId?: WindowId,
  ): WindowId | null {
    return (
      windows
        .filter(
          (windowState) => windowState.mode !== "minimized" && windowState.id !== excludedWindowId,
        )
        .sort((left, right) => right.focusOrder - left.focusOrder)[0]?.id ?? null
    );
  }

  #nextFocusOrder(): number {
    this.#focusOrder += 1;
    return this.#focusOrder;
  }
}

function normalizeConstraints(
  constraints: Partial<WindowConstraints> | undefined,
): WindowConstraints {
  const normalized: WindowConstraints = {
    minWidth: constraints?.minWidth ?? DEFAULT_MIN_WINDOW_WIDTH,
    minHeight: constraints?.minHeight ?? DEFAULT_MIN_WINDOW_HEIGHT,
    maxWidth: constraints?.maxWidth ?? null,
    maxHeight: constraints?.maxHeight ?? null,
  };

  for (const value of [normalized.minWidth, normalized.minHeight]) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new RangeError("Minimum window dimensions must be finite and positive.");
    }
  }

  if (normalized.maxWidth !== null && normalized.maxWidth < normalized.minWidth) {
    throw new RangeError("Maximum window width must not be smaller than its minimum.");
  }

  if (normalized.maxHeight !== null && normalized.maxHeight < normalized.minHeight) {
    throw new RangeError("Maximum window height must not be smaller than its minimum.");
  }

  return Object.freeze(normalized);
}

function constrainBounds(
  bounds: WindowBounds,
  constraints: WindowConstraints,
  workArea: WindowBounds,
): WindowBounds {
  for (const value of [bounds.x, bounds.y, bounds.width, bounds.height]) {
    if (!Number.isFinite(value)) {
      throw new RangeError("Window bounds must contain only finite values.");
    }
  }

  const maximumWidth = Math.min(constraints.maxWidth ?? workArea.width, workArea.width);
  const maximumHeight = Math.min(constraints.maxHeight ?? workArea.height, workArea.height);
  const minimumWidth = Math.min(constraints.minWidth, maximumWidth);
  const minimumHeight = Math.min(constraints.minHeight, maximumHeight);
  const width = clamp(bounds.width, minimumWidth, maximumWidth);
  const height = clamp(bounds.height, minimumHeight, maximumHeight);
  const x = clamp(bounds.x, workArea.x, workArea.x + workArea.width - width);
  const y = clamp(bounds.y, workArea.y, workArea.y + workArea.height - height);

  return Object.freeze({ x, y, width, height });
}

function validateWorkArea(workArea: WindowBounds): WindowBounds {
  for (const value of [workArea.x, workArea.y, workArea.width, workArea.height]) {
    if (!Number.isFinite(value)) {
      throw new RangeError("Work area bounds must contain only finite values.");
    }
  }

  if (workArea.width <= 0 || workArea.height <= 0) {
    throw new RangeError("Work area dimensions must be positive.");
  }

  return Object.freeze({ ...workArea });
}

function freezeWindow(windowState: WindowState): WindowState {
  return Object.freeze({
    ...windowState,
    bounds: Object.freeze({ ...windowState.bounds }),
    normalBounds: Object.freeze({ ...windowState.normalBounds }),
    constraints: Object.freeze({ ...windowState.constraints }),
  });
}

function freezeSnapshot(
  windows: readonly WindowState[],
  activeWindowId: WindowId | null,
  workArea: WindowBounds,
): WindowManagerSnapshot {
  return Object.freeze({
    windows: Object.freeze([...windows]),
    activeWindowId,
    workArea: Object.freeze({ ...workArea }),
  });
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
