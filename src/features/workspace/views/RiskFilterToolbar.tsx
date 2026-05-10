import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";

import type { RiskSeverityFilter, RiskSourceFilter } from "./riskViewModel";

interface RiskFilterToolbarProps {
  onSearchChange: (value: string) => void;
  onSeverityFilterChange: (value: RiskSeverityFilter) => void;
  onSourceFilterChange: (value: RiskSourceFilter) => void;
  search: string;
  severityFilter: RiskSeverityFilter;
  sourceFilter: RiskSourceFilter;
}

export function RiskFilterToolbar({
  onSearchChange,
  onSeverityFilterChange,
  onSourceFilterChange,
  search,
  severityFilter,
  sourceFilter,
}: RiskFilterToolbarProps) {
  return (
    <div className="panel-actions filter-toolbar subsystem-manager-toolbar">
      <TopbarResponsiveSearch
        ariaLabel="Search risks"
        compactPlaceholder="Search"
        onChange={onSearchChange}
        placeholder="Search risks..."
        value={search}
      />

      <label className="risk-filter-control">
        <span>Severity</span>
        <select
          onChange={(milestone) => onSeverityFilterChange(milestone.target.value as RiskSeverityFilter)}
          value={severityFilter}
        >
          <option value="all">All severities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </label>

      <label className="risk-filter-control">
        <span>Source</span>
        <select
          onChange={(milestone) => onSourceFilterChange(milestone.target.value as RiskSourceFilter)}
          value={sourceFilter}
        >
          <option value="all">All sources</option>
          <option value="qa-report">QA report</option>
          <option value="test-result">Test result</option>
        </select>
      </label>

    </div>
  );
}
