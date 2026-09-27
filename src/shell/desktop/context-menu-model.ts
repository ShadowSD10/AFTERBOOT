export type DesktopContextMenuActionId = "refresh-desktop" | "open-application-drawer";

export interface ContextMenuItem {
  readonly id: DesktopContextMenuActionId;
  readonly label: string;
  readonly symbol: string;
}

export interface OverlayPoint {
  readonly x: number;
  readonly y: number;
}

export interface OverlaySize {
  readonly width: number;
  readonly height: number;
}

export function clampOverlayPosition(
  anchor: OverlayPoint,
  overlay: OverlaySize,
  viewport: OverlaySize,
  margin = 8,
): OverlayPoint {
  const maximumX = Math.max(margin, viewport.width - overlay.width - margin);
  const maximumY = Math.max(margin, viewport.height - overlay.height - margin);

  return Object.freeze({
    x: Math.min(Math.max(margin, anchor.x), maximumX),
    y: Math.min(Math.max(margin, anchor.y), maximumY),
  });
}
