import "./styles/main.css";
import { renderStartupFailure, startAfterboot } from "./bootstrap/start-afterboot";

let startupHasFailed = false;

function handleStartupFailure(error: unknown): void {
  if (startupHasFailed) {
    return;
  }

  startupHasFailed = true;
  console.error("AFTERBOOT startup failed.", error);
  renderStartupFailure(document);
}

window.addEventListener("error", (event) => handleStartupFailure(event.error));
window.addEventListener("unhandledrejection", (event) => handleStartupFailure(event.reason));

try {
  startAfterboot(document);
} catch (error: unknown) {
  handleStartupFailure(error);
}
