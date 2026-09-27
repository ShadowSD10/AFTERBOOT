import { describe, expect, it } from "vitest";

import { NotepadModel } from "../../src/applications/built-in/notepad-model";

describe("NotepadModel", () => {
  it("starts blank and retains multiline edits for the running instance", () => {
    const model = new NotepadModel();

    expect(model.text).toBe("");

    model.setText("First line\nSecond line");
    expect(model.text).toBe("First line\nSecond line");

    model.setText("Revised text");
    expect(model.text).toBe("Revised text");
  });

  it("clears its temporary text when disposed", () => {
    const model = new NotepadModel();
    model.setText("Temporary session text");

    model.dispose();

    expect(model.text).toBe("");
  });
});
