import type { Disposable } from "../../core/disposable";
import type {
  ApplicationId,
  ApplicationInstanceId,
  WindowId,
} from "../../core/identity/identifiers";
import type { WindowConstraints } from "../../shell/windows/window-state";

export interface ApplicationView {
  mount(host: HTMLElement, document: Document): Disposable;
}

export interface ApplicationWindowOptions {
  readonly title: string;
  readonly view: ApplicationView;
  readonly preferredWidth?: number;
  readonly preferredHeight?: number;
  readonly constraints?: Partial<WindowConstraints>;
}

export interface ApplicationContext {
  readonly applicationId: ApplicationId;
  readonly instanceId: ApplicationInstanceId;
  openWindow(options: ApplicationWindowOptions): WindowId;
}

export interface ApplicationInstance {
  readonly primaryView: ApplicationView;
  dispose(): void;
}

export interface ApplicationManifest {
  readonly id: ApplicationId;
  readonly name: string;
  readonly description: string;
  readonly window: Readonly<{
    title: string;
    preferredWidth?: number;
    preferredHeight?: number;
    constraints?: Partial<WindowConstraints>;
  }>;
}

export interface ApplicationDefinition {
  readonly manifest: ApplicationManifest;
  create(context: ApplicationContext): ApplicationInstance;
}

export interface ApplicationInstanceState {
  readonly id: ApplicationInstanceId;
  readonly applicationId: ApplicationId;
  readonly primaryWindowId: WindowId;
  readonly windowIds: readonly WindowId[];
}

export interface ApplicationManagerSnapshot {
  readonly instances: readonly ApplicationInstanceState[];
}

export type ApplicationTransitionReason =
  | "application-launched"
  | "application-focused-existing"
  | "application-window-opened"
  | "application-window-closed"
  | "application-closed"
  | "applications-reset";

export interface ApplicationStateChanged {
  readonly type: "application-state-changed";
  readonly reason: ApplicationTransitionReason;
  readonly instanceId: ApplicationInstanceId | null;
  readonly windowId: WindowId | null;
  readonly snapshot: ApplicationManagerSnapshot;
}
