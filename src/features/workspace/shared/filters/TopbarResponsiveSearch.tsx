import { useRef, type CSSProperties, type ReactNode } from "react";

import {
  ACTION_BUTTON_WIDTH_PX,
  DEFAULT_COLLISION_BIAS_PX,
  DEFAULT_COLLISION_PADDING_PX,
  countActionNodes,
  type SearchCollisionMode,
  type SearchCompactMode,
  type SearchCompactModeChangeDetail,
} from "./topbarResponsiveSearch/topbarResponsiveSearchModel";
import { TopbarResponsiveSearchLayout } from "./topbarResponsiveSearch/TopbarResponsiveSearchLayout";
import { useCompactSearchPopover } from "./topbarResponsiveSearch/useCompactSearchPopover";
import { useTopbarResponsiveSearchMode } from "./topbarResponsiveSearch/useTopbarResponsiveSearchMode";

export type TopbarResponsiveSearchProps = {
  actionCount?: number;
  actions?: ReactNode;
  ariaLabel: string;
  className?: string;
  compactPlaceholder?: string;
  compactSwitchWidth?: number;
  collisionBiasPx?: number;
  collisionDetectionMode?: SearchCollisionMode;
  collisionPaddingPx?: number;
  collisionRoots?: string[];
  iconReleaseWidth?: number;
  iconSwitchWidth?: number;
  mode?: "multi-state" | "dynamic-label";
  onActionsMouseDown?: () => void;
  onChange: (value: string) => void;
  onCompactModeChange?: (mode: SearchCompactMode, detail: SearchCompactModeChangeDetail) => void;
  placeholder: string;
  tutorialTarget?: string;
  value: string;
};

export function TopbarResponsiveSearch({
  actionCount,
  actions,
  ariaLabel,
  className,
  compactPlaceholder,
  compactSwitchWidth,
  collisionBiasPx,
  collisionDetectionMode,
  collisionPaddingPx,
  collisionRoots,
  iconReleaseWidth,
  iconSwitchWidth,
  mode,
  onActionsMouseDown,
  onChange,
  onCompactModeChange,
  placeholder,
  tutorialTarget,
  value,
}: TopbarResponsiveSearchProps) {
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resolvedMode = mode ?? "dynamic-label";
  const compactLabel =
    compactPlaceholder && compactPlaceholder.trim().length > 0 ? compactPlaceholder.trim() : "Search";
  const resolvedActionCount = actions ? Math.max(1, actionCount ?? countActionNodes(actions)) : 0;
  const actionOverlayWidthPx = resolvedActionCount * ACTION_BUTTON_WIDTH_PX;
  const legacySwitchWidth = compactSwitchWidth ?? 132 + actionOverlayWidthPx;
  const legacyIconWidth = iconSwitchWidth ?? 86 + actionOverlayWidthPx;
  const legacyIconReleaseWidth = iconReleaseWidth ?? legacyIconWidth + 12;
  const shouldUseCollisionDetection = resolvedMode === "dynamic-label" && (collisionDetectionMode ?? "auto") === "auto";
  const { compactRef, isCompactOpen, setIsCompactOpen } = useCompactSearchPopover();
  const { searchMode, searchWidth } = useTopbarResponsiveSearchMode({
    actionOverlayWidthPx,
    compactLabel,
    collisionRoots,
    effectiveCompactBias: collisionBiasPx ?? DEFAULT_COLLISION_BIAS_PX,
    effectivePadding: collisionPaddingPx ?? DEFAULT_COLLISION_PADDING_PX,
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
  });
  const resolvedPlaceholder =
    resolvedMode === "dynamic-label" &&
    (searchMode === "compact" || (searchWidth !== null && searchWidth <= legacySwitchWidth))
      ? compactLabel
      : placeholder;
  const rootStyle =
    resolvedActionCount > 0
      ? ({
          "--topbar-responsive-search-action-overlay-width": `${resolvedActionCount * 2}rem`,
          "--topbar-responsive-search-icon-pill-extra-width": "1rem",
          "--topbar-responsive-search-icon-pill-reserved-width": `${resolvedActionCount * 2}rem`,
          ...(searchWidth !== null && {
            "--topbar-responsive-search-available-width": `${searchWidth}px`,
          }),
        } as CSSProperties)
      : undefined;

  return (
    <TopbarResponsiveSearchLayout
      actions={actions}
      ariaLabel={ariaLabel}
      compactLabel={compactLabel}
      compactRef={compactRef}
      hasCompactLabelVariant={compactLabel !== placeholder}
      isActive={value.trim() !== ""}
      isCompactOpen={isCompactOpen}
      isDynamicMode={resolvedMode === "dynamic-label"}
      isIconMode={searchMode === "icon"}
      onActionsMouseDown={onActionsMouseDown}
      onChange={onChange}
      placeholder={placeholder}
      resolvedPlaceholder={resolvedPlaceholder}
      rootClassName={`topbar-responsive-search${actions ? " has-actions" : ""}${className ? ` ${className}` : ""}`}
      rootStyle={rootStyle}
      searchInputRef={searchInputRef}
      searchRef={searchRef}
      setIsCompactOpen={setIsCompactOpen}
      tutorialTarget={tutorialTarget}
      value={value}
    />
  );
}
