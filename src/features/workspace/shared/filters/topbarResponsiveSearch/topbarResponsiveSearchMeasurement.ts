import type { RefObject } from "react";

import {
  ACTION_BUTTON_WIDTH_PX,
  clampSearchMode,
  type SearchCompactMode,
} from "./topbarResponsiveSearchModel";

type CollisionMeasurement = {
  availableWidthPx: number;
  blockers: number;
};

const DEFAULT_ICON_BUTTON_SIZE_PX = 27.2;
const DEFAULT_ICON_PILL_EXTRA_WIDTH_PX = 16;
const TEXT_MEASURE_GUARD_PX = 2;

let textMeasureCanvasRef: HTMLCanvasElement | null = null;
let textCanvas: CanvasRenderingContext2D | null = null;

const textCanvasContext = (): CanvasRenderingContext2D | null => {
  if (typeof document === "undefined") {
    return null;
  }

  if (!textMeasureCanvasRef) {
    const canvas = document.createElement("canvas");
    textCanvas = canvas.getContext("2d");
    textMeasureCanvasRef = canvas;
  }

  return textCanvas;
};

const parseLengthPx = (value: string): number => {
  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }

  const parsed = Number.parseFloat(trimmed);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  if (trimmed.endsWith("rem") || trimmed.endsWith("em")) {
    return parsed * 16;
  }

  return parsed;
};

const measureTextWidth = (text: string, style: CSSStyleDeclaration): number => {
  const context = textCanvasContext();
  if (!context) {
    return Math.ceil(text.length * 7.2 + TEXT_MEASURE_GUARD_PX);
  }

  context.font = style.font || `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  return Math.ceil(context.measureText(text).width);
};

export const getTextWidthForPlaceholder = (label: string, container: HTMLDivElement): number => {
  const toolbar = container.querySelector<HTMLElement>(".toolbar-search");
  const input = container.querySelector<HTMLInputElement>(".toolbar-search-input");
  const icon = container.querySelector<HTMLElement>(".toolbar-filter-icon");

  if (!input || !toolbar) {
    return Math.ceil(Math.max(0, label.length * 9.6) + TEXT_MEASURE_GUARD_PX);
  }

  const inputStyles = getComputedStyle(input);
  const toolbarStyles = getComputedStyle(toolbar);
  const iconWidth = icon?.getBoundingClientRect().width ?? 0;
  const toolbarGap = parseLengthPx(toolbarStyles.gap || toolbarStyles.columnGap);
  const inputPadding = parseLengthPx(inputStyles.paddingLeft) + parseLengthPx(inputStyles.paddingRight);
  const labelWidth = measureTextWidth(label, inputStyles);

  return Math.ceil(iconWidth + toolbarGap + inputPadding + labelWidth + TEXT_MEASURE_GUARD_PX);
};

export const getIconPillRequiredWidth = (container: HTMLDivElement, resolvedActionCount: number): number => {
  const styles = getComputedStyle(container);
  const iconPillWidth = parseLengthPx(styles.getPropertyValue("--topbar-responsive-search-icon-pill-width"));
  if (iconPillWidth > 0) {
    return iconPillWidth;
  }

  const iconButton =
    parseLengthPx(styles.getPropertyValue("--topbar-responsive-search-icon-button-size")) || DEFAULT_ICON_BUTTON_SIZE_PX;
  const reserved =
    parseLengthPx(styles.getPropertyValue("--topbar-responsive-search-icon-pill-reserved-width")) ||
    resolvedActionCount * ACTION_BUTTON_WIDTH_PX;
  const extra =
    parseLengthPx(styles.getPropertyValue("--topbar-responsive-search-icon-pill-extra-width")) ||
    DEFAULT_ICON_PILL_EXTRA_WIDTH_PX;

  return iconButton + reserved + extra;
};

export const setTopbarSearchCollisionMode = (
  searchRef: RefObject<HTMLDivElement | null>,
  mode: SearchCompactMode,
  leftWidthPx?: number | null,
) => {
  if (typeof document === "undefined") {
    return;
  }

  const host = searchRef.current?.closest(".app-topbar-controls-host, .app-topbar-search-host");
  const topbar = host?.closest(".app-topbar");

  if (!topbar || !(topbar instanceof HTMLElement)) {
    return;
  }

  if (mode === "icon") {
    topbar.setAttribute("data-topbar-search-mode", "icon");
    if (typeof leftWidthPx === "number" && leftWidthPx > 0) {
      topbar.style.setProperty("--app-topbar-left-collapse-width", `${Math.ceil(leftWidthPx)}px`);
    }
    return;
  }

  topbar.removeAttribute("data-topbar-search-mode");
  topbar.style.removeProperty("--app-topbar-left-collapse-width");
};

const collectCollisionTargets = (
  container: HTMLElement,
  anchor: HTMLDivElement,
  collisionRoots: readonly string[] | undefined,
): HTMLElement[] => {
  if (collisionRoots && collisionRoots.length > 0) {
    const targets = new Map<string, HTMLElement>();

    for (const selector of collisionRoots) {
      const nodes = container.querySelectorAll<HTMLElement>(selector);
      for (const node of nodes) {
        if (node === anchor || container === node) {
          continue;
        }
        targets.set(`${node.tagName}-${node.className}-${node.id}-${node.offsetLeft}`, node);
      }
    }

    if (targets.size > 0) {
      return Array.from(targets.values());
    }
  }

  return Array.from(container.children).filter((child): child is HTMLElement => child !== anchor);
};

export const getCollisionMeasurement = (
  searchRef: RefObject<HTMLDivElement | null>,
  collisionPaddingPx: number,
  collisionRoots?: readonly string[],
): CollisionMeasurement | null => {
  const container = searchRef.current?.parentElement;
  const search = searchRef.current;

  if (!container || !search) {
    return null;
  }

  const containerRect = container.getBoundingClientRect();
  const searchRect = search.getBoundingClientRect();
  const candidates = collectCollisionTargets(container, search, collisionRoots);
  let nearestRightBoundary = containerRect.right - collisionPaddingPx;
  let blockers = 0;

  for (const target of candidates) {
    const targetRect = target.getBoundingClientRect();
    if (targetRect.width <= 0 || targetRect.height <= 0) {
      continue;
    }

    if (targetRect.bottom <= searchRect.top || targetRect.top >= searchRect.bottom) {
      continue;
    }

    if (targetRect.left >= searchRect.left + collisionPaddingPx) {
      blockers += 1;
      nearestRightBoundary = Math.min(nearestRightBoundary, targetRect.left - collisionPaddingPx);
    }
  }

  const availableStart = containerRect.left + collisionPaddingPx;
  const availableWidthPx = Math.floor(nearestRightBoundary - availableStart);

  return {
    availableWidthPx: Math.max(0, availableWidthPx),
    blockers,
  };
};

export { clampSearchMode };
