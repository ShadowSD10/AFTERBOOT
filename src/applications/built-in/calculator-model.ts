export type CalculatorOperator = "add" | "subtract" | "multiply" | "divide";

const ERROR_DISPLAY = "ERROR";
const MAX_ENTRY_LENGTH = 12;
const MAX_DISPLAY_LENGTH = 16;
const MAX_SIGNIFICANT_DIGITS = 12;

export class CalculatorModel {
  #display = "0";
  #accumulator: number | null = null;
  #pendingOperator: CalculatorOperator | null = null;
  #replaceDisplay = false;
  #lastOperator: CalculatorOperator | null = null;
  #lastOperand: number | null = null;
  #hasError = false;

  get display(): string {
    return this.#display;
  }

  get hasError(): boolean {
    return this.#hasError;
  }

  inputDigit(digit: string): void {
    if (!/^\d$/.test(digit)) {
      throw new RangeError(`Calculator digit must be between 0 and 9: ${digit}`);
    }

    this.#recoverForNumericInput();
    this.#clearRepeatedOperation();

    if (this.#replaceDisplay || this.#display === "0") {
      this.#display = digit;
      this.#replaceDisplay = false;
      return;
    }

    if (this.#display.length < MAX_ENTRY_LENGTH) {
      this.#display += digit;
    }
  }

  inputDecimal(): void {
    this.#recoverForNumericInput();
    this.#clearRepeatedOperation();

    if (this.#replaceDisplay) {
      this.#display = "0.";
      this.#replaceDisplay = false;
      return;
    }

    if (!this.#display.includes(".") && this.#display.length < MAX_ENTRY_LENGTH) {
      this.#display += ".";
    }
  }

  chooseOperator(operator: CalculatorOperator): void {
    if (this.#hasError) {
      return;
    }

    const currentValue = Number(this.#display);

    if (this.#pendingOperator !== null && !this.#replaceDisplay) {
      const result = this.#calculate(this.#accumulator ?? currentValue, currentValue);
      if (result === null) {
        return;
      }
      this.#accumulator = result;
    } else if (this.#pendingOperator === null) {
      this.#accumulator = currentValue;
    }

    this.#pendingOperator = operator;
    this.#replaceDisplay = true;
    this.#clearRepeatedOperation();
  }

  equals(): void {
    if (this.#hasError) {
      return;
    }

    const currentValue = Number(this.#display);

    if (this.#pendingOperator !== null) {
      const operator = this.#pendingOperator;
      const result = this.#calculate(this.#accumulator ?? currentValue, currentValue);
      if (result === null) {
        return;
      }
      this.#pendingOperator = null;
      this.#accumulator = null;
      this.#lastOperator = operator;
      this.#lastOperand = currentValue;
      this.#replaceDisplay = true;
      return;
    }

    if (this.#lastOperator !== null && this.#lastOperand !== null) {
      this.#calculate(currentValue, this.#lastOperand);
      this.#replaceDisplay = true;
      return;
    }

    this.#replaceDisplay = true;
  }

  backspace(): void {
    if (this.#hasError || this.#replaceDisplay) {
      return;
    }

    if (
      this.#display.length === 1 ||
      (this.#display.startsWith("-") && this.#display.length === 2)
    ) {
      this.#display = "0";
      return;
    }

    this.#display = this.#display.slice(0, -1);
  }

  clear(): void {
    this.#display = "0";
    this.#accumulator = null;
    this.#pendingOperator = null;
    this.#replaceDisplay = false;
    this.#clearRepeatedOperation();
    this.#hasError = false;
  }

  dispose(): void {
    this.clear();
  }

  #recoverForNumericInput(): void {
    if (this.#hasError) {
      this.clear();
    }
  }

  #clearRepeatedOperation(): void {
    this.#lastOperator = null;
    this.#lastOperand = null;
  }

  #calculate(left: number, right: number): number | null {
    let result: number;

    switch (this.#pendingOperator ?? this.#lastOperator) {
      case "add":
        result = left + right;
        break;
      case "subtract":
        result = left - right;
        break;
      case "multiply":
        result = left * right;
        break;
      case "divide":
        if (right === 0) {
          this.#enterError();
          return null;
        }
        result = left / right;
        break;
      default:
        return null;
    }

    if (!Number.isFinite(result)) {
      this.#enterError();
      return null;
    }

    this.#display = formatResult(result);
    return result;
  }

  #enterError(): void {
    this.#display = ERROR_DISPLAY;
    this.#accumulator = null;
    this.#pendingOperator = null;
    this.#replaceDisplay = true;
    this.#clearRepeatedOperation();
    this.#hasError = true;
  }
}

function formatResult(value: number): string {
  const normalized = Number.parseFloat(value.toPrecision(MAX_SIGNIFICANT_DIGITS));
  const plain = normalized.toString();

  if (plain.length <= MAX_DISPLAY_LENGTH) {
    return plain;
  }

  return normalized
    .toExponential(8)
    .replace(/\.0+e/, "e")
    .replace(/(\.\d*?)0+e/, "$1e");
}
