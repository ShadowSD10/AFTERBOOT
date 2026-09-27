export class NotepadModel {
  #text = "";

  get text(): string {
    return this.#text;
  }

  setText(text: string): void {
    this.#text = text;
  }

  dispose(): void {
    this.#text = "";
  }
}
