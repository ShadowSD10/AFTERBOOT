import type { Disposable } from "../../core/disposable";
import {
  clampOverlayPosition,
  type ContextMenuItem,
  type DesktopContextMenuActionId,
} from "./context-menu-model";

export type ContextMenuActionHandler = (
  actionId: DesktopContextMenuActionId,
  invoker: HTMLElement | null,
) => void;

export class ContextMenuView {
  readonly element: HTMLElement;
  readonly #document: Document;
  readonly #browserWindow: Window;
  readonly #onAction: ContextMenuActionHandler;
  #invoker: HTMLElement | null = null;

  constructor(
    document: Document,
    browserWindow: Window,
    items: readonly ContextMenuItem[],
    onAction: ContextMenuActionHandler,
  ) {
    this.#document = document;
    this.#browserWindow = browserWindow;
    this.#onAction = onAction;

    this.element = document.createElement("div");
    this.element.className = "desktop-context-menu";
    this.element.hidden = true;
    this.element.setAttribute("role", "menu");
    this.element.setAttribute("aria-label", "Desktop actions");
    this.element.append(...items.map((item) => this.#item(item)));
  }

  get isOpen(): boolean {
    return !this.element.hidden;
  }

  mount(): Disposable {
    this.element.addEventListener("click", this.#handleClick);
    this.element.addEventListener("keydown", this.#handleKeyDown);
    this.#document.addEventListener("pointerdown", this.#handleDocumentPointerDown);

    return () => {
      this.element.removeEventListener("click", this.#handleClick);
      this.element.removeEventListener("keydown", this.#handleKeyDown);
      this.#document.removeEventListener("pointerdown", this.#handleDocumentPointerDown);
      this.close(false);
    };
  }

  open(anchorX: number, anchorY: number, invoker: HTMLElement | null): void {
    this.#invoker = invoker;
    this.element.hidden = false;
    this.element.style.left = `${anchorX}px`;
    this.element.style.top = `${anchorY}px`;

    const bounds = this.element.getBoundingClientRect();
    const position = clampOverlayPosition(
      { x: anchorX, y: anchorY },
      { width: bounds.width, height: bounds.height },
      { width: this.#browserWindow.innerWidth, height: this.#browserWindow.innerHeight },
    );
    this.element.style.left = `${position.x}px`;
    this.element.style.top = `${position.y}px`;
    this.#focusItem(0);
  }

  close(restoreFocus = true): void {
    if (!this.isOpen) {
      return;
    }

    const invoker = this.#invoker;
    this.element.hidden = true;
    this.#invoker = null;
    if (restoreFocus && invoker?.isConnected) {
      invoker.focus({ preventScroll: true });
    }
  }

  #item(item: ContextMenuItem): HTMLButtonElement {
    const button = this.#document.createElement("button");
    button.className = "desktop-context-menu__item";
    button.type = "button";
    button.tabIndex = -1;
    button.dataset.contextAction = item.id;
    button.setAttribute("role", "menuitem");
    button.textContent = item.label;
    return button;
  }

  #items(): HTMLButtonElement[] {
    return [...this.element.querySelectorAll<HTMLButtonElement>("[role='menuitem']")];
  }

  #focusItem(index: number): void {
    const items = this.#items();
    const item = items[index];
    if (!item) {
      return;
    }

    for (const candidate of items) {
      candidate.tabIndex = candidate === item ? 0 : -1;
    }
    item.focus({ preventScroll: true });
  }

  readonly #handleClick = (event: MouseEvent): void => {
    const target = event.target instanceof Element ? event.target : null;
    const actionId = target?.closest<HTMLElement>("[data-context-action]")?.dataset
      .contextAction as DesktopContextMenuActionId | undefined;
    if (!actionId) {
      return;
    }

    const invoker = this.#invoker;
    this.close(false);
    this.#onAction(actionId, invoker);
  };

  readonly #handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape" || event.key === "Tab") {
      event.preventDefault();
      this.close();
      return;
    }

    const items = this.#items();
    const currentIndex = items.indexOf(this.#document.activeElement as HTMLButtonElement);
    let nextIndex: number | null = null;

    switch (event.key) {
      case "ArrowDown":
        nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % items.length;
        break;
      case "ArrowUp":
        nextIndex =
          currentIndex < 0 ? items.length - 1 : (currentIndex - 1 + items.length) % items.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = items.length - 1;
        break;
    }

    if (nextIndex !== null && items[nextIndex]) {
      event.preventDefault();
      this.#focusItem(nextIndex);
    }
  };

  readonly #handleDocumentPointerDown = (event: PointerEvent): void => {
    const target = event.target;
    if (this.isOpen && target instanceof Node && !this.element.contains(target)) {
      this.close(false);
    }
  };
}
