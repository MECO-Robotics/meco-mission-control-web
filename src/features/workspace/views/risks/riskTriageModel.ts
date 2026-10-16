import type { AttentionQueueRow } from "../attention/attentionQueue";

export interface RiskTriageFilters {
  search: string;
  source: string;
  owner: string;
  signal: string;
  sortField: string;
  sortDirection: "asc" | "desc";
}

export function filterRiskTriageRows(rows: AttentionQueueRow[], filters: RiskTriageFilters) {
  const query = filters.search.trim().toLocaleLowerCase();
  const filtered = rows.filter((row) =>
    (filters.source === "all" || row.source === filters.source)
    && (filters.owner === "all" || (filters.owner === "unassigned" ? !row.ownerMemberId : row.ownerMemberId === filters.owner))
    && (filters.signal === "all" || row.signals.includes(filters.signal))
    && (!query || [row.title, row.detail, row.context, ...(row.areaLabels ?? []), row.priority, row.status, ...row.reasons].join(" ").toLocaleLowerCase().includes(query)),
  );
  const direction = filters.sortDirection === "asc" ? 1 : -1;
  if (filters.sortField === "priority") return direction === 1 ? filtered : filtered.reverse();
  return filtered.sort((a, b) => {
    if (filters.sortField === "dueDate") {
      if (!a.dueDate || !b.dueDate) return a.dueDate ? -1 : b.dueDate ? 1 : a.key.localeCompare(b.key);
      return a.dueDate.localeCompare(b.dueDate) * direction || a.key.localeCompare(b.key);
    }
    return a.title.localeCompare(b.title) * direction || a.key.localeCompare(b.key);
  });
}
