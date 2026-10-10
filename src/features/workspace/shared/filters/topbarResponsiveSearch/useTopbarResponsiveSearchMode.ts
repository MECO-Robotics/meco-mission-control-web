import { useEffect, useState, type RefObject } from "react";

import {
  clampSearchMode,
  getCollisionMeasurement,
  getIconPillRequiredWidth,
  getTextWidthForPlaceholder,
  setTopbarSearchCollisionMode,
} from "./topbarResponsiveSearchMeasurement";
import type { SearchCompactMode, SearchCompactModeChangeDetail } from "./topbarResponsiveSearchModel";

type UseTopbarResponsiveSearchModeOptions = {
  actionOverlayWidthPx: number;
  compactLabel: string;
  collisionRoots?: string[];
  effectiveCompactBias: number;
  effectivePadding: number;
  iconSwitchWidth?: number;
  legacyIconReleaseWidth: number;
  legacyIconWidth: number;
  legacySwitchWidth: number;
  onCompactModeChange?: (mode: SearchCompactMode, detail: SearchCompactModeChangeDetail) => void;
  placeholder: string;
  resolvedActionCount: number;
  resolvedMode: "multi-state" | "dynamic-label";
  searchRef: RefObject<HTMLDivElement | null>;
  shouldUseCollisionDetection: boolean;
};

export function useTopbarResponsiveSearchMode({
  actionOverlayWidthPx,
  compactLabel,
  collisionRoots,
  effectiveCompactBias,
  effectivePadding,
  iconSwitchWidth,
  legacyIconReleaseWidth,
  legacyIconWidth,
  legacySwitchWidth,
  onCompactModeChange,
  placeholder,
  resolvedActionCount,
  resolvedMode,
  searchRef,
  shouldUseCollisionDetection,
}: UseTopbarResponsiveSearchModeOptions) {
  const [searchMode, setSearchMode] = useState<SearchCompactMode>("full");
  const [searchWidth, setSearchWidth] = useState<number | null>(null);

  useEffect(() => {
    if (resolvedMode !== "dynamic-label" || typeof ResizeObserver === "undefined") {
      return;
    }

    const element = searchRef.current;
    if (!element) {
      return;
    }
    const container = element.parentElement;
    if (!container) {
      return;
    }

    const updateSearchMode = () => {
      const nextSearchWidth = shouldUseCollisionDetection
        ? getCollisionMeasurement(searchRef, effectivePadding, collisionRoots)
        : { availableWidthPx: container.clientWidth, blockers: 0 };
      const widthToTest = nextSearchWidth?.availableWidthPx ?? container.clientWidth;
      const blockers = nextSearchWidth?.blockers ?? 0;
      const fullWidthRequired = getTextWidthForPlaceholder(placeholder, element) + actionOverlayWidthPx;
      const compactWidthRequired = getTextWidthForPlaceholder(compactLabel, element) + actionOverlayWidthPx;
      const iconPillWidth = getIconPillRequiredWidth(element, resolvedActionCount);

      setSearchWidth(widthToTest);

      if (!shouldUseCollisionDetection) {
        setSearchMode((current) => {
          if (widthToTest <= legacyIconWidth) {
            return "icon";
          }

          if (current === "icon" && widthToTest <= legacyIconReleaseWidth) {
            return "icon";
          }

          return "full";
        });

        return;
      }

      setSearchMode((current) => {
        const nextMode = clampSearchMode(
          current,
          widthToTest,
          fullWidthRequired,
          compactWidthRequired,
          Math.max(iconPillWidth, iconSwitchWidth ?? legacyIconWidth),
          Math.max(iconPillWidth, legacySwitchWidth),
          legacyIconReleaseWidth,
          effectiveCompactBias,
        );

        if (nextMode !== current) {
          onCompactModeChange?.(nextMode, { widthPx: widthToTest, blockers });
        }

        return nextMode;
      });
    };

    const observer = new ResizeObserver(() => {
      updateSearchMode();
    });

    observer.observe(container);
    for (const sibling of Array.from(container.children)) {
      observer.observe(sibling);
    }

    window.addEventListener("resize", updateSearchMode);
    updateSearchMode();

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateSearchMode);
    };
  }, [
    actionOverlayWidthPx,
    compactLabel,
    collisionRoots,
    effectiveCompactBias,
    effectivePadding,
    iconSwitchWidth,
    legacyIconReleaseWidth,
    legacyIconWidth,
    legacySwitchWidth,
    onCompactModeChange,
    placeholder,
    resolvedActionCount,
    resolvedMode,
    searchMode,
    searchRef,
    shouldUseCollisionDetection,
  ]);

  useEffect(() => {
    if (resolvedMode !== "dynamic-label") {
      return;
    }

    setTopbarSearchCollisionMode(searchRef, searchMode);

    return () => {
      setTopbarSearchCollisionMode(searchRef, "full");
    };
  }, [resolvedMode, searchMode, searchRef]);

  return { searchMode, searchWidth };
}
