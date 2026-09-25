import type { Disposable } from "../core/disposable";
import type { RuntimeSnapshot, ShadowRuntime } from "../core/runtime/shadow-runtime";
import type { Clock } from "../core/time/clock";
import { formatSystemTime } from "./system-time";

const CLOCK_UPDATE_INTERVAL_MS = 1_000;

export class ShellView {
  readonly #root: HTMLElement;
  readonly #document: Document;
  readonly #runtime: ShadowRuntime;
  readonly #clock: Clock;
  readonly #reducedMotion: boolean;
  #unsubscribeRuntime: Disposable | null = null;
  #cancelClockUpdate: Disposable | null = null;

  constructor(
    root: HTMLElement,
    document: Document,
    runtime: ShadowRuntime,
    clock: Clock,
    reducedMotion: boolean,
  ) {
    this.#root = root;
    this.#document = document;
    this.#runtime = runtime;
    this.#clock = clock;
    this.#reducedMotion = reducedMotion;
  }

  mount(): Disposable {
    this.#document.documentElement.dataset.motion = this.#reducedMotion ? "reduced" : "full";
    this.#unsubscribeRuntime = this.#runtime.onStateChanged((event) => {
      this.render(event.snapshot);
    });
    this.render(this.#runtime.snapshot);

    return () => this.dispose();
  }

  render(snapshot: RuntimeSnapshot): void {
    this.#cancelClock();
    this.#root.dataset.runtimePhase = snapshot.phase;

    switch (snapshot.phase) {
      case "startup":
      case "resetting":
        this.#root.replaceChildren(this.#renderStartup(snapshot));
        break;
      case "booting":
        this.#root.replaceChildren(this.#renderBoot(snapshot));
        break;
      case "ready":
        this.#root.replaceChildren(this.#renderDesktop(snapshot));
        break;
      case "failed":
        this.#root.replaceChildren(this.#renderFailure(snapshot));
        break;
    }
  }

  dispose(): void {
    this.#cancelClock();
    this.#unsubscribeRuntime?.();
    this.#unsubscribeRuntime = null;
    delete this.#document.documentElement.dataset.motion;
  }

  #renderStartup(snapshot: RuntimeSnapshot): HTMLElement {
    const main = this.#element("main", "startup-screen");
    main.setAttribute("aria-labelledby", "startup-title");

    const systemName = this.#element("p", "system-mark", "SHADOW OS");
    const title = this.#element("h1", "startup-screen__title", "Initializing runtime");
    title.id = "startup-title";
    const state = this.#element(
      "p",
      "startup-screen__state",
      snapshot.phase === "resetting" ? "Resetting system state" : "Preparing boot controller",
    );
    state.setAttribute("role", "status");

    main.append(systemName, title, state);
    return main;
  }

  #renderBoot(snapshot: RuntimeSnapshot): HTMLElement {
    const main = this.#element("main", "boot-screen");
    main.setAttribute("aria-labelledby", "boot-title");

    const header = this.#element("header", "system-header");
    header.append(
      this.#element("span", "system-header__brand", "SHADOW OS"),
      this.#element("span", "system-header__state", "STATE / BOOTING"),
    );

    const content = this.#element("section", "boot-screen__content");
    const cycle = this.#element(
      "p",
      "boot-screen__cycle",
      `BOOT CYCLE ${snapshot.bootCycle.toString().padStart(2, "0")}`,
    );
    const title = this.#element("h1", "boot-screen__title", "System bootstrap");
    title.id = "boot-title";
    const status = this.#element(
      "p",
      "boot-screen__status",
      this.#reducedMotion ? "Reduced motion profile active" : "Verifying local runtime services",
    );
    status.setAttribute("role", "status");

    const diagnostics = this.#element("div", "boot-diagnostics");
    diagnostics.setAttribute("aria-hidden", "true");
    diagnostics.append(
      this.#diagnostic("01", "Runtime core", "online"),
      this.#diagnostic("02", "System clock", "synchronized"),
      this.#diagnostic("03", "Desktop shell", "standby"),
    );

    const skipButton = this.#element("button", "boot-screen__skip", "Skip boot sequence");
    skipButton.type = "button";
    skipButton.addEventListener("click", () => this.#runtime.skipBoot());

    content.append(cycle, title, status, diagnostics, skipButton);

    const footer = this.#element("footer", "system-footer", "AFTERBOOT HOST / LOCAL SIMULATION");
    main.append(header, content, footer);
    return main;
  }

  #renderDesktop(snapshot: RuntimeSnapshot): HTMLElement {
    const main = this.#element("main", "desktop-shell");
    main.setAttribute("aria-labelledby", "desktop-title");

    const header = this.#element("header", "system-header desktop-shell__header");
    header.append(
      this.#element("span", "system-header__brand", "SHADOW OS"),
      this.#element("span", "system-header__state", "SYSTEM / READY"),
    );

    const workspace = this.#element("section", "desktop-shell__workspace");
    const identity = this.#element("div", "desktop-shell__identity");
    const environment = this.#element(
      "p",
      "desktop-shell__environment",
      `ENVIRONMENT / CYCLE ${snapshot.bootCycle.toString().padStart(2, "0")}`,
    );
    const title = this.#element("h1", "desktop-shell__title", "Desktop ready");
    title.id = "desktop-title";
    const description = this.#element(
      "p",
      "desktop-shell__description",
      "Core runtime online. Workspace services awaiting installation.",
    );
    identity.append(environment, title, description);

    const clockPanel = this.#element("section", "system-clock");
    clockPanel.setAttribute("aria-label", "SHADOW OS system clock");
    const clockLabel = this.#element("span", "system-clock__label", "SHADOW STANDARD TIME");
    const time = this.#element("time", "system-clock__time");
    const date = this.#element("span", "system-clock__date");
    clockPanel.append(clockLabel, time, date);
    this.#startClock(time, date);

    workspace.append(identity, clockPanel);

    const footer = this.#element("footer", "desktop-shell__footer");
    const runtimeState = this.#element("span", "desktop-shell__runtime", "RUNTIME STABLE");
    const resetButton = this.#element("button", "desktop-shell__reset", "Restart SHADOW OS");
    resetButton.type = "button";
    resetButton.title = "Restart SHADOW OS";
    resetButton.addEventListener("click", () => this.#runtime.reset());
    footer.append(runtimeState, resetButton);

    main.append(header, workspace, footer);
    return main;
  }

  #renderFailure(snapshot: RuntimeSnapshot): HTMLElement {
    const main = this.#element("main", "runtime-failure");
    main.setAttribute("aria-labelledby", "failure-title");

    const systemName = this.#element("p", "system-mark", "SHADOW OS");
    const title = this.#element("h1", "runtime-failure__title", "Runtime halted");
    title.id = "failure-title";
    const message = this.#element(
      "p",
      "runtime-failure__message",
      snapshot.failureMessage ?? "An unknown runtime failure occurred.",
    );
    message.setAttribute("role", "alert");
    const resetButton = this.#element("button", "runtime-failure__reset", "Restart SHADOW OS");
    resetButton.type = "button";
    resetButton.addEventListener("click", () => this.#runtime.reset());

    main.append(systemName, title, message, resetButton);
    return main;
  }

  #diagnostic(index: string, label: string, state: string): HTMLElement {
    const row = this.#element("div", "boot-diagnostics__row");
    row.append(
      this.#element("span", "boot-diagnostics__index", index),
      this.#element("span", "boot-diagnostics__label", label),
      this.#element("span", "boot-diagnostics__state", state),
    );
    return row;
  }

  #startClock(timeElement: HTMLTimeElement, dateElement: HTMLElement): void {
    const update = (): void => {
      const systemTime = formatSystemTime(this.#clock.now());
      timeElement.dateTime = systemTime.iso;
      timeElement.textContent = systemTime.time;
      dateElement.textContent = systemTime.date;
      this.#cancelClockUpdate = this.#clock.schedule(update, CLOCK_UPDATE_INTERVAL_MS);
    };

    update();
  }

  #cancelClock(): void {
    this.#cancelClockUpdate?.();
    this.#cancelClockUpdate = null;
  }

  #element<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    className: string,
    text?: string,
  ): HTMLElementTagNameMap[K] {
    const element = this.#document.createElement(tagName);
    element.className = className;

    if (text !== undefined) {
      element.textContent = text;
    }

    return element;
  }
}
