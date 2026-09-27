import type { ApplicationManager } from "../../applications/framework/application-manager";
import type { ApplicationRegistry } from "../../applications/framework/application-registry";
import type { ApplicationManifest } from "../../applications/framework/application";
import type { Disposable } from "../../core/disposable";
import { toApplicationId } from "../../core/identity/identifiers";

const DRAWER_ID = "application-drawer";
const DRAWER_TITLE_ID = "application-drawer-title";

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
    eyebrow.textContent = "SHADOW OS / INSTALLED";
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
    marker.textContent = markerFor(manifest.name);
    marker.setAttribute("aria-hidden", "true");
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
