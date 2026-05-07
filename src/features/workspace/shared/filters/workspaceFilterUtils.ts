import { useEffect, useRef, useState } from "react";

import type { TaskRecord } from "@/types/recordsExecution";

import type { DropdownOption } from "../model/workspaceTypes";

const FILTER_CHANGE_ANIMATION_DURATION_MS = 220;

export const WORKSPACE_COMPACT_BREAKPOINT = 900;
export type FilterSelection = string[];

type FilterMotionPart = boolean | number | string | null | undefined | readonly string[];
type PortalMenuPlacement = "auto" | "above" | "below";

export function getPortalMenuPosition({
  buttonRect,
  menuHeight,
  menuWidth,
  placement,
  viewportHeight,
  viewportWidth,
}: {
  buttonRect: Pick<DOMRect, "bottom" | "right" | "top">;
  menuHeight: number;
  menuWidth: number;
  placement: PortalMenuPlacement;
  viewportHeight: number;
  viewportWidth: number;
}) {
  const safeMargin = 12;
  const menuOffset = 6;
  const belowTop = buttonRect.bottom + menuOffset;
  const aboveTop = buttonRect.top - menuHeight - menuOffset;
  const spaceBelow = viewportHeight - buttonRect.bottom - menuOffset - safeMargin;
  const spaceAbove = buttonRect.top - menuOffset - safeMargin;
  const resolvedPlacement =
    placement === "auto"
      ? spaceBelow >= menuHeight || spaceBelow >= spaceAbove
        ? "below"
        : "above"
      : placement;

  return {
    left: Math.max(
      safeMargin,
      Math.min(buttonRect.right - menuWidth, viewportWidth - menuWidth - safeMargin),
    ),
    top:
      resolvedPlacement === "below"
        ? Math.min(viewportHeight - menuHeight - safeMargin, belowTop)
        : Math.max(safeMargin, aboveTop),
  };
}

export function filterSelectionIncludes(selection: FilterSelection, value: string | null | undefined) {
  return selection.length === 0 || (typeof value === "string" && selection.includes(value));
}

export function filterSelectionIntersects(selection: FilterSelection, values: string[]) {
  return selection.length === 0 || values.some((value) => selection.includes(value));
}

export function pruneFilterSelection(selection: FilterSelection, options: DropdownOption[]) {
  if (selection.length === 0) {
    return selection;
  }

  const optionIds = new Set(options.map((option) => option.id));
  return selection.filter((selectedValue) => optionIds.has(selectedValue));
}

export function getTaskPersonFilterIds(task: TaskRecord) {
  const assigneeIds = Array.isArray(task.assigneeIds) ? task.assigneeIds : [];
  const candidateIds = [
    ...assigneeIds,
    task.ownerId,
    task.mentorId,
  ].filter((value): value is string => typeof value === "string" && value.length > 0);

  return Array.from(new Set(candidateIds));
}

export function filterSelectionMatchesTaskPeople(selection: FilterSelection, task: TaskRecord) {
  return filterSelectionIntersects(selection, getTaskPersonFilterIds(task));
}

function serializeFilterMotionPart(part: FilterMotionPart) {
  if (Array.isArray(part)) {
    return `[${part.join(",")}]`;
  }

  return `${part ?? ""}`;
}

export function useFilterChangeMotionClass(parts: readonly FilterMotionPart[]) {
  const signature = parts.map(serializeFilterMotionPart).join("||");
  const previousSignatureRef = useRef(signature);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (previousSignatureRef.current === signature) {
      return;
    }

    previousSignatureRef.current = signature;
    setIsAnimating(false);

    if (typeof window === "undefined") {
      return;
    }

    let timeoutId: number | undefined;
    const startAnimation = () => {
      setIsAnimating(true);
      timeoutId = window.setTimeout(
        () => setIsAnimating(false),
        FILTER_CHANGE_ANIMATION_DURATION_MS,
      );
    };
    const hasAnimationFrame = typeof window.requestAnimationFrame === "function";
    const startId = hasAnimationFrame
      ? window.requestAnimationFrame(startAnimation)
      : window.setTimeout(startAnimation, 0);

    return () => {
      if (hasAnimationFrame) {
        window.cancelAnimationFrame(startId);
      } else {
        window.clearTimeout(startId);
      }

      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [signature]);

  return `filter-results-motion${isAnimating ? " is-filtering" : ""}`;
}

export function useWorkspaceCompactMode(breakpoint = WORKSPACE_COMPACT_BREAKPOINT) {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateCompactState = () => {
      setIsCompact(window.innerWidth <= breakpoint);
    };

    updateCompactState();
    window.addEventListener("resize", updateCompactState);

    return () => {
      window.removeEventListener("resize", updateCompactState);
    };
  }, [breakpoint]);

  return isCompact;
}

export function formatFilterSelectionLabel(
  allLabel: string,
  options: DropdownOption[],
  value: FilterSelection,
) {
  if (value.length === 0) {
    return allLabel;
  }

  if (value.length === 1) {
    return options.find((option) => option.id === value[0])?.name ?? "1 selected";
  }

  return `${value.length} selected`;
}
