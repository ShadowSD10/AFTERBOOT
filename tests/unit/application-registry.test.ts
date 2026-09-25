import { describe, expect, it } from "vitest";

import type { ApplicationDefinition } from "../../src/applications/framework/application";
import {
  ApplicationRegistry,
  DuplicateApplicationError,
  UnknownApplicationError,
} from "../../src/applications/framework/application-registry";
import { toApplicationId } from "../../src/core/identity/identifiers";

const APPLICATION_ID = toApplicationId("system.diagnostics");

function definition(name = "System Diagnostics"): ApplicationDefinition {
  return {
    manifest: {
      id: APPLICATION_ID,
      name,
      description: "Inspect the M2 application contract.",
      window: { title: "System Diagnostics" },
    },
    create: () => ({ primaryView: { mount: () => () => undefined }, dispose: () => undefined }),
  };
}

describe("ApplicationRegistry", () => {
  it("lists and resolves immutable startup definitions", () => {
    const source = definition();
    const registry = new ApplicationRegistry([source]);

    expect(registry.list()).toEqual([source.manifest]);
    expect(registry.get(APPLICATION_ID).manifest.name).toBe("System Diagnostics");
    expect(Object.isFrozen(registry.list())).toBe(true);
    expect(Object.isFrozen(registry.get(APPLICATION_ID).manifest)).toBe(true);
  });

  it("rejects duplicate application identifiers", () => {
    expect(() => new ApplicationRegistry([definition(), definition("Duplicate")])).toThrow(
      DuplicateApplicationError,
    );
  });

  it("rejects unknown application identifiers", () => {
    const registry = new ApplicationRegistry([definition()]);

    expect(() => registry.get(toApplicationId("missing"))).toThrow(UnknownApplicationError);
  });
});
