import { IconManufacturing, IconTasks } from "@/components/shared/Icons";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { FilterDropdown } from "@/features/workspace/shared/filters/FilterDropdown";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import { PART_STATUS_OPTIONS } from "@/features/workspace/shared/model/workspaceOptions";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { BootstrapPayload } from "@/types/bootstrap";

interface PartsToolbarProps {
  bootstrap: BootstrapPayload;
  partSearch: string;
  partStatus: FilterSelection;
  partSubsystem: FilterSelection;
  setPartSearch: (value: string) => void;
  setPartStatus: (value: FilterSelection) => void;
  setPartSubsystem: (value: FilterSelection) => void;
  setShowArchivedPartDefinitions: (value: boolean) => void;
  showArchivedPartDefinitions: boolean;
}

const ARCHIVED_LABEL_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.35rem",
  color: "var(--text-copy)",
  fontSize: "0.85rem",
} as const;

export function PartsToolbar({
  bootstrap,
  partSearch,
  partStatus,
  partSubsystem,
  setPartSearch,
  setPartStatus,
  setPartSubsystem,
  setShowArchivedPartDefinitions,
  showArchivedPartDefinitions,
}: PartsToolbarProps) {
  return (
    <div className="panel-actions filter-toolbar part-manager-toolbar">
      <TopbarResponsiveSearch
        actions={
          <CompactFilterMenu
            activeCount={[partSubsystem, partStatus].filter((value) => value.length > 0).length}
            ariaLabel="Part filters"
            buttonLabel="Filters"
            className="materials-filter-menu"
            items={[
              {
                label: "Subsystem",
                content: (
                  <FilterDropdown
                    allLabel="All subsystems"
                    ariaLabel="Filter parts by subsystem"
                    className="task-queue-filter-menu-submenu"
                    icon={<IconManufacturing />}
                    onChange={setPartSubsystem}
                    options={bootstrap.subsystems}
                    value={partSubsystem}
                  />
                ),
              },
              {
                label: "Status",
                content: (
                  <FilterDropdown
                    allLabel="All statuses"
                    ariaLabel="Filter parts by status"
                    className="task-queue-filter-menu-submenu"
                    icon={<IconTasks />}
                    onChange={setPartStatus}
                    options={PART_STATUS_OPTIONS}
                    value={partStatus}
                  />
                ),
              },
            ]}
          />
        }
        ariaLabel="Search parts"
        compactPlaceholder="Search"
        onChange={setPartSearch}
        placeholder="Search parts..."
        tutorialTarget="parts-search-input"
        value={partSearch}
      />
      <label style={ARCHIVED_LABEL_STYLE}>
        <input
          checked={showArchivedPartDefinitions}
          onChange={(milestone) => setShowArchivedPartDefinitions(milestone.target.checked)}
          type="checkbox"
        />
        Show archived definitions
      </label>

    </div>
  );
}
