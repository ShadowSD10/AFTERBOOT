import type { ApplicationInstanceId, WindowId } from "../../core/identity/identifiers";

export type WindowMode = "normal" | "minimized" | "maximized";
export type RestorableWindowMode = Exclude<WindowMode, "minimized">;

export interface WindowBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface WindowConstraints {
  readonly minWidth: number;
  readonly minHeight: number;
  readonly maxWidth: number | null;
  readonly maxHeight: number | null;
}

export interface WindowState {
  readonly id: WindowId;
  readonly ownerId: ApplicationInstanceId;
  readonly title: string;
  readonly bounds: WindowBounds;
  readonly normalBounds: WindowBounds;
  readonly constraints: WindowConstraints;
  readonly mode: WindowMode;
  readonly restoreMode: RestorableWindowMode;
  readonly focusOrder: number;
}

export interface WindowManagerSnapshot {
  readonly windows: readonly WindowState[];
  readonly activeWindowId: WindowId | null;
  readonly workArea: WindowBounds;
}

export interface OpenWindowRequest {
  readonly ownerId: ApplicationInstanceId;
  readonly title: string;
  readonly preferredWidth?: number;
  readonly preferredHeight?: number;
  readonly constraints?: Partial<WindowConstraints>;
}

export type WindowTransitionReason =
  | "window-opened"
  | "window-focused"
  | "window-moved"
  | "window-resized"
  | "window-minimized"
  | "window-maximized"
  | "window-restored"
  | "window-closed"
  | "work-area-changed"
  | "windows-reset";

export interface WindowStateChanged {
  readonly type: "window-state-changed";
  readonly reason: WindowTransitionReason;
  readonly windowId: WindowId | null;
  readonly snapshot: WindowManagerSnapshot;
}
