export function prefersReducedMotion(browserWindow: Window): boolean {
  return browserWindow.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
