import type { ApplicationManager } from "../../applications/framework/application-manager";
import type { ApplicationRegistry } from "../../applications/framework/application-registry";
import type { ApplicationManifest } from "../../applications/framework/application";
import type { Disposable } from "../../core/disposable";
import { toApplicationId } from "../../core/identity/identifiers";

const DRAWER_ID = "application-drawer";
const DRAWER_TITLE_ID = "application-drawer-title";
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

export class ApplicationDrawerView {
  readonly trigger: HTMLButtonElement;
  readonly element: HTMLElement;
  readonly #document: Document;
  readonly #registry: ApplicationRegistry;
  readonly #applicationManager: ApplicationManager;
  readonly #list: HTMLElement;

  constructor(
    document: Document,
    registry: ApplicationRegistry,
    applicationManager: ApplicationManager,
  ) {
    this.#document = document;
    this.#registry = registry;
    this.#applicationManager = applicationManager;

    this.trigger = document.createElement("button");
    this.trigger.className = "application-drawer__trigger";
    this.trigger.type = "button";
    this.trigger.textContent = "Applications";
    this.trigger.setAttribute("aria-controls", DRAWER_ID);
    this.trigger.setAttribute("aria-expanded", "false");
    this.trigger.setAttribute("aria-haspopup", "dialog");

    this.element = document.createElement("section");
    this.element.id = DRAWER_ID;
    this.element.className = "application-drawer";
    this.element.hidden = true;
    this.element.setAttribute("role", "dialog");
    this.element.setAttribute("aria-labelledby", DRAWER_TITLE_ID);

    const header = document.createElement("header");
    header.className = "application-drawer__header";
    const eyebrow = document.createElement("span");
    eyebrow.className = "application-drawer__eyebrow";
    eyebrow.textContent = "SHADOW OS /";
    const title = document.createElement("h2");
    title.id = DRAWER_TITLE_ID;
    title.className = "application-drawer__title";
    title.textContent = "Applications";
    header.append(eyebrow, title);

    this.#list = document.createElement("div");
    this.#list.className = "application-drawer__list";
    this.#list.setAttribute("aria-label", "Installed applications");
    this.element.append(header, this.#list);
    this.refresh();
  }

  get isOpen(): boolean {
    return !this.element.hidden;
  }

  mount(): Disposable {
    this.trigger.addEventListener("click", this.#handleTriggerClick);
    this.trigger.addEventListener("keydown", this.#handleTriggerKeyDown);
    this.element.addEventListener("click", this.#handleDrawerClick);
    this.element.addEventListener("keydown", this.#handleDrawerKeyDown);
    this.#document.addEventListener("pointerdown", this.#handleDocumentPointerDown);
    this.#document.addEventListener("focusin", this.#handleDocumentFocusIn);

    return () => {
      this.trigger.removeEventListener("click", this.#handleTriggerClick);
      this.trigger.removeEventListener("keydown", this.#handleTriggerKeyDown);
      this.element.removeEventListener("click", this.#handleDrawerClick);
      this.element.removeEventListener("keydown", this.#handleDrawerKeyDown);
      this.#document.removeEventListener("pointerdown", this.#handleDocumentPointerDown);
      this.#document.removeEventListener("focusin", this.#handleDocumentFocusIn);
      this.close(false);
    };
  }

  refresh(): void {
    this.#list.replaceChildren(...this.#registry.list().map((manifest) => this.#entry(manifest)));
  }

  open(focusFirst = true): void {
    if (this.isOpen) {
      if (focusFirst) {
        this.#entryButtons()[0]?.focus();
      }
      return;
    }

    this.element.hidden = false;
    this.trigger.setAttribute("aria-expanded", "true");
    if (focusFirst) {
      this.#entryButtons()[0]?.focus();
    }
  }

  close(restoreFocus = true): void {
    if (!this.isOpen) {
      return;
    }

    this.element.hidden = true;
    this.trigger.setAttribute("aria-expanded", "false");
    if (restoreFocus && this.trigger.isConnected) {
      this.trigger.focus({ preventScroll: true });
    }
  }

  #entry(manifest: ApplicationManifest): HTMLButtonElement {
    const button = this.#document.createElement("button");
    button.className = "application-drawer__entry";
    button.type = "button";
    button.dataset.applicationId = manifest.id;

    const marker = this.#document.createElement("span");
    marker.className = "application-drawer__marker";
    marker.setAttribute("aria-hidden", "true");
    if (manifest.name === "Notes") {
      marker.append(createNotesIcon(this.#document));
    } else if (manifest.name === "Calculator") {
      marker.append(createCalculatorIcon(this.#document));
    } else {
      marker.textContent = markerFor(manifest.name);
    }
    const copy = this.#document.createElement("span");
    copy.className = "application-drawer__copy";
    const name = this.#document.createElement("span");
    name.className = "application-drawer__name";
    name.textContent = manifest.name;
    const description = this.#document.createElement("span");
    description.className = "application-drawer__description";
    description.textContent = manifest.description;
    copy.append(name, description);
    button.append(marker, copy);
    return button;
  }

  #entryButtons(): HTMLButtonElement[] {
    return [...this.#list.querySelectorAll<HTMLButtonElement>("[data-application-id]")];
  }

  readonly #handleTriggerClick = (): void => {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  };

  readonly #handleTriggerKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      this.open();
    } else if (event.key === "Escape" && this.isOpen) {
      event.preventDefault();
      this.close();
    }
  };

  readonly #handleDrawerClick = (event: MouseEvent): void => {
    const target = event.target instanceof Element ? event.target : null;
    const applicationId =
      target?.closest<HTMLElement>("[data-application-id]")?.dataset.applicationId;
    if (!applicationId) {
      return;
    }

    this.#applicationManager.launch(toApplicationId(applicationId));
    this.close(false);
  };

  readonly #handleDrawerKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      event.preventDefault();
      this.close();
      return;
    }

    const entries = this.#entryButtons();
    const currentIndex = entries.indexOf(this.#document.activeElement as HTMLButtonElement);
    let nextIndex: number | null = null;

    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % entries.length;
        break;
      case "ArrowUp":
      case "ArrowLeft":
        nextIndex =
          currentIndex < 0
            ? entries.length - 1
            : (currentIndex - 1 + entries.length) % entries.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = entries.length - 1;
        break;
    }

    const nextEntry = nextIndex === null ? undefined : entries[nextIndex];
    if (nextEntry) {
      event.preventDefault();
      nextEntry.focus();
    }
  };

  readonly #handleDocumentPointerDown = (event: PointerEvent): void => {
    const target = event.target;
    if (
      this.isOpen &&
      target instanceof Node &&
      !this.element.contains(target) &&
      !this.trigger.contains(target)
    ) {
      this.close(false);
    }
  };

  readonly #handleDocumentFocusIn = (event: FocusEvent): void => {
    const target = event.target;
    if (
      this.isOpen &&
      target instanceof Node &&
      !this.element.contains(target) &&
      !this.trigger.contains(target)
    ) {
      this.close(false);
    }
  };
}

function markerFor(name: string): string {
  const marker = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return marker || "APP";
}

function createNotesIcon(document: Document): SVGSVGElement {
  const icon = document.createElementNS(SVG_NAMESPACE, "svg");
  icon.classList.add("application-drawer__notes-icon");
  icon.setAttribute("viewBox", "0 0 32 32");
  icon.setAttribute("fill", "none");
  icon.setAttribute("aria-hidden", "true");
  icon.setAttribute("focusable", "false");

  const page = document.createElementNS(SVG_NAMESPACE, "path");
  page.classList.add("application-drawer__notes-page");
  page.setAttribute("d", "M7 4.5h12l6 6v17H7z M19 4.5v6h6 M11 15h10 M11 19h8 M11 23h4");

  const pencil = document.createElementNS(SVG_NAMESPACE, "path");
  pencil.classList.add("application-drawer__notes-pencil");
  pencil.setAttribute("d", "m16 26.5 1-4 8-8 3.5 3.5-8 8z M24 15.5l3.5 3.5 M17 22.5l3.5 3.5");

  icon.append(page, pencil);
  return icon;
}

function createCalculatorIcon(document: Document): SVGSVGElement {
  const icon = document.createElementNS(SVG_NAMESPACE, "svg");
  icon.classList.add("application-drawer__calculator-icon");
  icon.setAttribute("viewBox", "0 0 32 32");
  icon.setAttribute("fill", "none");
  icon.setAttribute("aria-hidden", "true");
  icon.setAttribute("focusable", "false");

  const body = document.createElementNS(SVG_NAMESPACE, "rect");
  body.classList.add("application-drawer__calculator-body");
  body.setAttribute("x", "6");
  body.setAttribute("y", "3.5");
  body.setAttribute("width", "20");
  body.setAttribute("height", "25");

  const display = document.createElementNS(SVG_NAMESPACE, "rect");
  display.classList.add("application-drawer__calculator-display");
  display.setAttribute("x", "9");
  display.setAttribute("y", "7");
  display.setAttribute("width", "14");
  display.setAttribute("height", "5.5");

  const keys = document.createElementNS(SVG_NAMESPACE, "path");
  keys.classList.add("application-drawer__calculator-keys");
  keys.setAttribute(
    "d",
    "M9 16h3v3H9z M14.5 16h3v3h-3z M20 16h3v3h-3z M9 21.5h3v3H9z M14.5 21.5h3v3h-3z M20 21.5h3v3h-3z",
  );

  icon.append(body, display, keys);
  return icon;
}
