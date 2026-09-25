import { describe, expect, it, vi } from "vitest";

import type { ApplicationContext } from "../../src/applications/framework/application";
import { ApplicationManager } from "../../src/applications/framework/application-manager";
import { ApplicationRegistry } from "../../src/applications/framework/application-registry";
import { toApplicationId } from "../../src/core/identity/identifiers";
import { WindowManager } from "../../src/shell/windows/window-manager";
import { FakeIdGenerator } from "../helpers/fake-id-generator";

describe("application and window lifecycle", () => {
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
