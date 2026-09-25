import { ShadowRuntime } from "../core/runtime/shadow-runtime";
import { BrowserClock } from "../platform/browser-clock";
import { prefersReducedMotion } from "../platform/motion-preference";
import { ShellView } from "../shell/shell-view";

const STANDARD_BOOT_DURATION_MS = 2_400;
const REDUCED_MOTION_BOOT_DURATION_MS = 0;

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
    bootDurationMs: reducedMotion ? REDUCED_MOTION_BOOT_DURATION_MS : STANDARD_BOOT_DURATION_MS,
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
