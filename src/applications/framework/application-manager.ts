import type { Disposable } from "../../core/disposable";
import { TypedEvent, type EventListener } from "../../core/events/typed-event";
import {
  toApplicationInstanceId,
  type ApplicationId,
  type ApplicationInstanceId,
  type IdGenerator,
  type WindowId,
} from "../../core/identity/identifiers";
import type { WindowManager } from "../../shell/windows/window-manager";
import type {
  ApplicationContext,
  ApplicationInstance,
  ApplicationInstanceState,
  ApplicationManagerSnapshot,
  ApplicationStateChanged,
  ApplicationTransitionReason,
  ApplicationView,
  ApplicationWindowOptions,
} from "./application";
import type { ApplicationRegistry } from "./application-registry";

interface RunningApplication {
  readonly instance: ApplicationInstance;
  readonly views: Map<WindowId, ApplicationView>;
  state: ApplicationInstanceState;
}

export class ApplicationManager {
  readonly #registry: ApplicationRegistry;
  readonly #windowManager: WindowManager;
  readonly #idGenerator: IdGenerator;
  readonly #stateChanged = new TypedEvent<ApplicationStateChanged>();
  readonly #running = new Map<ApplicationInstanceId, RunningApplication>();
  #snapshot: ApplicationManagerSnapshot = freezeSnapshot([]);

  constructor(
    registry: ApplicationRegistry,
    windowManager: WindowManager,
    idGenerator: IdGenerator,
  ) {
    this.#registry = registry;
    this.#windowManager = windowManager;
    this.#idGenerator = idGenerator;
  }

  get snapshot(): ApplicationManagerSnapshot {
    return this.#snapshot;
  }

  onStateChanged(listener: EventListener<ApplicationStateChanged>): Disposable {
    return this.#stateChanged.subscribe(listener);
  }

  launch(applicationId: ApplicationId): ApplicationInstanceId {
    const existing = [...this.#running.values()].find(
      (running) => running.state.applicationId === applicationId,
    );

    if (existing) {
      const primaryWindow = this.#windowManager.snapshot.windows.find(
        (windowState) => windowState.id === existing.state.primaryWindowId,
      );

      if (primaryWindow?.mode === "minimized") {
        this.#windowManager.restore(existing.state.primaryWindowId);
      } else {
        this.#windowManager.focus(existing.state.primaryWindowId);
      }

      this.#emit("application-focused-existing", existing.state.id, existing.state.primaryWindowId);
      return existing.state.id;
    }

    const definition = this.#registry.get(applicationId);
    const instanceId = toApplicationInstanceId(this.#idGenerator.next("application-instance"));
    const context = this.#createContext(applicationId, instanceId);
    const instance = definition.create(context);
    let primaryWindowId: WindowId | null = null;

    try {
      const windowOptions = definition.manifest.window;
      primaryWindowId = this.#windowManager.open({
        ownerId: instanceId,
        title: windowOptions.title,
        ...(windowOptions.preferredWidth === undefined
          ? {}
          : { preferredWidth: windowOptions.preferredWidth }),
        ...(windowOptions.preferredHeight === undefined
          ? {}
          : { preferredHeight: windowOptions.preferredHeight }),
        ...(windowOptions.constraints === undefined
          ? {}
          : { constraints: windowOptions.constraints }),
      });
      const state = freezeInstanceState({
        id: instanceId,
        applicationId,
        primaryWindowId,
        windowIds: [primaryWindowId],
      });
      this.#running.set(instanceId, {
        instance,
        views: new Map([[primaryWindowId, instance.primaryView]]),
        state,
      });
      this.#refreshSnapshot();
      this.#emit("application-launched", instanceId, primaryWindowId);
      return instanceId;
    } catch (error) {
      if (primaryWindowId) {
        this.#windowManager.close(primaryWindowId);
      }
      instance.dispose();
      throw error;
    }
  }

  getView(windowId: WindowId): ApplicationView | undefined {
    for (const running of this.#running.values()) {
      const view = running.views.get(windowId);

      if (view) {
        return view;
      }
    }

    return undefined;
  }

  closeWindow(windowId: WindowId): boolean {
    const running = this.#findByWindow(windowId);

    if (!running) {
      return false;
    }

    if (running.state.primaryWindowId === windowId) {
      return this.closeInstance(running.state.id);
    }

    if (!this.#windowManager.close(windowId)) {
      return false;
    }

    running.views.delete(windowId);
    running.state = freezeInstanceState({
      ...running.state,
      windowIds: running.state.windowIds.filter((id) => id !== windowId),
    });
    this.#refreshSnapshot();
    this.#emit("application-window-closed", running.state.id, windowId);
    return true;
  }

  closeInstance(instanceId: ApplicationInstanceId): boolean {
    const running = this.#running.get(instanceId);

    if (!running) {
      return false;
    }

    for (const windowId of running.state.windowIds) {
      this.#windowManager.close(windowId);
    }

    this.#running.delete(instanceId);
    running.instance.dispose();
    this.#refreshSnapshot();
    this.#emit("application-closed", instanceId, running.state.primaryWindowId);
    return true;
  }

  reset(): void {
    if (this.#running.size === 0) {
      this.#windowManager.reset();
      return;
    }

    for (const running of this.#running.values()) {
      running.instance.dispose();
    }
    this.#running.clear();
    this.#windowManager.reset();
    this.#refreshSnapshot();
    this.#emit("applications-reset", null, null);
  }

  dispose(): void {
    this.reset();
    this.#stateChanged.clear();
  }

  #createContext(
    applicationId: ApplicationId,
    instanceId: ApplicationInstanceId,
  ): ApplicationContext {
    return Object.freeze({
      applicationId,
      instanceId,
      openWindow: (options: ApplicationWindowOptions): WindowId =>
        this.#openOwnedWindow(instanceId, options),
    });
  }

  #openOwnedWindow(instanceId: ApplicationInstanceId, options: ApplicationWindowOptions): WindowId {
    const running = this.#running.get(instanceId);

    if (!running) {
      throw new Error(`Application instance is not running: ${instanceId}`);
    }

    const windowId = this.#windowManager.open({
      ownerId: instanceId,
      title: options.title,
      ...(options.preferredWidth === undefined ? {} : { preferredWidth: options.preferredWidth }),
      ...(options.preferredHeight === undefined
        ? {}
        : { preferredHeight: options.preferredHeight }),
      ...(options.constraints === undefined ? {} : { constraints: options.constraints }),
    });
    running.views.set(windowId, options.view);
    running.state = freezeInstanceState({
      ...running.state,
      windowIds: [...running.state.windowIds, windowId],
    });
    this.#refreshSnapshot();
    this.#emit("application-window-opened", instanceId, windowId);
    return windowId;
  }

  #findByWindow(windowId: WindowId): RunningApplication | undefined {
    return [...this.#running.values()].find((running) =>
      running.state.windowIds.includes(windowId),
    );
  }

  #refreshSnapshot(): void {
    this.#snapshot = freezeSnapshot([...this.#running.values()].map((running) => running.state));
  }

  #emit(
    reason: ApplicationTransitionReason,
    instanceId: ApplicationInstanceId | null,
    windowId: WindowId | null,
  ): void {
    this.#stateChanged.emit(
      Object.freeze({
        type: "application-state-changed",
        reason,
        instanceId,
        windowId,
        snapshot: this.#snapshot,
      }),
    );
  }
}

function freezeInstanceState(state: ApplicationInstanceState): ApplicationInstanceState {
  return Object.freeze({ ...state, windowIds: Object.freeze([...state.windowIds]) });
}

function freezeSnapshot(
  instances: readonly ApplicationInstanceState[],
): ApplicationManagerSnapshot {
  return Object.freeze({ instances: Object.freeze([...instances]) });
}
