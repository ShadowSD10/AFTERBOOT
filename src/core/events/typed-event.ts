import type { Disposable } from "../disposable";

export type EventListener<TEvent> = (event: Readonly<TEvent>) => void;

export class TypedEvent<TEvent> {
  readonly #listeners = new Set<EventListener<TEvent>>();

  subscribe(listener: EventListener<TEvent>): Disposable {
    this.#listeners.add(listener);

    return () => {
      this.#listeners.delete(listener);
    };
  }

  emit(event: Readonly<TEvent>): void {
    for (const listener of [...this.#listeners]) {
      listener(event);
    }
  }

  clear(): void {
    this.#listeners.clear();
  }
}
