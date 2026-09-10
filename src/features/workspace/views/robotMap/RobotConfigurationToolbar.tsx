import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import { CAD_SOURCE_MODEL_DOCS } from "@/features/workspace/shared/model/cadSourceModel";

interface RobotConfigurationToolbarProps {
  onSearchChange: (value: string) => void;
  onViewModeChange: (mode: "map" | "list" | "3d") => void;
  search: string;
  viewMode: "map" | "list" | "3d";
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
        <p className="section-copy">
          Manual configuration with finalized STEP import and Onshape sync sources.{" "}
          <a href={CAD_SOURCE_MODEL_DOCS.robotConfiguration} rel="noreferrer" target="_blank">
            Source model docs
          </a>
        </p>
      </div>

      {viewMode !== "3d" && <TopbarResponsiveSearch
        ariaLabel="Search subsystems, mechanisms, and parts"
        compactPlaceholder="Search"
        onChange={onSearchChange}
        placeholder="Search subsystem or mechanism..."
        value={search}
      />}

      {(["map", "list", "3d"] as const).map((mode) => (
        <button
          key={mode}
          className="secondary-action queue-toolbar-action"
          aria-pressed={viewMode === mode}
          onClick={() => onViewModeChange(mode)}
          type="button"
        >
          {mode === "3d" ? "3D View" : mode === "map" ? "Map View" : "List View"}
        </button>
      ))}
    </div>
  );
}
