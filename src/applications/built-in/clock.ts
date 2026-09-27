import type { Clock } from "../../core/time/clock";
import { toApplicationId } from "../../core/identity/identifiers";
import type { SystemTime } from "../../shell/system-time";
import type { ApplicationDefinition, ApplicationView } from "../framework/application";
import { ClockModel } from "./clock-model";

export const CLOCK_APPLICATION_ID = toApplicationId("system.clock");

export function createClockDefinition(clock: Clock): ApplicationDefinition {
  return {
    manifest: {
      id: CLOCK_APPLICATION_ID,
      name: "Clock",
      description: "View the current local time and date.",
      window: {
        title: "Clock",
        preferredWidth: 440,
        preferredHeight: 300,
        constraints: { minWidth: 300, minHeight: 240 },
      },
    },
    create: () => {
      const model = new ClockModel(clock);

      return {
        primaryView: createClockView(model),
        dispose: () => model.dispose(),
      };
    },
  };
}

function createClockView(model: ClockModel): ApplicationView {
  return {
    mount(host, document): () => void {
      const content = document.createElement("section");
      content.className = "clock-app";

      const face = document.createElement("div");
      face.className = "clock-app__face";

      const time = document.createElement("time");
      time.className = "clock-app__time";

      const date = document.createElement("time");
      date.className = "clock-app__date";

      const render = (snapshot: SystemTime): void => {
        if (time.textContent !== snapshot.time) {
          time.textContent = snapshot.time;
        }
        time.dateTime = snapshot.iso;
        time.setAttribute("aria-label", `Current time: ${snapshot.time}`);

        if (date.textContent !== snapshot.date) {
          date.textContent = snapshot.date;
        }
        date.dateTime = snapshot.date.replaceAll(".", "-");
        date.setAttribute("aria-label", `Current date: ${snapshot.date}`);
      };

      face.append(time, date);
      content.append(face);
      host.replaceChildren(content);
      render(model.snapshot);
      const unsubscribe = model.subscribe(render);

      return () => {
        unsubscribe();
        host.replaceChildren();
      };
    },
  };
}
