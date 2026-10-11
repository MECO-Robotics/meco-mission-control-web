import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import { WorkspaceSortMenu } from "@/features/workspace/shared/filters/WorkspaceSortMenu";
import { WorkspaceTopbarControls } from "@/features/workspace/shared/topbar/WorkspaceTopbarControls";

interface RobotConfigurationToolbarProps {
  onSearchChange: (value: string) => void;
  search: string;
  sortDirection: "asc" | "desc";
  sortField: string;
  onSortDirectionChange: (value: "asc" | "desc") => void;
  onSortFieldChange: (value: string) => void;
}

export function RobotConfigurationToolbar({
  onSearchChange,
  search,
  sortDirection,
  sortField,
  onSortDirectionChange,
  onSortFieldChange,
}: RobotConfigurationToolbarProps) {
  return (
    <AppTopbarSlotPortal slot="controls">
      <WorkspaceTopbarControls
        search={
          <TopbarResponsiveSearch
            actions={
              <WorkspaceSortMenu
                direction={sortDirection}
                field={sortField}
                label="robot map"
                onDirectionChange={onSortDirectionChange}
                onFieldChange={onSortFieldChange}
                options={[
                  { label: "Layout", value: "layout" },
                  { label: "Name", value: "name" },
                  { label: "Mechanisms", value: "mechanisms" },
                  { label: "Parts", value: "parts" },
                ]}
              />
            }
            ariaLabel="Search subsystems, mechanisms, and parts"
            compactPlaceholder="Search"
            onChange={onSearchChange}
            placeholder="Search subsystem or mechanism..."
            value={search}
          />
        }
      />
    </AppTopbarSlotPortal>
  );
}
