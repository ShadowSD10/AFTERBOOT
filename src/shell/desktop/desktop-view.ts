import type { ApplicationManager } from "../../applications/framework/application-manager";
import type { ApplicationRegistry } from "../../applications/framework/application-registry";
import type { Disposable } from "../../core/disposable";
import { toWindowId } from "../../core/identity/identifiers";
import type { ShadowRuntime } from "../../core/runtime/shadow-runtime";
import type { Clock } from "../../core/time/clock";
import type { WindowManager } from "../windows/window-manager";
import { WindowLayerView } from "../windows/window-layer-view";
import { formatSystemTime } from "../system-time";
import { ApplicationDrawerView } from "./application-drawer-view";
import type { DesktopContextMenuActionId } from "./context-menu-model";
import { ContextMenuView } from "./context-menu-view";

const CLOCK_UPDATE_INTERVAL_MS = 1_000;

export class DesktopView {
  readonly element: HTMLElement;
  readonly #document: Document;
  readonly #runtime: ShadowRuntime;
  readonly #clock: Clock;
  readonly #windowManager: WindowManager;
  readonly #windowLayer: WindowLayerView;
  readonly #workspace: HTMLElement;
  readonly #drawer: ApplicationDrawerView;
  readonly #contextMenu: ContextMenuView;
  readonly #taskStrip: HTMLElement;
  readonly #time: HTMLTimeElement;
  readonly #date: HTMLElement;
  readonly #status: HTMLElement;
  readonly #resetButton: HTMLButtonElement;
  #cancelClock: Disposable | null = null;
  #unsubscribeWindows: Disposable | null = null;
  #refreshCount = 0;

  constructor(
    document: Document,
    browserWindow: Window,
    runtime: ShadowRuntime,
    clock: Clock,
    registry: ApplicationRegistry,
    applicationManager: ApplicationManager,
    windowManager: WindowManager,
    bootCycle: number,
  ) {
    this.#document = document;
    this.#runtime = runtime;
    this.#clock = clock;
    this.#windowManager = windowManager;

    const main = element(document, "main", "desktop-shell");
    main.setAttribute("aria-labelledby", "desktop-title");
    const title = element(document, "h1", "desktop-shell__ready", "Desktop ready");
    title.id = "desktop-title";

    const header = element(document, "header", "system-header desktop-shell__header");
    header.append(
      element(document, "span", "system-header__brand", "SHADOW OS"),
      title,
      element(document, "span", "system-header__state", "SYSTEM / READY"),
    );

    const workspace = element(document, "section", "desktop-shell__workspace");
    workspace.setAttribute("aria-label", "SHADOW OS desktop work area");
    workspace.dataset.contextSurface = "desktop";
    workspace.tabIndex = 0;
    const desktopIdentity = element(document, "div", "desktop-shell__identity");
    desktopIdentity.setAttribute("aria-hidden", "true");
    desktopIdentity.append(
      element(
        document,
        "p",
        "desktop-shell__environment",
        `ENVIRONMENT / CYCLE ${bootCycle.toString().padStart(2, "0")}`,
      ),
      element(document, "p", "desktop-shell__wordmark", "SHADOW"),
      element(document, "p", "desktop-shell__description", "WINDOW SERVICES ONLINE"),
    );
    const windowLayer = element(document, "div", "window-layer");
    windowLayer.setAttribute("aria-label", "Open application windows");
    workspace.append(desktopIdentity, windowLayer);

    this.#workspace = workspace;
    this.#drawer = new ApplicationDrawerView(document, registry, applicationManager);
    this.#contextMenu = new ContextMenuView(
      document,
      browserWindow,
      [
        { id: "refresh-desktop", label: "Refresh Desktop", symbol: "↻" },
        { id: "open-application-drawer", label: "Applications", symbol: "◇" },
      ],
      this.#handleContextAction,
    );

    const footer = element(document, "footer", "desktop-shell__footer");
    const launcher = element(document, "div", "application-launcher");
    launcher.append(this.#drawer.trigger);
    this.#taskStrip = element(document, "nav", "window-task-strip");
    this.#taskStrip.setAttribute("aria-label", "Open windows");
    const clockPanel = element(document, "section", "system-clock");
    clockPanel.setAttribute("aria-label", "SHADOW OS system clock");
    this.#time = element(document, "time", "system-clock__time");
    this.#date = element(document, "span", "system-clock__date");
    clockPanel.append(this.#time, this.#date);
    this.#resetButton = element(document, "button", "desktop-shell__reset", "Restart SHADOW OS");
    this.#resetButton.type = "button";
    this.#status = element(document, "p", "visually-hidden");
    this.#status.setAttribute("role", "status");
    this.#status.setAttribute("aria-live", "polite");
    footer.append(launcher, this.#taskStrip, clockPanel, this.#resetButton);
    main.append(
      header,
      workspace,
      this.#drawer.element,
      this.#contextMenu.element,
      footer,
      this.#status,
    );

    this.element = main;
    this.#windowLayer = new WindowLayerView(
      windowLayer,
      document,
      browserWindow,
      windowManager,
      applicationManager,
    );
  }

  mount(): Disposable {
    const disposeDrawer = this.#drawer.mount();
    const disposeContextMenu = this.#contextMenu.mount();
    this.#workspace.addEventListener("contextmenu", this.#handleDesktopContextMenu);
    this.#taskStrip.addEventListener("click", this.#handleTaskClick);
    this.#resetButton.addEventListener("click", this.#handleReset);
    this.#unsubscribeWindows = this.#windowManager.onStateChanged((event) => {
      this.#renderTasks();

      if (event.reason === "window-minimized" && !event.snapshot.activeWindowId) {
        this.#taskStrip
          .querySelector<HTMLButtonElement>(`[data-window-id="${event.windowId ?? ""}"]`)
          ?.focus();
      }

      if (event.reason === "window-closed" && !event.snapshot.activeWindowId) {
        this.#drawer.trigger.focus();
      }
    });
    const disposeWindowLayer = this.#windowLayer.mount();
    this.#renderTasks();
    this.#updateClock();

    return () => {
      this.#workspace.removeEventListener("contextmenu", this.#handleDesktopContextMenu);
      this.#taskStrip.removeEventListener("click", this.#handleTaskClick);
      this.#resetButton.removeEventListener("click", this.#handleReset);
      this.#unsubscribeWindows?.();
      this.#unsubscribeWindows = null;
      this.#cancelClock?.();
      this.#cancelClock = null;
      disposeContextMenu();
      disposeDrawer();
      disposeWindowLayer();
    };
  }

  #renderTasks(): void {
    const snapshot = this.#windowManager.snapshot;
    const tasks = snapshot.windows.map((windowState) => {
      const button = element(
        this.#document,
        "button",
        "window-task-strip__button",
        windowState.title,
      );
      button.type = "button";
      button.dataset.windowId = windowState.id;
      button.dataset.active = snapshot.activeWindowId === windowState.id ? "true" : "false";
      button.dataset.mode = windowState.mode;
      button.setAttribute(
        "aria-label",
        `${windowState.mode === "minimized" ? "Restore" : "Focus"} ${windowState.title}`,
      );
      return button;
    });
    this.#taskStrip.replaceChildren(...tasks);
  }

  #updateClock(): void {
    this.#renderClock();
    this.#cancelClock = this.#clock.schedule(() => this.#updateClock(), CLOCK_UPDATE_INTERVAL_MS);
  }

  #renderClock(): void {
    const systemTime = formatSystemTime(this.#clock.now());
    this.#time.dateTime = systemTime.iso;
    this.#time.textContent = systemTime.time;
    this.#date.textContent = systemTime.date;
  }

  #refreshDesktop(invoker: HTMLElement | null): void {
    this.#contextMenu.close(false);
    this.#drawer.close(false);
    this.#drawer.refresh();
    this.#renderTasks();
    this.#windowLayer.render();
    this.#renderClock();
    this.#refreshCount += 1;
    this.#status.textContent = `Desktop refreshed ${this.#refreshCount.toString()}`;
    if (invoker?.isConnected) {
      invoker.focus({ preventScroll: true });
    }
  }

  readonly #handleDesktopContextMenu = (event: MouseEvent): void => {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest(".os-window")) {
      return;
    }

    event.preventDefault();
    this.#drawer.close(false);
    const invoker =
      this.#document.activeElement instanceof HTMLElement
        ? this.#document.activeElement
        : this.#workspace;
    const workspaceBounds = this.#workspace.getBoundingClientRect();
    const keyboardInvocation = event.clientX === 0 && event.clientY === 0;
    this.#contextMenu.open(
      keyboardInvocation ? workspaceBounds.left + 16 : event.clientX,
      keyboardInvocation ? workspaceBounds.top + 16 : event.clientY,
      invoker,
    );
  };

  readonly #handleContextAction = (
    actionId: DesktopContextMenuActionId,
    invoker: HTMLElement | null,
  ): void => {
    if (actionId === "open-application-drawer") {
      this.#drawer.open();
    } else {
      this.#refreshDesktop(invoker);
    }
  };

  readonly #handleTaskClick = (event: MouseEvent): void => {
    const target = event.target instanceof Element ? event.target : null;
    const rawWindowId = target?.closest<HTMLElement>("[data-window-id]")?.dataset.windowId;
    if (!rawWindowId) {
      return;
    }
    const windowId = toWindowId(rawWindowId);
    const windowState = this.#windowManager.snapshot.windows.find(
      (candidate) => candidate.id === windowId,
    );
    if (windowState?.mode === "minimized") {
      this.#windowManager.restore(windowId);
    } else {
      this.#windowManager.focus(windowId);
    }
  };

  readonly #handleReset = (): void => this.#runtime.reset();
}

function element<K extends keyof HTMLElementTagNameMap>(
  document: Document,
  tagName: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tagName);
  node.className = className;
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
}
