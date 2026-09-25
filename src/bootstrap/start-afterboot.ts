import { createInitialHostModel } from "./host-model";
import { renderHost } from "./render-host";

export function startAfterboot(document: Document): void {
  const root = document.querySelector<HTMLElement>("#app");

  if (!root) {
    throw new Error("AFTERBOOT host element was not found.");
  }

  renderHost(root, createInitialHostModel());
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
