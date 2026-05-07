import { useEffect, useLayoutEffect, useState, type RefObject } from "react";

import type { DropdownOption } from "../model/workspaceTypes";
import {
  type FilterSelection,
  getPortalMenuPosition,
  pruneFilterSelection,
} from "./workspaceFilterUtils";

export function toggleFilterSelection(selection: FilterSelection, value: string) {
  return selection.includes(value)
    ? selection.filter((selectedValue) => selectedValue !== value)
    : [...selection, value];
}

export function usePrunedFilterSelection(
  value: FilterSelection,
  options: DropdownOption[],
  onChange: (value: FilterSelection) => void,
) {
  useEffect(() => {
    const prunedValue = pruneFilterSelection(value, options);
    if (prunedValue.length !== value.length || prunedValue.some((item, index) => item !== value[index])) {
      onChange(prunedValue);
    }
  }, [onChange, options, value]);
}

export function useFilterDropdownMenuState({
  buttonRef,
  filterRef,
  isOpen,
  menuRef,
  onClose,
  portalMenu = false,
  portalMenuPlacement = "auto",
  viewSelector,
}: {
  buttonRef: RefObject<HTMLButtonElement | null>;
  filterRef: RefObject<HTMLSpanElement | null>;
  isOpen: boolean;
  menuRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  portalMenu?: boolean;
  portalMenuPlacement?: "auto" | "above" | "below";
  viewSelector: string;
}) {
  const [menuOffsetX, setMenuOffsetX] = useState(0);
  const [menuPosition, setMenuPosition] = useState<{ left: number; top: number } | null>(null);

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") {
      return;
    }

    const handlePointerDown = (milestone: MouseEvent) => {
      const target = milestone.target;
      const clickedInsideFilter = target instanceof Node && filterRef.current?.contains(target);
      const clickedInsideMenu = target instanceof Node && menuRef.current?.contains(target);
      if (!clickedInsideFilter && !clickedInsideMenu) {
        onClose();
      }
    };
    const handleKeyDown = (milestone: KeyboardEvent) => {
      if (milestone.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [filterRef, isOpen, menuRef, onClose]);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") {
      return;
    }

    const updateMenuOffset = () => {
      const buttonElement = buttonRef.current;
      const filterElement = filterRef.current;
      const menuElement = menuRef.current;
      if (!buttonElement || !filterElement || !menuElement) {
        return;
      }

      const menuWidth = menuElement.getBoundingClientRect().width;
      const buttonRect = buttonElement.getBoundingClientRect();
      const viewElement = filterElement.closest<HTMLElement>(viewSelector);
      const viewRect = viewElement?.getBoundingClientRect();
      const safeMargin = 12;
      const viewLeft = Math.max(viewRect?.left ?? 0, 0) + safeMargin;
      const viewRight = Math.min(viewRect?.right ?? window.innerWidth, window.innerWidth) - safeMargin;

      if (menuWidth <= 0 || viewRight <= viewLeft) {
        setMenuOffsetX(0);
        return;
      }

      const originalLeft = buttonRect.right - menuWidth;
      const boundedLeft = Math.max(viewLeft, Math.min(originalLeft, viewRight - menuWidth));
      setMenuOffsetX(boundedLeft - originalLeft);
    };

    let alignmentRaf: number | undefined;
    const onLayoutChange = () => {
      if (alignmentRaf !== undefined) {
        window.cancelAnimationFrame(alignmentRaf);
      }
      alignmentRaf = window.requestAnimationFrame(updateMenuOffset);
    };

    onLayoutChange();
    window.addEventListener("resize", onLayoutChange);
    window.addEventListener("scroll", onLayoutChange, true);

    return () => {
      if (alignmentRaf !== undefined) {
        window.cancelAnimationFrame(alignmentRaf);
      }
      window.removeEventListener("resize", onLayoutChange);
      window.removeEventListener("scroll", onLayoutChange, true);
    };
  }, [buttonRef, filterRef, isOpen, menuRef, viewSelector]);

  useLayoutEffect(() => {
    if (!isOpen || !portalMenu || typeof window === "undefined") {
      setMenuPosition(null);
      return;
    }

    const updateMenuPosition = () => {
      const buttonElement = buttonRef.current;
      const menuElement = menuRef.current;
      if (!buttonElement || !menuElement) {
        return;
      }

      const menuWidth = menuElement.getBoundingClientRect().width;
      const menuHeight = menuElement.getBoundingClientRect().height;
      const buttonRect = buttonElement.getBoundingClientRect();
      setMenuPosition(
        getPortalMenuPosition({
          buttonRect,
          menuHeight,
          menuWidth,
          placement: portalMenuPlacement,
          viewportHeight: window.innerHeight,
          viewportWidth: window.innerWidth,
        }),
      );
    };

    let positionRaf: number | undefined;
    const onLayoutChange = () => {
      if (positionRaf !== undefined) {
        window.cancelAnimationFrame(positionRaf);
      }
      positionRaf = window.requestAnimationFrame(updateMenuPosition);
    };

    onLayoutChange();
    window.addEventListener("resize", onLayoutChange);
    window.addEventListener("scroll", onLayoutChange, true);

    return () => {
      if (positionRaf !== undefined) {
        window.cancelAnimationFrame(positionRaf);
      }
      window.removeEventListener("resize", onLayoutChange);
      window.removeEventListener("scroll", onLayoutChange, true);
    };
  }, [buttonRef, isOpen, menuRef, portalMenu, portalMenuPlacement]);

  return { menuOffsetX, menuPosition };
}
