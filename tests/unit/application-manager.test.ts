import { describe, expect, it, vi } from "vitest";

import type {
  ApplicationContext,
  ApplicationDefinition,
  ApplicationView,
} from "../../src/applications/framework/application";
import { ApplicationManager } from "../../src/applications/framework/application-manager";
import { ApplicationRegistry } from "../../src/applications/framework/application-registry";
import { toApplicationId, toWindowId } from "../../src/core/identity/identifiers";
import { WindowManager } from "../../src/shell/windows/window-manager";
import { FakeIdGenerator } from "../helpers/fake-id-generator";

const APPLICATION_ID = toApplicationId("system.diagnostics");
const EMPTY_VIEW: ApplicationView = { mount: () => () => undefined };

function createDefinition(dispose = vi.fn()): {
  definition: ApplicationDefinition;
  contexts: ApplicationContext[];
  dispose: ReturnType<typeof vi.fn>;
} {
  const contexts: ApplicationContext[] = [];
  return {
    contexts,
    dispose,
    definition: {
      manifest: {
        id: APPLICATION_ID,
        name: "System Diagnostics",
        description: "Inspect the M2 application contract.",
        window: { title: "System Diagnostics", preferredWidth: 700, preferredHeight: 480 },
      },
      create: (context) => {
        contexts.push(context);
        return { primaryView: EMPTY_VIEW, dispose };
      },
    },
  };
}

function createSystem(definition: ApplicationDefinition): {
  applications: ApplicationManager;
  windows: WindowManager;
} {
  const ids = new FakeIdGenerator();
  const windows = new WindowManager(ids, { x: 0, y: 0, width: 1200, height: 800 });
  const applications = new ApplicationManager(new ApplicationRegistry([definition]), windows, ids);
  return { applications, windows };
}

describe("ApplicationManager", () => {
  it("launches a registered application with a primary window and view", () => {
    const fixture = createDefinition();
    const { applications, windows } = createSystem(fixture.definition);

    const instanceId = applications.launch(APPLICATION_ID);
    const state = applications.snapshot.instances[0];

    expect(instanceId).toBe("application-instance-1");
    expect(state).toMatchObject({ id: instanceId, applicationId: APPLICATION_ID });
    expect(windows.snapshot.windows[0]).toMatchObject({
      id: state?.primaryWindowId,
      ownerId: instanceId,
      title: "System Diagnostics",
    });
    expect(applications.getView(state!.primaryWindowId)).toBe(EMPTY_VIEW);
  });

  it("enforces single-instance launch and restores/focuses the existing primary window", () => {
    const fixture = createDefinition();
    const { applications, windows } = createSystem(fixture.definition);
    const instanceId = applications.launch(APPLICATION_ID);
    const primaryWindowId = applications.snapshot.instances[0]!.primaryWindowId;
    windows.minimize(primaryWindowId);

    expect(applications.launch(APPLICATION_ID)).toBe(instanceId);
    expect(applications.snapshot.instances).toHaveLength(1);
    expect(windows.snapshot.windows[0]?.mode).toBe("normal");
    expect(windows.snapshot.activeWindowId).toBe(primaryWindowId);
    expect(fixture.contexts).toHaveLength(1);
  });

  it("opens and closes an auxiliary window through the scoped application context", () => {
    const fixture = createDefinition();
    const { applications, windows } = createSystem(fixture.definition);
    applications.launch(APPLICATION_ID);

    const auxiliaryId = fixture.contexts[0]!.openWindow({
      title: "Diagnostic Detail",
      view: EMPTY_VIEW,
    });

    expect(applications.snapshot.instances[0]?.windowIds).toHaveLength(2);
    expect(windows.snapshot.windows).toHaveLength(2);
    expect(applications.getView(auxiliaryId)).toBe(EMPTY_VIEW);
    expect(applications.closeWindow(auxiliaryId)).toBe(true);
    expect(applications.snapshot.instances[0]?.windowIds).toHaveLength(1);
    expect(windows.snapshot.windows).toHaveLength(1);
  });

  it("closes all owned windows and disposes exactly once when the primary closes", () => {
    const fixture = createDefinition();
    const { applications, windows } = createSystem(fixture.definition);
    const instanceId = applications.launch(APPLICATION_ID);
    const primaryWindowId = applications.snapshot.instances[0]!.primaryWindowId;
    fixture.contexts[0]!.openWindow({ title: "Diagnostic Detail", view: EMPTY_VIEW });

    expect(applications.closeWindow(primaryWindowId)).toBe(true);
    expect(applications.snapshot.instances).toEqual([]);
    expect(windows.snapshot.windows).toEqual([]);
    expect(fixture.dispose).toHaveBeenCalledTimes(1);
    expect(applications.closeInstance(instanceId)).toBe(false);
  });

  it("resets all application and window state and disposes instances", () => {
    const fixture = createDefinition();
    const { applications, windows } = createSystem(fixture.definition);
    applications.launch(APPLICATION_ID);
    fixture.contexts[0]!.openWindow({ title: "Diagnostic Detail", view: EMPTY_VIEW });

    applications.reset();

    expect(applications.snapshot.instances).toEqual([]);
    expect(windows.snapshot.windows).toEqual([]);
    expect(fixture.dispose).toHaveBeenCalledTimes(1);
  });

  it("returns false for windows and instances it does not own", () => {
    const fixture = createDefinition();
    const { applications } = createSystem(fixture.definition);

    expect(applications.closeWindow(toWindowId("missing"))).toBe(false);
  });
});
