import type { TopbarResponsiveSearchProps } from "../filters/TopbarResponsiveSearch";

export type WorkspaceTopbarSearchPreset = Pick<
  TopbarResponsiveSearchProps,
  | "actionCount"
  | "compactPlaceholder"
  | "compactSwitchWidth"
  | "collisionDetectionMode"
  | "collisionBiasPx"
  | "collisionPaddingPx"
  | "iconReleaseWidth"
  | "iconSwitchWidth"
  | "mode"
>;

export const TOPBAR_SEARCH_PRESETS: Record<string, WorkspaceTopbarSearchPreset> = {
  calendar: {
    actionCount: 2,
    compactPlaceholder: "Search",
    collisionDetectionMode: "auto",
    collisionPaddingPx: 10,
    mode: "dynamic-label",
  },
  manufacturing: {
    compactPlaceholder: "Search",
    collisionDetectionMode: "auto",
    collisionPaddingPx: 10,
  },
  materials: {
    compactPlaceholder: "Search",
    compactSwitchWidth: 200,
    collisionDetectionMode: "auto",
    collisionPaddingPx: 10,
  },
  milestones: {
    actionCount: 2,
    compactPlaceholder: "Search",
    compactSwitchWidth: 360 + 64,
    collisionBiasPx: 16,
    collisionDetectionMode: "auto",
    collisionPaddingPx: 12,
    iconReleaseWidth: 420 + 64,
    iconSwitchWidth: 260 + 64,
    mode: "dynamic-label",
  },
  parts: {
    compactPlaceholder: "Search",
    collisionDetectionMode: "auto",
    collisionPaddingPx: 10,
  },
  purchases: {
    compactPlaceholder: "Search",
    collisionDetectionMode: "auto",
    collisionPaddingPx: 10,
  },
  tasks: {
    actionCount: 2,
    compactPlaceholder: "Search",
    collisionDetectionMode: "auto",
    collisionPaddingPx: 10,
  },
  timeline: {
    compactPlaceholder: "Search",
    compactSwitchWidth: 220,
    collisionBiasPx: 16,
    collisionDetectionMode: "auto",
    collisionPaddingPx: 10,
    mode: "dynamic-label",
  },
  workLogs: {
    compactPlaceholder: "Search",
    collisionDetectionMode: "auto",
    collisionPaddingPx: 10,
  },
  workLogActivity: {
    actionCount: 1,
    compactPlaceholder: "Search",
    collisionDetectionMode: "auto",
    collisionPaddingPx: 10,
  },
};

export function buildTopbarSearchProps(
  preset: keyof typeof TOPBAR_SEARCH_PRESETS,
  overrides: Partial<TopbarResponsiveSearchProps>,
): TopbarResponsiveSearchProps {
  return {
    compactPlaceholder: "Search",
    ...TOPBAR_SEARCH_PRESETS[preset],
    ...overrides,
  } as TopbarResponsiveSearchProps;
}
