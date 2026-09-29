import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";

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
