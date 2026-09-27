import { toApplicationId } from "../../core/identity/identifiers";
import type { ApplicationDefinition, ApplicationView } from "../framework/application";
import { NotepadModel } from "./notepad-model";

export const NOTEPAD_APPLICATION_ID = toApplicationId("system.notepad");

export function createNotepadDefinition(): ApplicationDefinition {
  return {
    manifest: {
      id: NOTEPAD_APPLICATION_ID,
      name: "Notes",
      description: "Write and edit temporary session text.",
      window: {
        title: "Notes",
        preferredWidth: 620,
        preferredHeight: 440,
        constraints: { minWidth: 320, minHeight: 240 },
      },
    },
    create: () => {
      const model = new NotepadModel();

      return {
        primaryView: createNotepadView(model),
        dispose: () => model.dispose(),
      };
    },
  };
}

function createNotepadView(model: NotepadModel): ApplicationView {
  return {
    mount(host, document): () => void {
      const content = document.createElement("section");
      content.className = "notepad-app";

      const editor = document.createElement("textarea");
      editor.className = "notepad-app__editor";
      editor.value = model.text;
      editor.placeholder = "Start typing...";
      editor.setAttribute("aria-label", "Notes editor");

      const handleInput = (): void => model.setText(editor.value);
      editor.addEventListener("input", handleInput);
      content.append(editor);
      host.replaceChildren(content);
      editor.focus({ preventScroll: true });

      return () => {
        editor.removeEventListener("input", handleInput);
        host.replaceChildren();
      };
    },
  };
}
