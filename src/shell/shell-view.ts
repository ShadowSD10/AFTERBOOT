import type { Disposable } from "../core/disposable";
import {
  BOOT_STAGES,
  type BootStage,
  type RuntimeSnapshot,
  type ShadowRuntime,
} from "../core/runtime/shadow-runtime";
import type { Clock } from "../core/time/clock";
import { formatSystemTime } from "./system-time";

const CLOCK_UPDATE_INTERVAL_MS = 1_000;
const SKIP_BOOT_ACTION = "skip-boot";

interface BootService {
  readonly stage: BootStage;
  readonly label: string;
}

const BOOT_SERVICES: readonly BootService[] = [
  { stage: "system-core", label: "System core" },
  { stage: "system-clock", label: "System clock" },
  { stage: "display-system", label: "Display system" },
  { stage: "desktop-environment", label: "Desktop environment" },
];

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
    const restoreSkipFocus =
      this.#document.activeElement instanceof HTMLElement &&
      this.#document.activeElement.dataset.action === SKIP_BOOT_ACTION;
    let content: HTMLElement;

    if (snapshot.bootStage) {
      this.#root.dataset.bootStage = snapshot.bootStage;
    } else {
      delete this.#root.dataset.bootStage;
    }

    switch (snapshot.phase) {
      case "startup":
      case "resetting":
        content = this.#renderStartup(snapshot);
        break;
      case "booting":
        content = this.#renderBoot(snapshot);
        break;
      case "ready":
        content = this.#renderDesktop(snapshot);
        break;
      case "failed":
        content = this.#renderFailure(snapshot);
        break;
    }

    this.#root.replaceChildren(content);

    if (restoreSkipFocus) {
      this.#root.querySelector<HTMLButtonElement>(`[data-action="${SKIP_BOOT_ACTION}"]`)?.focus();
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

    const systemName = this.#element("p", "system-mark", "SHADOW SYSTEMS");
    const title = this.#element("h1", "startup-screen__title", "System restart");
    title.id = "startup-title";
    const state = this.#element(
      "p",
      "startup-screen__state",
      snapshot.phase === "resetting" ? "Clearing active system state" : "Powering on",
    );
    state.setAttribute("role", "status");

    main.append(systemName, title, state);
    return main;
  }

  #renderBoot(snapshot: RuntimeSnapshot): HTMLElement {
    if (snapshot.bootStage === "power-on") {
      return this.#renderPowerOn();
    }

    if (snapshot.bootStage === "firmware") {
      return this.#renderFirmware();
    }

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
    const title = this.#element("h1", "boot-screen__title", "System initialization");
    title.id = "boot-title";
    const status = this.#element(
      "p",
      "boot-screen__status",
      snapshot.bootStage === "finalizing"
        ? "System services ready. Preparing desktop environment."
        : "Initializing system services",
    );
    status.setAttribute("role", "status");

    const diagnostics = this.#element("ol", "boot-diagnostics");
    diagnostics.setAttribute("aria-label", "System service initialization");
    diagnostics.append(
      ...BOOT_SERVICES.map((service, index) =>
        this.#diagnostic(index + 1, service.label, this.#serviceState(snapshot, service.stage)),
      ),
    );

    const skipButton = this.#createSkipButton("boot-screen__skip");

    content.append(cycle, title, status, diagnostics, skipButton);

    const footer = this.#element("footer", "system-footer", "AFTERBOOT HOST / LOCAL SIMULATION");
    main.append(header, content, footer);
    return main;
  }

  #renderPowerOn(): HTMLElement {
    const main = this.#element("main", "power-on-screen");
    main.setAttribute("aria-labelledby", "power-on-title");

    const title = this.#element("h1", "visually-hidden", "SHADOW OS power on");
    title.id = "power-on-title";
    const signal = this.#element("p", "power-on-screen__signal", "DISPLAY SIGNAL / ACTIVE");
    signal.setAttribute("role", "status");
    main.append(title, signal, this.#createSkipButton("power-on-screen__skip"));
    return main;
  }

  #renderFirmware(): HTMLElement {
    const main = this.#element("main", "firmware-screen");
    main.setAttribute("aria-labelledby", "firmware-title");

    const output = this.#element("section", "firmware-screen__output");
    const title = this.#element("h1", "firmware-screen__title", "SHADOW SYSTEMS");
    title.id = "firmware-title";
    const revision = this.#element("p", "firmware-screen__revision", "FIRMWARE REVISION 1.0");
    const checks = this.#element("div", "firmware-checks");
    checks.append(
      this.#firmwareCheck("MEMORY", "OK"),
      this.#firmwareCheck("STORAGE", "ONLINE"),
      this.#firmwareCheck("DISPLAY", "ONLINE"),
    );
    const status = this.#element("p", "firmware-screen__status", "INITIALIZING SHADOW OS...");
    status.setAttribute("role", "status");
    output.append(title, revision, checks, status);
    main.append(output, this.#createSkipButton("firmware-screen__skip"));
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
    const clockLabel = this.#element("span", "system-clock__label", "LOCAL SYSTEM TIME");
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

  #diagnostic(index: number, label: string, state: string): HTMLElement {
    const row = this.#element("li", "boot-diagnostics__row");
    row.append(
      this.#element("span", "boot-diagnostics__index", index.toString().padStart(2, "0")),
      this.#element("span", "boot-diagnostics__label", label),
      this.#element(
        "span",
        `boot-diagnostics__state boot-diagnostics__state--${state}`,
        `[ ${state} ]`,
      ),
    );
    return row;
  }

  #firmwareCheck(label: string, state: string): HTMLElement {
    const row = this.#element("p", "firmware-checks__row");
    row.append(
      this.#element("span", "firmware-checks__label", label),
      this.#element("span", "firmware-checks__leader", "................"),
      this.#element("span", "firmware-checks__state", state),
    );
    return row;
  }

  #serviceState(snapshot: RuntimeSnapshot, serviceStage: BootStage): string {
    const currentStageIndex = snapshot.bootStage ? BOOT_STAGES.indexOf(snapshot.bootStage) : -1;
    const serviceStageIndex = BOOT_STAGES.indexOf(serviceStage);

    if (currentStageIndex < serviceStageIndex) {
      return "waiting";
    }

    if (currentStageIndex === serviceStageIndex) {
      return "initializing";
    }

    return "ok";
  }

  #createSkipButton(className: string): HTMLButtonElement {
    const button = this.#element("button", className, "Skip boot sequence");
    button.type = "button";
    button.dataset.action = SKIP_BOOT_ACTION;
    button.addEventListener("click", () => this.#runtime.skipBoot());
    return button;
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
