import { ArrowDownWideNarrow, ArrowUpWideNarrow } from "lucide-react";

import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";

import type { RiskSeverityFilter, RiskSortField, RiskSortOrder, RiskSourceFilter } from "./riskViewModel";

const RISK_SORT_OPTIONS: { id: RiskSortField; name: string }[] = [
  { id: "title", name: "Risk" },
  { id: "source", name: "Source" },
  { id: "attachment", name: "Attachment" },
  { id: "mitigation", name: "Mitigation" },
];

interface RiskFilterToolbarProps {
  onSearchChange: (value: string) => void;
  onSeverityFilterChange: (value: RiskSeverityFilter) => void;
  onSortFieldChange: (value: RiskSortField) => void;
  onSortOrderChange: (value: RiskSortOrder) => void;
  onSourceFilterChange: (value: RiskSourceFilter) => void;
  search: string;
  severityFilter: RiskSeverityFilter;
  sortField: RiskSortField;
  sortOrder: RiskSortOrder;
  sourceFilter: RiskSourceFilter;
}

export function RiskFilterToolbar({
  onSearchChange,
  onSeverityFilterChange,
  onSortFieldChange,
  onSortOrderChange,
  onSourceFilterChange,
  search,
  severityFilter,
  sortField,
  sortOrder,
  sourceFilter,
}: RiskFilterToolbarProps) {
  const activeFilterCount = Number(severityFilter !== "all") + Number(sourceFilter !== "all");
  const riskSortIsDefault = sortField === "title" && sortOrder === "asc";

  return (
    <div className="panel-actions filter-toolbar subsystem-manager-toolbar">
      <TopbarResponsiveSearch
        actionCount={2}
        actions={
          <>
            <CompactFilterMenu
              activeCount={activeFilterCount}
              ariaLabel="Risk filters"
              buttonLabel="Filters"
              className="materials-filter-menu"
              items={[
                {
                  label: "Severity",
                  content: (
                    <select
                      aria-label="Filter risks by severity"
                      className="task-queue-sort-menu-select"
                      onChange={(milestone) => onSeverityFilterChange(milestone.target.value as RiskSeverityFilter)}
                      value={severityFilter}
                    >
                      <option value="all">All severities</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  ),
                },
                {
                  label: "Source",
                  content: (
                    <select
                      aria-label="Filter risks by source"
                      className="task-queue-sort-menu-select"
                      onChange={(milestone) => onSourceFilterChange(milestone.target.value as RiskSourceFilter)}
                      value={sourceFilter}
                    >
                      <option value="all">All sources</option>
                      <option value="qa-report">QA report</option>
                      <option value="test-result">Test result</option>
                    </select>
                  ),
                },
              ]}
            />
            <CompactFilterMenu
              activeCount={riskSortIsDefault ? 0 : 1}
              ariaLabel="Sort risks"
              buttonLabel="Sort"
              className="task-queue-sort-menu"
              icon={
                sortOrder === "asc" ? (
                  <ArrowUpWideNarrow size={14} strokeWidth={2} />
                ) : (
                  <ArrowDownWideNarrow size={14} strokeWidth={2} />
                )
              }
              items={[
                {
                  label: "Sort by",
                  content: (
                    <select
                      aria-label="Sort risks by"
                      className="task-queue-sort-menu-select"
                      onChange={(milestone) => onSortFieldChange(milestone.target.value as RiskSortField)}
                      value={sortField}
                    >
                      {RISK_SORT_OPTIONS.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  ),
                },
                {
                  label: "Direction",
                  content: (
                    <select
                      aria-label="Sort risks direction"
                      className="task-queue-sort-menu-select"
                      onChange={(milestone) => onSortOrderChange(milestone.target.value as RiskSortOrder)}
                      value={sortOrder}
                    >
                      <option value="asc">Ascending</option>
                      <option value="desc">Descending</option>
                    </select>
                  ),
                },
              ]}
            />
          </>
        }
        ariaLabel="Search risks"
        compactPlaceholder="Search"
        onChange={onSearchChange}
        placeholder="Search risks..."
        value={search}
      />

    </div>
  );
}
