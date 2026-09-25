import "./styles/main.css";
import "./styles/windows.css";
import {
  renderStartupFailure,
  startAfterboot,
  type AfterbootApplication,
} from "./bootstrap/start-afterboot";

let startupHasFailed = false;
let application: AfterbootApplication | null = null;

function handleStartupFailure(error: unknown): void {
  if (startupHasFailed) {
    return;
  }

  startupHasFailed = true;
  console.error("AFTERBOOT startup failed.", error);

  if (application) {
    application.runtime.fail(error);
  } else {
    renderStartupFailure(document);
  }
}

window.addEventListener("error", (event) => handleStartupFailure(event.error));
window.addEventListener("unhandledrejection", (event) => handleStartupFailure(event.reason));

try {
  application = startAfterboot(document, window);
} catch (error: unknown) {
  handleStartupFailure(error);
}
