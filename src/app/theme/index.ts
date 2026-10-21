import type { CSSProperties } from "react";

export const brandColors = {
  blue: "#16478e",
  red: "#ea1c2d",
  grey: "#bbbbbb",
  black: "#000000",
  white: "#ffffff",
} as const;

type ThemeMode = "light" | "dark";

function getShellBackground(mode: ThemeMode) {
  if (mode === "dark") {
    return "linear-gradient(180deg, #08111f 0%, #0f172a 100%)";
  }

  return "linear-gradient(180deg, #ffffff 0%, #f5f7fb 100%)";
}

function getThemeVars(mode: ThemeMode) {
  const isDarkMode = mode === "dark";

  return {
    "--official-blue": brandColors.blue,
    "--official-red": brandColors.red,
    "--official-grey": brandColors.grey,
    "--official-black": isDarkMode ? brandColors.white : brandColors.black,
    "--official-white": brandColors.white,
    "--meco-blue": brandColors.blue,
    "--meco-red": brandColors.red,
    "--meco-soft-blue": isDarkMode ? "rgba(22, 71, 142, 0.2)" : "rgba(22, 71, 142, 0.08)",
    "--meco-soft-red": isDarkMode ? "rgba(234, 28, 45, 0.2)" : "rgba(234, 28, 45, 0.08)",
    "--search-highlight-bg": isDarkMode ? "#92400e" : "#fde68a",
    "--search-highlight-text": isDarkMode ? "#fef3c7" : "#713f12",
    "--row-tint": isDarkMode ? "rgba(59, 130, 246, 0.18)" : "rgba(22, 71, 142, 0.14)",
    "--bg-panel": isDarkMode ? "#1e293b" : "#ffffff",
    "--border-base": isDarkMode ? "#334155" : "#e5e7eb",
    "--border-strong": isDarkMode ? "#475569" : "#cbd5e1",
    "--text-title": isDarkMode ? "#f8fafc" : "#000000",
    "--text-copy": isDarkMode ? "#e2e8f0" : "#475569",
    "--text-muted": isDarkMode ? "#94a3b8" : "#475569",
    "--text-accent": isDarkMode ? "#93c5fd" : "#16478e",
    "--text-link": isDarkMode ? "#93c5fd" : "#1d4ed8",
    "--text-link-hover": isDarkMode ? "#bfdbfe" : "#1e40af",
    "--shadow-soft": isDarkMode
      ? "0 2px 8px rgba(0, 0, 0, 0.24)"
      : "0 2px 8px rgba(15, 28, 52, 0.08)",
    "--shadow-overlay": isDarkMode
      ? "0 4px 12px rgba(2, 6, 23, 0.3)"
      : "0 4px 12px rgba(15, 23, 42, 0.14)",
    "--official-green": isDarkMode ? "#34d399" : "#166534",
    "--bg-row-stripe": isDarkMode ? "#0b1220" : "#e2e8f0",
    "--bg-row-alt": isDarkMode ? "#0f172a" : "#f8fafc",
    "--status-success-bg": isDarkMode ? "#064e3b" : "#dcfce7",
    "--status-success-text": isDarkMode ? "#34d399" : "#166534",
    "--status-success-chart": isDarkMode ? "#34d399" : "#15803d",
    "--status-info-bg": isDarkMode ? "#082f49" : "#e0f2fe",
    "--status-info-text": isDarkMode ? "#38bdf8" : "#075985",
    "--status-info-chart": isDarkMode ? "#60a5fa" : "#2563eb",
    "--status-warning-bg": isDarkMode ? "#451a03" : "#fef3c7",
    "--status-warning-text": isDarkMode ? "#fbbf24" : "#92400e",
    "--status-warning-chart": isDarkMode ? "#fbbf24" : "#d97706",
    "--status-danger-bg": isDarkMode ? "#450a0a" : "#fee2e2",
    "--status-danger-text": isDarkMode ? "#f87171" : "#991b1b",
    "--team-task-open-chart": isDarkMode ? "#facc15" : "#eab308",
    "--team-task-open-text": isDarkMode ? "#facc15" : "#a16207",
    "--team-task-blocked-chart": brandColors.red,
    "--team-task-blocked-text": isDarkMode ? "#f87171" : "#b91c1c",
    "--team-task-overdue-chart": isDarkMode ? "#fb923c" : "#f97316",
    "--team-task-overdue-text": isDarkMode ? "#fb923c" : "#c2410c",
    "--status-neutral-bg": isDarkMode ? "#1e293b" : "#f1f5f9",
    "--status-neutral-text": isDarkMode ? "#94a3b8" : "#475569",
    "--status-neutral-chart": isDarkMode ? "#94a3b8" : "#64748b",
    "--cad-viewer-background": "#17202c",
    "--cad-viewer-text": "#edf3fa",
    "--calendar-event-milestone": "#16478e",
    "--calendar-event-task-due": "#4f46e5",
    "--calendar-event-qa-due": "#92400e",
    "--calendar-event-manufacturing-due": "#166534",
    "--calendar-event-other": "#475569",
    "--calendar-event-meeting": "#16478e",
  } as const;
}

export function buildPageShellStyle(mode: ThemeMode): CSSProperties {
  return {
    background: getShellBackground(mode),
    ...getThemeVars(mode),
    colorScheme: mode,
  } as CSSProperties;
}
