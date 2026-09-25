import { ShadowRuntime, type BootStageDurations } from "../core/runtime/shadow-runtime";
import { BrowserClock } from "../platform/browser-clock";
import { prefersReducedMotion } from "../platform/motion-preference";
import { ShellView } from "../shell/shell-view";

const STANDARD_BOOT_STAGE_DURATIONS: BootStageDurations = {
  "power-on": 700,
  firmware: 1_600,
  "system-initialization": 700,
  "system-core": 900,
  "system-clock": 850,
  "display-system": 850,
  "desktop-environment": 950,
  finalizing: 650,
};

const REDUCED_MOTION_BOOT_STAGE_DURATIONS: BootStageDurations = {
  "power-on": 300,
  firmware: 700,
  "system-initialization": 300,
  "system-core": 350,
  "system-clock": 350,
  "display-system": 350,
  "desktop-environment": 400,
  finalizing: 300,
};

export interface AfterbootApplication {
  readonly runtime: ShadowRuntime;
  dispose(): void;
}

export function startAfterboot(document: Document, browserWindow: Window): AfterbootApplication {
  const root = document.querySelector<HTMLElement>("#app");

  if (!root) {
    throw new Error("AFTERBOOT host element was not found.");
  }

  const clock = new BrowserClock();
  const reducedMotion = prefersReducedMotion(browserWindow);
  const runtime = new ShadowRuntime(clock, {
    bootStageDurations: reducedMotion
      ? REDUCED_MOTION_BOOT_STAGE_DURATIONS
      : STANDARD_BOOT_STAGE_DURATIONS,
  });
  const shellView = new ShellView(root, document, runtime, clock, reducedMotion);
  const disposeShell = shellView.mount();

  runtime.boot();

  return {
    runtime,
    dispose(): void {
      disposeShell();
      runtime.dispose();
    },
  };
}

export function renderStartupFailure(document: Document): void {
  const root = document.querySelector<HTMLElement>("#app") ?? document.body;
  const fallback = document.createElement("main");
  fallback.className = "startup-failure";

  const title = document.createElement("h1");
  title.textContent = "AFTERBOOT";

  const message = document.createElement("p");
  message.setAttribute("role", "alert");
  message.textContent = "The host environment could not be initialized.";

  fallback.append(title, message);
  root.replaceChildren(fallback);
}
