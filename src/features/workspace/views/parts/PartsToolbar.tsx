import { IconManufacturing, IconTasks } from "@/components/shared/Icons";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { FilterDropdown } from "@/features/workspace/shared/filters/FilterDropdown";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import { READINESS_STATUS_OPTIONS } from "@/features/workspace/shared/model/workspaceOptions";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { BootstrapPayload } from "@/types/bootstrap";

const FILTER_CHECKBOX_LABEL_STYLE = {
  alignItems: "center",
  color: "var(--text-copy)",
  display: "inline-flex",
  fontSize: "0.85rem",
  gap: "0.35rem",
} as const;

interface PartsToolbarProps {
  bootstrap: BootstrapPayload;
  mapping: string;
  partSearch: string;
  partStatus: FilterSelection;
  partSubsystem: FilterSelection;
  setPartSearch: (value: string) => void;
  setMapping: (value: string) => void;
  setPartStatus: (value: FilterSelection) => void;
  setPartSubsystem: (value: FilterSelection) => void;
  setShowArchivedPartDefinitions: (value: boolean) => void;
  showArchivedPartDefinitions: boolean;
}

export function PartsToolbar({
  bootstrap,
  mapping,
  partSearch,
  partStatus,
  partSubsystem,
  setPartSearch,
  setMapping,
  setPartStatus,
  setPartSubsystem,
  setShowArchivedPartDefinitions,
  showArchivedPartDefinitions,
}: PartsToolbarProps) {
  return (
    <div className="panel-actions filter-toolbar part-manager-toolbar">
      <TopbarResponsiveSearch
        actions={
          <>
            <CompactFilterMenu
              activeCount={[partSubsystem, partStatus].filter((value) => value.length > 0).length + Number(mapping !== "all") + Number(showArchivedPartDefinitions)}
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
                      options={READINESS_STATUS_OPTIONS}
                      value={partStatus}
                    />
                  ),
                },
                {
                  label: "Allocation",
                  content: (
                    <select
                      aria-label="Part allocation"
                      className="toolbar-filter-select"
                      onChange={(event) => setMapping(event.target.value)}
                      value={mapping}
                    >
                      <option value="all">All parts</option>
                      <option value="mapped">Mapped</option>
                      <option value="unmapped">Needs mapping</option>
                    </select>
                  ),
                },
                {
                  label: "Archive",
                  content: (
                    <div className="task-queue-filter-menu-checkboxes">
                      <label style={FILTER_CHECKBOX_LABEL_STYLE}>
                        <input
                          aria-label="Show archived definitions"
                          checked={showArchivedPartDefinitions}
                          onChange={(event) => setShowArchivedPartDefinitions(event.target.checked)}
                          type="checkbox"
                        />
                        Show archived definitions
                      </label>
                    </div>
                  ),
                },
              ]}
            />
          </>
        }
        ariaLabel="Search parts"
        compactPlaceholder="Search"
        onChange={setPartSearch}
        placeholder="Search parts..."
        tutorialTarget="parts-search-input"
        value={partSearch}
      />
    </div>
  );
}
