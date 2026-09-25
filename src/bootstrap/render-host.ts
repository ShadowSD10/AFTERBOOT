import type { HostModel } from "./host-model";

export function renderHost(root: HTMLElement, model: HostModel): void {
  const host = document.createElement("main");
  host.className = "host";

  const header = document.createElement("header");
  header.className = "host__header";

  const headerProduct = document.createElement("span");
  headerProduct.textContent = model.productName;

  const phase = document.createElement("span");
  phase.className = "host__phase";
  phase.textContent = `STATE / ${model.phase.toUpperCase()}`;

  header.append(headerProduct, phase);

  const identity = document.createElement("section");
  identity.className = "host__identity";
  identity.setAttribute("aria-labelledby", "afterboot-title");

  const systemName = document.createElement("p");
  systemName.className = "host__system-name";
  systemName.textContent = model.systemName;

  const title = document.createElement("h1");
  title.id = "afterboot-title";
  title.textContent = model.productName;

  const status = document.createElement("div");
  status.className = "host__status";
  status.setAttribute("role", "status");

  const indicator = document.createElement("span");
  indicator.className = "host__indicator";
  indicator.setAttribute("aria-hidden", "true");

  const statusMessage = document.createElement("span");
  statusMessage.textContent = model.statusMessage;

  status.append(indicator, statusMessage);
  identity.append(systemName, title, status);

  const footer = document.createElement("footer");
  footer.className = "host__footer";
  footer.textContent = "LOCAL SIMULATION / STATIC RUNTIME";

  host.append(header, identity, footer);
  root.replaceChildren(host);
}
