import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import { CAD_SOURCE_MODEL_DOCS } from "@/features/workspace/shared/model/cadSourceModel";

interface RobotConfigurationToolbarProps {
  onSearchChange: (value: string) => void;
  search: string;
}

export function RobotConfigurationToolbar({
  onSearchChange,
  search,
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

      <TopbarResponsiveSearch
        ariaLabel="Search subsystems, mechanisms, and parts"
        compactPlaceholder="Search"
        onChange={onSearchChange}
        placeholder="Search subsystem or mechanism..."
        value={search}
      />
    </div>
  );
}
