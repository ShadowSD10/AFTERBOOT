import type { ApplicationManager } from "../../applications/framework/application-manager";
import type { Disposable } from "../../core/disposable";
import { toWindowId, type WindowId } from "../../core/identity/identifiers";
import type { WindowManager } from "./window-manager";
import type { WindowBounds, WindowState } from "./window-state";

interface WindowElementRecord {
  readonly element: HTMLElement;
  readonly title: HTMLElement;
  readonly maximizeButton: HTMLButtonElement;
  readonly content: HTMLElement;
  readonly disposeView: Disposable;
}

interface PointerInteraction {
  readonly pointerId: number;
  readonly windowId: WindowId;
  readonly operation: "move" | "resize";
  readonly originX: number;
  readonly originY: number;
  readonly initialBounds: WindowBounds;
}

export class WindowLayerView {
  readonly #container: HTMLElement;
  readonly #document: Document;
  readonly #browserWindow: Window;
  readonly #windowManager: WindowManager;
  readonly #applicationManager: ApplicationManager;
  readonly #records = new Map<WindowId, WindowElementRecord>();
  #pointerInteraction: PointerInteraction | null = null;
  #unsubscribeWindows: Disposable | null = null;
  #unsubscribeApplications: Disposable | null = null;
  #previousActiveWindowId: WindowId | null = null;

  constructor(
    container: HTMLElement,
    document: Document,
    browserWindow: Window,
    windowManager: WindowManager,
    applicationManager: ApplicationManager,
  ) {
    this.#container = container;
    this.#document = document;
    this.#browserWindow = browserWindow;
    this.#windowManager = windowManager;
    this.#applicationManager = applicationManager;
  }

  mount(): Disposable {
    this.#unsubscribeWindows = this.#windowManager.onStateChanged(() => this.render());
    this.#unsubscribeApplications = this.#applicationManager.onStateChanged(() => this.render());
    this.#container.addEventListener("pointerdown", this.#handlePointerDown);
    this.#container.addEventListener("pointermove", this.#handlePointerMove);
    this.#container.addEventListener("pointerup", this.#handlePointerEnd);
    this.#container.addEventListener("pointercancel", this.#handlePointerEnd);
    this.#container.addEventListener("click", this.#handleClick);
    this.#container.addEventListener("focusin", this.#handleFocusIn);
    this.#browserWindow.addEventListener("resize", this.#syncWorkArea);
    this.#syncWorkArea();
    this.render();
    return () => this.dispose();
  }

  render(): void {
    const snapshot = this.#windowManager.snapshot;
    const currentIds = new Set(snapshot.windows.map((windowState) => windowState.id));

    for (const [windowId, record] of this.#records) {
      if (!currentIds.has(windowId)) {
        record.disposeView();
        record.element.remove();
        this.#records.delete(windowId);
      }
    }

    for (const windowState of snapshot.windows) {
      const record = this.#records.get(windowState.id) ?? this.#createWindow(windowState);
      if (!record) {
        continue;
      }
      this.#updateWindow(record, windowState, snapshot.activeWindowId === windowState.id);
    }

    if (snapshot.activeWindowId !== this.#previousActiveWindowId && snapshot.activeWindowId) {
      const activeRecord = this.#records.get(snapshot.activeWindowId);
      if (
        activeRecord &&
        !activeRecord.element.hidden &&
        !activeRecord.element.contains(this.#document.activeElement)
      ) {
        activeRecord.element.focus({ preventScroll: true });
      }
      if (activeRecord) {
        this.#previousActiveWindowId = snapshot.activeWindowId;
      }
    } else {
      this.#previousActiveWindowId = snapshot.activeWindowId;
    }
  }

  dispose(): void {
    this.#unsubscribeWindows?.();
    this.#unsubscribeApplications?.();
    this.#unsubscribeWindows = null;
    this.#unsubscribeApplications = null;
    this.#browserWindow.removeEventListener("resize", this.#syncWorkArea);
    this.#container.removeEventListener("pointerdown", this.#handlePointerDown);
    this.#container.removeEventListener("pointermove", this.#handlePointerMove);
    this.#container.removeEventListener("pointerup", this.#handlePointerEnd);
    this.#container.removeEventListener("pointercancel", this.#handlePointerEnd);
    this.#container.removeEventListener("click", this.#handleClick);
    this.#container.removeEventListener("focusin", this.#handleFocusIn);
    for (const record of this.#records.values()) {
      record.disposeView();
    }
    this.#records.clear();
    this.#pointerInteraction = null;
    this.#container.replaceChildren();
  }

  #createWindow(windowState: WindowState): WindowElementRecord | null {
    const view = this.#applicationManager.getView(windowState.id);
    if (!view) {
      return null;
    }

    const windowElement = this.#document.createElement("section");
    windowElement.className = "os-window";
    windowElement.dataset.windowId = windowState.id;
    windowElement.tabIndex = -1;
    windowElement.setAttribute("role", "dialog");

    const titleBar = this.#document.createElement("header");
    titleBar.className = "os-window__titlebar";
    titleBar.dataset.windowDrag = "true";
    const title = this.#document.createElement("h2");
    title.className = "os-window__title";
    const controls = this.#document.createElement("div");
    controls.className = "os-window__controls";
    const minimizeButton = control(this.#document, "minimize", "Minimize window", "_");
    const maximizeButton = control(this.#document, "maximize", "Maximize window", "□");
    const closeButton = control(this.#document, "close", "Close window", "×");
    controls.append(minimizeButton, maximizeButton, closeButton);
    titleBar.append(title, controls);

    const content = this.#document.createElement("div");
    content.className = "os-window__content";
    const resizeHandle = this.#document.createElement("div");
    resizeHandle.className = "os-window__resize-handle";
    resizeHandle.dataset.windowResize = "true";
    resizeHandle.setAttribute("aria-hidden", "true");
    windowElement.append(titleBar, content, resizeHandle);
    this.#container.append(windowElement);

    const record = {
      element: windowElement,
      title,
      maximizeButton,
      content,
      disposeView: view.mount(content, this.#document),
    };
    this.#records.set(windowState.id, record);
    return record;
  }

  #updateWindow(record: WindowElementRecord, windowState: WindowState, active: boolean): void {
    record.title.textContent = windowState.title;
    record.element.setAttribute("aria-label", windowState.title);
    record.element.dataset.mode = windowState.mode;
    record.element.dataset.active = active ? "true" : "false";
    record.element.hidden = windowState.mode === "minimized";
    record.element.style.left = `${windowState.bounds.x}px`;
    record.element.style.top = `${windowState.bounds.y}px`;
    record.element.style.width = `${windowState.bounds.width}px`;
    record.element.style.height = `${windowState.bounds.height}px`;
    record.element.style.zIndex = String(10 + windowState.focusOrder);
    const maximized = windowState.mode === "maximized";
    record.maximizeButton.dataset.windowAction = maximized ? "restore" : "maximize";
    record.maximizeButton.setAttribute(
      "aria-label",
      maximized ? "Restore window" : "Maximize window",
    );
    record.maximizeButton.title = maximized ? "Restore window" : "Maximize window";
    record.maximizeButton.textContent = maximized ? "◇" : "□";
  }

  readonly #syncWorkArea = (): void => {
    this.#windowManager.setWorkArea({
      x: 0,
      y: 0,
      width: Math.max(1, this.#container.clientWidth),
      height: Math.max(1, this.#container.clientHeight),
    });
  };

  readonly #handleClick = (event: MouseEvent): void => {
    const target = event.target instanceof Element ? event.target : null;
    const actionElement = target?.closest<HTMLElement>("[data-window-action]");
    const windowElement = target?.closest<HTMLElement>("[data-window-id]");
    if (!actionElement || !windowElement?.dataset.windowId) {
      return;
    }

    const windowId = toWindowId(windowElement.dataset.windowId);
    switch (actionElement.dataset.windowAction) {
      case "minimize":
        this.#windowManager.minimize(windowId);
        break;
      case "maximize":
        this.#windowManager.maximize(windowId);
        break;
      case "restore":
        this.#windowManager.restore(windowId);
        break;
      case "close":
        this.#applicationManager.closeWindow(windowId);
        break;
    }
  };

  readonly #handleFocusIn = (event: FocusEvent): void => {
    const target = event.target instanceof Element ? event.target : null;
    const windowId = target?.closest<HTMLElement>("[data-window-id]")?.dataset.windowId;
    if (windowId) {
      this.#windowManager.focus(toWindowId(windowId));
    }
  };

  readonly #handlePointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) {
      return;
    }

    const target = event.target instanceof Element ? event.target : null;
    const windowElement = target?.closest<HTMLElement>("[data-window-id]");
    const rawWindowId = windowElement?.dataset.windowId;
    if (!windowElement || !rawWindowId) {
      return;
    }

    const windowId = toWindowId(rawWindowId);
    this.#windowManager.focus(windowId);
    const windowState = this.#windowManager.snapshot.windows.find(
      (candidate) => candidate.id === windowId,
    );
    const operation = target?.closest("[data-window-resize]")
      ? "resize"
      : target?.closest("[data-window-drag]") && !target.closest("button")
        ? "move"
        : null;
    if (!windowState || windowState.mode !== "normal" || !operation) {
      return;
    }

    event.preventDefault();
    windowElement.setPointerCapture(event.pointerId);
    this.#pointerInteraction = {
      pointerId: event.pointerId,
      windowId,
      operation,
      originX: event.clientX,
      originY: event.clientY,
      initialBounds: windowState.bounds,
    };
  };

  readonly #handlePointerMove = (event: PointerEvent): void => {
    const interaction = this.#pointerInteraction;
    if (!interaction || interaction.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - interaction.originX;
    const deltaY = event.clientY - interaction.originY;
    if (interaction.operation === "move") {
      this.#windowManager.move(interaction.windowId, {
        x: interaction.initialBounds.x + deltaX,
        y: interaction.initialBounds.y + deltaY,
      });
    } else {
      this.#windowManager.resize(interaction.windowId, {
        ...interaction.initialBounds,
        width: interaction.initialBounds.width + deltaX,
        height: interaction.initialBounds.height + deltaY,
      });
    }
  };

  readonly #handlePointerEnd = (event: PointerEvent): void => {
    if (this.#pointerInteraction?.pointerId === event.pointerId) {
      this.#pointerInteraction = null;
    }
  };
}

function control(
  document: Document,
  action: string,
  label: string,
  symbol: string,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.className = `os-window__control os-window__control--${action}`;
  button.type = "button";
  button.dataset.windowAction = action;
  button.setAttribute("aria-label", label);
  button.title = label;
  button.textContent = symbol;
  return button;
}
