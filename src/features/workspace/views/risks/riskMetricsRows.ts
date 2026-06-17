import type { ScopeMetricRow } from "../RiskMetrics";

export function filterMetricRows(rows: ScopeMetricRow[], search: string) {
  const normalizedSearch = search.trim().toLowerCase();
  if (normalizedSearch.length === 0) {
    return rows;
  }

  return rows.filter((row) =>
    [row.name, row.subtitle, row.ownerLabel, row.mostSevereReason]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch),
  );
}
