import type {
  ApplicationContext,
  ApplicationDefinition,
  ApplicationView,
} from "../framework/application";
import { toApplicationId } from "../../core/identity/identifiers";

export const SYSTEM_DIAGNOSTICS_APPLICATION_ID = toApplicationId("system.diagnostics");

export function createSystemDiagnosticsDefinition(): ApplicationDefinition {
  return {
    manifest: {
      id: SYSTEM_DIAGNOSTICS_APPLICATION_ID,
      name: "System Diagnostics",
      description: "Inspect application and window lifecycle behavior.",
      window: {
        title: "System Diagnostics",
        preferredWidth: 680,
        preferredHeight: 460,
        constraints: { minWidth: 340, minHeight: 280 },
      },
    },
    create: (context) => ({
      primaryView: createPrimaryView(context),
      dispose: () => undefined,
    }),
  };
}

function createPrimaryView(context: ApplicationContext): ApplicationView {
  let detailCount = 0;

  return {
    mount(host, document): () => void {
      const content = element(document, "section", "diagnostics-app");
      const heading = element(document, "h2", "diagnostics-app__title", "System Diagnostics");
      const status = element(document, "p", "diagnostics-app__status", "APPLICATION ONLINE");
      status.setAttribute("role", "status");
      const facts = element(document, "dl", "diagnostics-app__facts");
      facts.append(
        fact(document, "Application", context.applicationId),
        fact(document, "Instance", context.instanceId),
        fact(document, "Launch policy", "Single instance"),
      );
      const detailButton = element(
        document,
        "button",
        "diagnostics-app__action",
        "Open lifecycle detail",
      );
      detailButton.type = "button";
      const handleDetail = (): void => {
        detailCount += 1;
        context.openWindow({
          title: `Lifecycle Detail ${detailCount.toString().padStart(2, "0")}`,
          preferredWidth: 440,
          preferredHeight: 300,
          constraints: { minWidth: 300, minHeight: 220 },
          view: createDetailView(context, detailCount),
        });
      };
      detailButton.addEventListener("click", handleDetail);
      content.append(heading, status, facts, detailButton);
      host.replaceChildren(content);

      return () => {
        detailButton.removeEventListener("click", handleDetail);
        host.replaceChildren();
      };
    },
  };
}

function createDetailView(context: ApplicationContext, detailNumber: number): ApplicationView {
  return {
    mount(host, document): () => void {
      const content = element(document, "section", "diagnostics-detail");
      content.append(
        element(document, "p", "diagnostics-detail__eyebrow", "WINDOW LIFECYCLE TRACE"),
        element(
          document,
          "h2",
          "diagnostics-detail__title",
          `Detail ${detailNumber.toString().padStart(2, "0")}`,
        ),
        element(
          document,
          "p",
          "diagnostics-detail__copy",
          `Owned by ${context.instanceId}. This auxiliary window proves one application instance can coordinate multiple windows.`,
        ),
      );
      host.replaceChildren(content);
      return () => host.replaceChildren();
    },
  };
}

function fact(document: Document, term: string, value: string): HTMLElement {
  const group = element(document, "div", "diagnostics-app__fact");
  group.append(
    element(document, "dt", "diagnostics-app__term", term),
    element(document, "dd", "diagnostics-app__value", value),
  );
  return group;
}

function element<K extends keyof HTMLElementTagNameMap>(
  document: Document,
  tagName: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tagName);
  node.className = className;
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
}
