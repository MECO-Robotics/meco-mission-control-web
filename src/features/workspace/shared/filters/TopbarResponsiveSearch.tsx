import {
  Children,
  Fragment,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { Search } from "lucide-react";

import { SearchToolbarInput } from "./workspaceSearchToolbarInput";

type SearchCompactMode = "compact" | "full" | "icon";

type SearchCollisionMode = "auto" | "fixed";

function countActionNodes(actions: ReactNode): number {
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

type CollisionMeasurement = {
  availableWidthPx: number;
  blockers: number;
};

const DEFAULT_COLLISION_PADDING_PX = 8;
const DEFAULT_COLLISION_BIAS_PX = 16;
const ACTION_BUTTON_WIDTH_PX = 32;
const DEFAULT_ICON_BUTTON_SIZE_PX = 27.2;
const DEFAULT_ICON_PILL_EXTRA_WIDTH_PX = 16;
const TEXT_MEASURE_GUARD_PX = 2;

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

  if (trimmed.endsWith("rem")) {
    return parsed * 16;
  }

  if (trimmed.endsWith("em")) {
    return parsed * 16;
  }

  return parsed;
};

let textMeasureCanvasRef: HTMLCanvasElement | null = null;
let textCanvas: CanvasRenderingContext2D | null = null;

const measureTextWidth = (text: string, style: CSSStyleDeclaration): number => {
  const context = textCanvasContext();
  if (!context) {
    return Math.ceil(text.length * 7.2 + TEXT_MEASURE_GUARD_PX);
  }

  const font = style.font || `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  context.font = font;
  return Math.ceil(context.measureText(text).width);
};

const getTextWidthForPlaceholder = (label: string, container: HTMLDivElement): number => {
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

const getIconPillRequiredWidth = (container: HTMLDivElement, resolvedActionCount: number): number => {
  const styles = getComputedStyle(container);
  const iconPillWidth = parseLengthPx(styles.getPropertyValue("--topbar-responsive-search-icon-pill-width"));
  if (iconPillWidth > 0) {
    return iconPillWidth;
  }

  const iconButton = parseLengthPx(styles.getPropertyValue("--topbar-responsive-search-icon-button-size")) || DEFAULT_ICON_BUTTON_SIZE_PX;
  const reserved = parseLengthPx(styles.getPropertyValue("--topbar-responsive-search-icon-pill-reserved-width")) || resolvedActionCount * ACTION_BUTTON_WIDTH_PX;
  const extra = parseLengthPx(styles.getPropertyValue("--topbar-responsive-search-icon-pill-extra-width")) || DEFAULT_ICON_PILL_EXTRA_WIDTH_PX;

  return iconButton + reserved + extra;
};

const setTopbarSearchCollisionMode = (
  searchRef: MutableRefObject<HTMLDivElement | null>,
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

const getCollisionMeasurement = (
  searchRef: MutableRefObject<HTMLDivElement | null>,
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

const clampSearchMode = (
  currentMode: SearchCompactMode,
  availableWidthPx: number,
  fullLabelWidthPx: number,
  compactLabelWidthPx: number,
  iconSwitchWidth: number,
  compactSwitchWidth: number,
  iconReleaseWidth: number,
  compactModeReleaseBiasPx: number,
): SearchCompactMode => {
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
};

type SearchCompactModeChangeDetail = {
  widthPx: number;
  blockers: number;
};

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
  const [isCompactOpen, setIsCompactOpen] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchCompactMode>("full");
  const [searchWidth, setSearchWidth] = useState<number | null>(null);
  const compactRef = useRef<HTMLDivElement>(null);
  const leftWidthRef = useRef<number | null>(null);
  const resolvedMode = mode ?? "dynamic-label";
  const isActive = value.trim() !== "";
  const compactLabel =
    compactPlaceholder && compactPlaceholder.trim().length > 0 ? compactPlaceholder.trim() : "Search";
  const hasCompactLabelVariant = compactLabel !== placeholder;
  const resolvedActionCount = actions ? Math.max(1, actionCount ?? countActionNodes(actions)) : 0;
  const actionOverlayWidthPx = resolvedActionCount * ACTION_BUTTON_WIDTH_PX;
  const legacySwitchWidth = compactSwitchWidth ?? 132 + actionOverlayWidthPx;
  const legacyIconWidth = iconSwitchWidth ?? 86 + actionOverlayWidthPx;
  const legacyIconReleaseWidth = iconReleaseWidth ?? legacyIconWidth + 12;
  const effectiveCompactBias = collisionBiasPx ?? DEFAULT_COLLISION_BIAS_PX;
  const effectivePadding = collisionPaddingPx ?? DEFAULT_COLLISION_PADDING_PX;
  const shouldUseCollisionDetection = resolvedMode === "dynamic-label" && (collisionDetectionMode ?? "auto") === "auto";
  const effectiveMode = searchMode === "icon";
  const resolvePlaceholder = resolvedMode === "dynamic-label" &&
    (searchMode === "compact" ||
      ((!shouldUseCollisionDetection &&
        searchWidth !== null &&
        searchWidth <= legacySwitchWidth) ||
        (shouldUseCollisionDetection &&
          searchWidth !== null &&
          searchWidth <= legacySwitchWidth)))
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
  const rootClassName = `topbar-responsive-search${actions ? " has-actions" : ""}${className ? ` ${className}` : ""}`;
  const renderActions = (classNameSuffix = "") =>
    actions ? (
      <div
        className={`topbar-responsive-search-actions${classNameSuffix}`}
        onMouseDown={onActionsMouseDown}
      >
        {actions}
      </div>
    ) : null;
  const renderFullSearch = (currentPlaceholder: string, variantClassName: string) => (
    <div className={`topbar-responsive-search-full ${variantClassName}`}>
      <div className="topbar-responsive-search-field">
        <SearchToolbarInput
          ariaLabel={ariaLabel}
          inputRef={searchInputRef}
          onChange={onChange}
          placeholder={currentPlaceholder}
          value={value}
        />
        {renderActions()}
      </div>
    </div>
  );
  const renderIconOnlySearch = () => (
    <div className="topbar-responsive-search-full topbar-responsive-search-full-primary topbar-responsive-search-full-icon-only">
      <div className="topbar-responsive-search-field">
        <SearchToolbarInput
          ariaLabel={ariaLabel}
          inputRef={searchInputRef}
          onChange={onChange}
          onSearchIconActivate={() => {
            searchInputRef.current?.focus();
          }}
          placeholder=""
          value={value}
        />
        {renderActions(" topbar-responsive-search-actions-compact")}
      </div>
    </div>
  );

  useEffect(() => {
    if (!isCompactOpen || typeof document === "undefined") {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Node && !compactRef.current?.contains(target)) {
        setIsCompactOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCompactOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCompactOpen]);

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
      const topbar = element.closest(".app-topbar");
      const topbarLeft = topbar?.querySelector<HTMLElement>(".app-topbar-left");
      const measuredLeftWidth = topbarLeft?.getBoundingClientRect().width ?? 0;
      if (measuredLeftWidth > 0 && searchMode !== "icon") {
        leftWidthRef.current = measuredLeftWidth;
      }

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

        if (nextMode === "icon" && leftWidthRef.current === null && measuredLeftWidth > 0) {
          leftWidthRef.current = measuredLeftWidth;
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
    collisionDetectionMode,
    shouldUseCollisionDetection,
    resolvedMode,
    actionOverlayWidthPx,
    compactSwitchWidth,
    compactLabel,
    hasCompactLabelVariant,
    iconReleaseWidth,
    iconSwitchWidth,
    legacyIconReleaseWidth,
    legacyIconWidth,
    legacySwitchWidth,
    placeholder,
    resolvedActionCount,
    effectiveCompactBias,
    effectivePadding,
    collisionRoots,
    onCompactModeChange,
    searchMode,
  ]);

  useEffect(() => {
    if (resolvedMode !== "dynamic-label") {
      return;
    }

    setTopbarSearchCollisionMode(searchRef, searchMode, leftWidthRef.current);

    return () => {
      setTopbarSearchCollisionMode(searchRef, "full");
    };
  }, [resolvedMode, searchMode]);

  if (resolvedMode === "dynamic-label") {
    return (
      <div
        className={`${rootClassName} topbar-responsive-search-dynamic${effectiveMode ? " is-icon-mode" : ""}`}
        data-tutorial-target={tutorialTarget}
        ref={searchRef}
        style={rootStyle}
      >
        {effectiveMode ? (
          renderIconOnlySearch()
        ) : (
          renderFullSearch(resolvePlaceholder, "topbar-responsive-search-full-primary")
        )}
      </div>
    );
  }

  return (
    <div className={rootClassName} data-tutorial-target={tutorialTarget} ref={searchRef} style={rootStyle}>
      {renderFullSearch(placeholder, "topbar-responsive-search-full-primary")}
      {hasCompactLabelVariant ? (
        renderFullSearch(compactLabel, "topbar-responsive-search-full-compact")
      ) : null}

      <div className={`topbar-responsive-search-compact${isCompactOpen ? " is-open" : ""}`} ref={compactRef}>
        <button
          aria-expanded={isCompactOpen}
          aria-haspopup="dialog"
          aria-label={ariaLabel}
          className={`icon-button app-topbar-icon-button topbar-responsive-search-toggle${isActive ? " is-active" : ""}`}
          onClick={() => setIsCompactOpen((current) => !current)}
          title={ariaLabel}
          type="button"
        >
          <Search size={14} strokeWidth={2} />
        </button>
        {renderActions(" topbar-responsive-search-actions-compact")}
        {isCompactOpen ? (
          <div className="topbar-responsive-search-popover">
            <input
              aria-label={ariaLabel}
              className="toolbar-search-input"
              onChange={(event) => onChange(event.target.value)}
              placeholder={placeholder}
              type="search"
              value={value}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
