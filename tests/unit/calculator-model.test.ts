import { describe, expect, it } from "vitest";

import {
  CalculatorModel,
  type CalculatorOperator,
} from "../../src/applications/built-in/calculator-model";

function enter(model: CalculatorModel, value: string): void {
  for (const character of value) {
    if (character === ".") {
      model.inputDecimal();
    } else {
      model.inputDigit(character);
    }
  }
}

function calculate(left: string, operator: CalculatorOperator, right: string): CalculatorModel {
  const model = new CalculatorModel();
  enter(model, left);
  model.chooseOperator(operator);
  enter(model, right);
  model.equals();
  return model;
}

describe("CalculatorModel", () => {
  it("starts at zero and accepts multi-digit input", () => {
    const model = new CalculatorModel();

    expect(model.display).toBe("0");
    expect(model.hasError).toBe(false);
    expect(model.pendingOperation).toBeNull();

    enter(model, "1205");
    expect(model.display).toBe("1205");
  });

  it("accepts one decimal point and normalizes leading decimals", () => {
    const model = new CalculatorModel();

    enter(model, ".125.5");

    expect(model.display).toBe("0.1255");
  });

  it.each([
    ["addition", "add", "12", "5", "17"],
    ["subtraction", "subtract", "12", "5", "7"],
    ["multiplication", "multiply", "12", "5", "60"],
    ["division", "divide", "12", "5", "2.4"],
  ] as const)("performs %s", (_name, operator, left, right, expected) => {
    expect(calculate(left, operator, right).display).toBe(expected);
  });

  it("evaluates chained operations immediately from left to right", () => {
    const model = new CalculatorModel();
    enter(model, "12");
    model.chooseOperator("add");
    enter(model, "5");
    model.chooseOperator("multiply");
    enter(model, "2");
    model.equals();

    expect(model.display).toBe("34");
  });

  it("produces negative results", () => {
    expect(calculate("5", "subtract", "12").display).toBe("-7");
  });

  it("clears all calculation state", () => {
    const model = calculate("9", "add", "4");

    model.clear();
    model.inputDigit("2");
    model.equals();

    expect(model.display).toBe("2");
    expect(model.hasError).toBe(false);
  });

  it("backspaces only the current input", () => {
    const model = new CalculatorModel();
    enter(model, "123");

    model.backspace();
    expect(model.display).toBe("12");
    model.backspace();
    model.backspace();
    expect(model.display).toBe("0");
  });

  it("replaces a pending operator deterministically", () => {
    const model = new CalculatorModel();
    enter(model, "8");
    model.chooseOperator("add");
    model.chooseOperator("multiply");
    enter(model, "3");
    model.equals();

    expect(model.display).toBe("24");
  });

  it.each([
    ["add", "12"],
    ["subtract", "12"],
    ["multiply", "12"],
    ["divide", "12"],
  ] as const)("exposes the stored operand and pending %s operation", (operator, operand) => {
    const model = new CalculatorModel();
    enter(model, operand);

    model.chooseOperator(operator);

    expect(model.pendingOperation).toEqual({ operand, operator });
  });

  it("projects operator replacement without evaluating prematurely", () => {
    const model = new CalculatorModel();
    enter(model, "12");
    model.chooseOperator("add");

    model.chooseOperator("multiply");

    expect(model.display).toBe("12");
    expect(model.pendingOperation).toEqual({ operand: "12", operator: "multiply" });
  });

  it("clears the pending projection on clear, equals, and errors", () => {
    const model = new CalculatorModel();
    enter(model, "12");
    model.chooseOperator("add");
    model.clear();
    expect(model.pendingOperation).toBeNull();

    enter(model, "12");
    model.chooseOperator("add");
    enter(model, "5");
    model.equals();
    expect(model.pendingOperation).toBeNull();

    model.clear();
    enter(model, "9");
    model.chooseOperator("divide");
    enter(model, "0");
    model.equals();
    expect(model.pendingOperation).toBeNull();
  });

  it("repeats the last equals operation", () => {
    const model = calculate("2", "add", "3");

    model.equals();
    expect(model.display).toBe("8");
    model.equals();
    expect(model.display).toBe("11");
  });

  it("enters an error state on division by zero and recovers with numeric input", () => {
    const model = calculate("9", "divide", "0");

    expect(model.display).toBe("ERROR");
    expect(model.hasError).toBe(true);

    model.inputDigit("4");
    expect(model.display).toBe("4");
    expect(model.hasError).toBe(false);
  });

  it("recovers from an error through clear", () => {
    const model = calculate("1", "divide", "0");

    model.clear();

    expect(model.display).toBe("0");
    expect(model.hasError).toBe(false);
  });

  it("caps direct input and formats large results without overflowing the display", () => {
    const model = new CalculatorModel();
    enter(model, "123456789012345");
    expect(model.display).toBe("123456789012");

    model.chooseOperator("multiply");
    enter(model, "999999999999");
    model.equals();

    expect(model.display.length).toBeLessThanOrEqual(16);
    expect(model.display).toMatch(/e\+/);
  });

  it("clears temporary state when disposed", () => {
    const model = calculate("7", "multiply", "6");

    model.dispose();

    expect(model.display).toBe("0");
    expect(model.hasError).toBe(false);
  });
});
