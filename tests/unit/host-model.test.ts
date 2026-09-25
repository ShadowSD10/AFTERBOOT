import { describe, expect, it } from "vitest";

import { createInitialHostModel } from "../../src/bootstrap/host-model";

describe("createInitialHostModel", () => {
  it("describes the initial AFTERBOOT preparation state", () => {
    const model = createInitialHostModel();

    expect(model).toEqual({
      productName: "AFTERBOOT",
      systemName: "SHADOW OS",
      phase: "preparing",
      statusMessage: "System environment is being prepared",
    });
    expect(Object.isFrozen(model)).toBe(true);
  });
});
