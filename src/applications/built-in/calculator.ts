import { toApplicationId } from "../../core/identity/identifiers";
import type { ApplicationDefinition, ApplicationView } from "../framework/application";
import { CalculatorModel, type CalculatorOperator } from "./calculator-model";

export const CALCULATOR_APPLICATION_ID = toApplicationId("system.calculator");

interface CalculatorKey {
  readonly label: string;
  readonly name: string;
  readonly command: string;
  readonly kind: "digit" | "operator" | "utility" | "equals";
  readonly shortcuts?: string;
}

const CALCULATOR_KEYS: readonly CalculatorKey[] = [
  { label: "C", name: "Clear", command: "clear", kind: "utility", shortcuts: "Escape C" },
  {
    label: "DEL",
    name: "Backspace",
    command: "backspace",
    kind: "utility",
    shortcuts: "Backspace Delete",
  },
  { label: "÷", name: "Divide", command: "operator:divide", kind: "operator", shortcuts: "/" },
  {
    label: "×",
    name: "Multiply",
    command: "operator:multiply",
    kind: "operator",
    shortcuts: "*",
  },
  { label: "7", name: "7", command: "digit:7", kind: "digit" },
  { label: "8", name: "8", command: "digit:8", kind: "digit" },
  { label: "9", name: "9", command: "digit:9", kind: "digit" },
  {
    label: "−",
    name: "Subtract",
    command: "operator:subtract",
    kind: "operator",
    shortcuts: "-",
  },
  { label: "4", name: "4", command: "digit:4", kind: "digit" },
  { label: "5", name: "5", command: "digit:5", kind: "digit" },
  { label: "6", name: "6", command: "digit:6", kind: "digit" },
  { label: "+", name: "Add", command: "operator:add", kind: "operator", shortcuts: "+" },
  { label: "1", name: "1", command: "digit:1", kind: "digit" },
  { label: "2", name: "2", command: "digit:2", kind: "digit" },
  { label: "3", name: "3", command: "digit:3", kind: "digit" },
  { label: "=", name: "Equals", command: "equals", kind: "equals", shortcuts: "Enter =" },
  { label: "0", name: "0", command: "digit:0", kind: "digit" },
  { label: ".", name: "Decimal point", command: "decimal", kind: "digit", shortcuts: "." },
];

export function createCalculatorDefinition(): ApplicationDefinition {
  return {
    manifest: {
      id: CALCULATOR_APPLICATION_ID,
      name: "Calculator",
      description: "Perform basic four-operation arithmetic.",
      window: {
        title: "Calculator",
        preferredWidth: 350,
        preferredHeight: 480,
        constraints: { minWidth: 300, minHeight: 390 },
      },
    },
    create: () => {
      const model = new CalculatorModel();

      return {
        primaryView: createCalculatorView(model),
        dispose: () => model.dispose(),
      };
    },
  };
}

function createCalculatorView(model: CalculatorModel): ApplicationView {
  return {
    mount(host, document): () => void {
      const content = document.createElement("section");
      content.className = "calculator-app";
      content.tabIndex = 0;
      content.setAttribute("aria-label", "Calculator keyboard input");

      const header = document.createElement("header");
      header.className = "calculator-app__header";
      const identity = document.createElement("span");
      identity.textContent = "SHADOW / CALCULATOR";
      const mode = document.createElement("span");
      mode.textContent = "4-OP";
      header.append(identity, mode);

      const display = document.createElement("output");
      display.className = "calculator-app__display";
      display.setAttribute("aria-label", "Calculator display");
      display.setAttribute("aria-live", "polite");
      display.setAttribute("aria-atomic", "true");

      const keypad = document.createElement("div");
      keypad.className = "calculator-app__keypad";
      keypad.setAttribute("aria-label", "Calculator keypad");
      keypad.append(...CALCULATOR_KEYS.map((key) => createKey(document, key)));

      const render = (): void => {
        display.textContent = model.display;
        display.dataset.state = model.hasError ? "error" : "ready";
      };
      const runCommand = (command: string): void => {
        applyCommand(model, command);
        render();
      };
      const handleClick = (event: MouseEvent): void => {
        const target = event.target instanceof Element ? event.target : null;
        const button = target?.closest<HTMLButtonElement>("[data-calculator-command]");
        if (button && keypad.contains(button)) {
          runCommand(button.dataset.calculatorCommand ?? "");
        }
      };
      const handleKeyDown = (event: KeyboardEvent): void => {
        const command = keyboardCommand(event);
        if (command === null) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        runCommand(command);
      };

      keypad.addEventListener("click", handleClick);
      content.addEventListener("keydown", handleKeyDown);
      content.append(header, display, keypad);
      host.replaceChildren(content);
      render();
      content.focus({ preventScroll: true });

      return () => {
        keypad.removeEventListener("click", handleClick);
        content.removeEventListener("keydown", handleKeyDown);
        host.replaceChildren();
      };
    },
  };
}

function createKey(document: Document, key: CalculatorKey): HTMLButtonElement {
  const button = document.createElement("button");
  button.className = `calculator-app__key calculator-app__key--${key.kind}`;
  button.type = "button";
  button.textContent = key.label;
  button.dataset.calculatorCommand = key.command;
  button.setAttribute("aria-label", key.name);
  if (key.shortcuts !== undefined) {
    button.setAttribute("aria-keyshortcuts", key.shortcuts);
  }
  return button;
}

function keyboardCommand(event: KeyboardEvent): string | null {
  if (event.key === "Enter" && event.target instanceof HTMLButtonElement) {
    return null;
  }
  if (/^\d$/.test(event.key)) {
    return `digit:${event.key}`;
  }

  switch (event.key) {
    case ".":
      return "decimal";
    case "+":
      return "operator:add";
    case "-":
      return "operator:subtract";
    case "*":
      return "operator:multiply";
    case "/":
      return "operator:divide";
    case "Enter":
    case "=":
      return "equals";
    case "Escape":
    case "c":
    case "C":
      return "clear";
    case "Backspace":
    case "Delete":
      return "backspace";
    default:
      return null;
  }
}

function applyCommand(model: CalculatorModel, command: string): void {
  if (command.startsWith("digit:")) {
    model.inputDigit(command.slice(-1));
    return;
  }
  if (command.startsWith("operator:")) {
    model.chooseOperator(command.slice("operator:".length) as CalculatorOperator);
    return;
  }

  switch (command) {
    case "decimal":
      model.inputDecimal();
      break;
    case "equals":
      model.equals();
      break;
    case "clear":
      model.clear();
      break;
    case "backspace":
      model.backspace();
      break;
  }
}
