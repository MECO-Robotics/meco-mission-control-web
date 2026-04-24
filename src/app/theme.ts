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
    return "radial-gradient(circle at 12% 8%, rgba(22, 71, 142, 0.24), transparent 26%), radial-gradient(circle at 88% 0%, rgba(234, 28, 45, 0.18), transparent 22%), linear-gradient(180deg, #08111f 0%, #0f172a 100%)";
  }

  return "radial-gradient(circle at 12% 8%, rgba(22, 71, 142, 0.1), transparent 26%), radial-gradient(circle at 88% 0%, rgba(234, 28, 45, 0.08), transparent 22%), linear-gradient(180deg, #ffffff 0%, #f5f7fb 100%)";
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
    "--row-tint": isDarkMode ? "rgba(59, 130, 246, 0.18)" : "rgba(22, 71, 142, 0.14)",
    "--bg-panel": isDarkMode ? "#1e293b" : "#ffffff",
    "--border-base": isDarkMode ? "#334155" : "#e5e7eb",
    "--text-title": isDarkMode ? "#f8fafc" : "#000000",
    "--text-copy": isDarkMode ? "#e2e8f0" : "#64748b",
    "--bg-row-alt": isDarkMode ? "#0f172a" : "#f8fafc",
    "--status-success-bg": isDarkMode ? "#064e3b" : "#dcfce7",
    "--status-success-text": isDarkMode ? "#34d399" : "#166534",
    "--status-info-bg": isDarkMode ? "#082f49" : "#e0f2fe",
    "--status-info-text": isDarkMode ? "#38bdf8" : "#075985",
    "--status-warning-bg": isDarkMode ? "#451a03" : "#fef3c7",
    "--status-warning-text": isDarkMode ? "#fbbf24" : "#92400e",
    "--status-danger-bg": isDarkMode ? "#450a0a" : "#fee2e2",
    "--status-danger-text": isDarkMode ? "#f87171" : "#991b1b",
    "--status-neutral-bg": isDarkMode ? "#1e293b" : "#f1f5f9",
    "--status-neutral-text": isDarkMode ? "#94a3b8" : "#475569",
  } as const;
}

export function buildPageShellStyle(mode: ThemeMode): CSSProperties {
  return {
    background: getShellBackground(mode),
    ...getThemeVars(mode),
    colorScheme: mode,
  } as CSSProperties;
}
