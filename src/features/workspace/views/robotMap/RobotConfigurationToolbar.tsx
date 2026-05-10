import { SearchToolbarInput } from "@/features/workspace/shared/filters/workspaceSearchToolbarInput";

interface RobotConfigurationToolbarProps {
  onSearchChange: (value: string) => void;
  onViewModeChange: (mode: "map" | "list") => void;
  search: string;
  viewMode: "map" | "list";
}

export function RobotConfigurationToolbar({
  onSearchChange,
  onViewModeChange,
  search,
  viewMode,
}: RobotConfigurationToolbarProps) {
  return (
    <div className="robot-config-toolbar panel-actions filter-toolbar">
      <div className="robot-config-toolbar-title">
        <h2>Robot Configuration</h2>
      </div>

      <SearchToolbarInput
        ariaLabel="Search subsystems, mechanisms, and parts"
        onChange={onSearchChange}
        placeholder="Search subsystem or mechanism..."
        value={search}
      />

      <button
        className="secondary-action queue-toolbar-action"
        onClick={() => onViewModeChange(viewMode === "map" ? "list" : "map")}
        type="button"
      >
        {viewMode === "map" ? "List View" : "Map View"}
      </button>
    </div>
  );
}
