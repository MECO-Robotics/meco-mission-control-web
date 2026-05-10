import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";

interface SubsystemsToolbarProps {
  search: string;
  setSearch: (value: string) => void;
  setShowArchivedMechanisms: (value: boolean) => void;
  setShowArchivedSubsystems: (value: boolean) => void;
  showArchivedMechanisms: boolean;
  showArchivedSubsystems: boolean;
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
}: SubsystemsToolbarProps) {
  return (
    <div className="panel-actions filter-toolbar subsystem-manager-toolbar">
      <TopbarResponsiveSearch
        ariaLabel="Search subsystems and mechanisms"
        compactPlaceholder="Search"
        onChange={setSearch}
        placeholder="Search subsystems or mechanisms..."
        tutorialTarget="subsystem-search-input"
        value={search}
      />
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
  );
}
