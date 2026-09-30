import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import { WorkspaceSortMenu } from "@/features/workspace/shared/filters/WorkspaceSortMenu";

interface SubsystemsToolbarProps {
  search: string;
  setSearch: (value: string) => void;
  setShowArchivedMechanisms: (value: boolean) => void;
  setShowArchivedSubsystems: (value: boolean) => void;
  showArchivedMechanisms: boolean;
  showArchivedSubsystems: boolean;
  sortDirection: "asc" | "desc";
  sortField: string;
  setSortDirection: (value: "asc" | "desc") => void;
  setSortField: (value: string) => void;
}

const LABEL_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.35rem",
  color: "var(--text-copy)",
  fontSize: "0.85rem",
} as const;

export function SubsystemsToolbar({
  search,
  setSearch,
  setShowArchivedMechanisms,
  setShowArchivedSubsystems,
  showArchivedMechanisms,
  showArchivedSubsystems,
  sortDirection,
  sortField,
  setSortDirection,
  setSortField,
}: SubsystemsToolbarProps) {
  return (
    <div className="panel-actions filter-toolbar subsystem-manager-toolbar">
      <TopbarResponsiveSearch
        actions={<>
          <WorkspaceSortMenu direction={sortDirection} field={sortField} label="subsystems" onDirectionChange={setSortDirection} onFieldChange={setSortField} options={[{ label: "Name", value: "name" }, { label: "Iteration", value: "iteration" }, { label: "Open tasks", value: "openTasks" }]} />
          <CompactFilterMenu
            activeCount={Number(showArchivedSubsystems) + Number(showArchivedMechanisms)}
            ariaLabel="Subsystem filters"
            buttonLabel="Filters"
            className="materials-filter-menu"
            items={[
              {
                label: "Archived",
                content: (
                  <div className="task-queue-filter-menu-checkboxes">
                    <label style={LABEL_STYLE}>
                      <input
                        checked={showArchivedSubsystems}
                        onChange={(milestone) => setShowArchivedSubsystems(milestone.target.checked)}
                        type="checkbox"
                      />
                      Show archived subsystems
                    </label>
                    <label style={LABEL_STYLE}>
                      <input
                        checked={showArchivedMechanisms}
                        onChange={(milestone) => setShowArchivedMechanisms(milestone.target.checked)}
                        type="checkbox"
                      />
                      Show archived mechanisms
                    </label>
                  </div>
                ),
              },
            ]}
          />
        </>}
        ariaLabel="Search subsystems and mechanisms"
        compactPlaceholder="Search"
        onChange={setSearch}
        placeholder="Search subsystems or mechanisms..."
        tutorialTarget="subsystem-search-input"
        value={search}
      />

    </div>
  );
}
