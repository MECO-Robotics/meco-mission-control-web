import { Children, Fragment, isValidElement, type ReactNode } from "react";

export type SearchCompactMode = "compact" | "full" | "icon";

export type SearchCollisionMode = "auto" | "fixed";

export type SearchCompactModeChangeDetail = {
  widthPx: number;
  blockers: number;
};

export const DEFAULT_COLLISION_PADDING_PX = 8;
export const DEFAULT_COLLISION_BIAS_PX = 16;
export const ACTION_BUTTON_WIDTH_PX = 32;

export function countActionNodes(actions: ReactNode): number {
  let count = 0;

  Children.forEach(actions, (child) => {
    if (child === null || child === undefined || typeof child === "boolean") {
      return;
    }

    if (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) {
      count += countActionNodes(child.props.children);
      return;
    }

    count += 1;
  });

  return count;
}

export function clampSearchMode(
  currentMode: SearchCompactMode,
  availableWidthPx: number,
  fullLabelWidthPx: number,
  compactLabelWidthPx: number,
  iconSwitchWidth: number,
  compactSwitchWidth: number,
  iconReleaseWidth: number,
  compactModeReleaseBiasPx: number,
): SearchCompactMode {
  const fullModeAllowed = availableWidthPx >= Math.max(compactSwitchWidth + compactModeReleaseBiasPx, fullLabelWidthPx);
  const compactModeAllowed = availableWidthPx >= Math.max(iconSwitchWidth, compactLabelWidthPx);
  const iconModeExit = availableWidthPx >= iconReleaseWidth;

  if (currentMode === "icon") {
    return iconModeExit && compactModeAllowed ? "compact" : "icon";
  }

  if (currentMode === "compact") {
    if (fullModeAllowed) {
      return "full";
    }

    if (availableWidthPx <= iconSwitchWidth) {
      return "icon";
    }

    return compactModeAllowed ? "compact" : "icon";
  }

  if (fullModeAllowed) {
    return "full";
  }

  return compactModeAllowed ? "compact" : "icon";
}
