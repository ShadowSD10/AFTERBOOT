import { describe, expect, it, vi } from "vitest";

import {
  CALCULATOR_APPLICATION_ID,
  createCalculatorDefinition,
} from "../../src/applications/built-in/calculator";
import { CLOCK_APPLICATION_ID, createClockDefinition } from "../../src/applications/built-in/clock";
import {
  createNotepadDefinition,
  NOTEPAD_APPLICATION_ID,
} from "../../src/applications/built-in/notepad";
import type { ApplicationContext } from "../../src/applications/framework/application";
import { ApplicationManager } from "../../src/applications/framework/application-manager";
import { ApplicationRegistry } from "../../src/applications/framework/application-registry";
import { toApplicationId } from "../../src/core/identity/identifiers";
import { WindowManager } from "../../src/shell/windows/window-manager";
import { FakeIdGenerator } from "../helpers/fake-id-generator";
import { FakeClock } from "../helpers/fake-clock";

describe("application and window lifecycle", () => {
  it("registers Clock and gives closed or reset launches fresh instances", () => {
    const registry = new ApplicationRegistry([createClockDefinition(new FakeClock())]);
    const ids = new FakeIdGenerator();
    const windows = new WindowManager(ids, { x: 0, y: 0, width: 1000, height: 700 });
    const applications = new ApplicationManager(registry, windows, ids);

    expect(registry.list().map((manifest) => manifest.name)).toEqual(["Clock"]);

    const firstInstanceId = applications.launch(CLOCK_APPLICATION_ID);
    const firstWindowId = applications.snapshot.instances[0]!.primaryWindowId;

    expect(applications.launch(CLOCK_APPLICATION_ID)).toBe(firstInstanceId);
    expect(applications.snapshot.instances).toHaveLength(1);
    expect(windows.snapshot.windows[0]).toMatchObject({ id: firstWindowId, title: "Clock" });

    expect(applications.closeWindow(firstWindowId)).toBe(true);
    expect(applications.snapshot.instances).toEqual([]);
    expect(windows.snapshot.windows).toEqual([]);

    const secondInstanceId = applications.launch(CLOCK_APPLICATION_ID);
    expect(secondInstanceId).not.toBe(firstInstanceId);

    applications.reset();
    expect(applications.snapshot.instances).toEqual([]);
    expect(windows.snapshot.windows).toEqual([]);
  });

  it("registers Calculator and gives closed or reset launches fresh instances", () => {
    const registry = new ApplicationRegistry([createCalculatorDefinition()]);
    const ids = new FakeIdGenerator();
    const windows = new WindowManager(ids, { x: 0, y: 0, width: 1000, height: 700 });
    const applications = new ApplicationManager(registry, windows, ids);

    expect(registry.list().map((manifest) => manifest.name)).toEqual(["Calculator"]);

    const firstInstanceId = applications.launch(CALCULATOR_APPLICATION_ID);
    const firstWindowId = applications.snapshot.instances[0]!.primaryWindowId;

    expect(applications.launch(CALCULATOR_APPLICATION_ID)).toBe(firstInstanceId);
    expect(applications.snapshot.instances).toHaveLength(1);
    expect(windows.snapshot.windows[0]).toMatchObject({
      id: firstWindowId,
      title: "Calculator",
    });

    expect(applications.closeWindow(firstWindowId)).toBe(true);
    expect(applications.snapshot.instances).toEqual([]);
    expect(windows.snapshot.windows).toEqual([]);

    const secondInstanceId = applications.launch(CALCULATOR_APPLICATION_ID);
    expect(secondInstanceId).not.toBe(firstInstanceId);

    applications.reset();
    expect(applications.snapshot.instances).toEqual([]);
    expect(windows.snapshot.windows).toEqual([]);
  });

  it("registers Notepad and gives each closed or reset lifecycle a fresh instance", () => {
    const registry = new ApplicationRegistry([createNotepadDefinition()]);
    const ids = new FakeIdGenerator();
    const windows = new WindowManager(ids, { x: 0, y: 0, width: 1000, height: 700 });
    const applications = new ApplicationManager(registry, windows, ids);

    expect(registry.list().map((manifest) => manifest.name)).toEqual(["Notes"]);

    const firstInstanceId = applications.launch(NOTEPAD_APPLICATION_ID);
    const firstWindowId = applications.snapshot.instances[0]!.primaryWindowId;

    expect(applications.launch(NOTEPAD_APPLICATION_ID)).toBe(firstInstanceId);
    expect(applications.snapshot.instances).toHaveLength(1);
    expect(windows.snapshot.windows[0]).toMatchObject({
      id: firstWindowId,
      title: "Notes",
    });

    expect(applications.closeWindow(firstWindowId)).toBe(true);
    expect(applications.snapshot.instances).toEqual([]);
    expect(windows.snapshot.windows).toEqual([]);

    const secondInstanceId = applications.launch(NOTEPAD_APPLICATION_ID);
    expect(secondInstanceId).not.toBe(firstInstanceId);

    applications.reset();
    expect(applications.snapshot.instances).toEqual([]);
    expect(windows.snapshot.windows).toEqual([]);
  });

  it("launches the registry catalog through the manager without duplicating an instance", () => {
    const applicationId = toApplicationId("system.diagnostics");
    const registry = new ApplicationRegistry([
      {
        manifest: {
          id: applicationId,
          name: "System Diagnostics",
          description: "Inspect the M2 application contract.",
          window: { title: "System Diagnostics" },
        },
        create: () => ({
          primaryView: { mount: () => () => undefined },
          dispose: () => undefined,
        }),
      },
    ]);
    const ids = new FakeIdGenerator();
    const windows = new WindowManager(ids, { x: 0, y: 0, width: 1000, height: 700 });
    const applications = new ApplicationManager(registry, windows, ids);
    const installedApplicationId = registry.list()[0]!.id;

    expect(windows.snapshot.windows).toEqual([]);
    const instanceId = applications.launch(installedApplicationId);

    expect(applications.launch(installedApplicationId)).toBe(instanceId);
    expect(applications.snapshot.instances).toHaveLength(1);
    expect(windows.snapshot.windows).toHaveLength(1);
  });

  it("coordinates startup registration, launch, multiple windows, relaunch, and close", () => {
    const applicationId = toApplicationId("system.diagnostics");
    const dispose = vi.fn();
    let context: ApplicationContext | undefined;
    const registry = new ApplicationRegistry([
      {
        manifest: {
          id: applicationId,
          name: "System Diagnostics",
          description: "Inspect the M2 application contract.",
          window: { title: "System Diagnostics" },
        },
        create: (createdContext) => {
          context = createdContext;
          return {
            primaryView: { mount: () => () => undefined },
            dispose,
          };
        },
      },
    ]);
    const ids = new FakeIdGenerator();
    const windows = new WindowManager(ids, { x: 0, y: 0, width: 1000, height: 700 });
    const applications = new ApplicationManager(registry, windows, ids);

    const instanceId = applications.launch(applicationId);
    const detailWindowId = context!.openWindow({
      title: "Lifecycle Detail",
      view: { mount: () => () => undefined },
    });
    windows.focus(applications.snapshot.instances[0]!.primaryWindowId);

    expect(applications.launch(applicationId)).toBe(instanceId);
    expect(applications.snapshot.instances).toHaveLength(1);
    expect(windows.snapshot.windows).toHaveLength(2);
    expect(applications.closeWindow(detailWindowId)).toBe(true);
    expect(windows.snapshot.windows).toHaveLength(1);
    expect(applications.closeInstance(instanceId)).toBe(true);
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(applications.snapshot.instances).toEqual([]);
    expect(windows.snapshot.windows).toEqual([]);
  });
});
