import { SearchToolbarInput } from "@/features/workspace/shared/filters/workspaceSearchToolbarInput";

interface SubsystemsToolbarProps {
  openCreateSubsystemModal: () => void;
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
  openCreateSubsystemModal,
  search,
  setSearch,
  setShowArchivedMechanisms,
  setShowArchivedSubsystems,
  showArchivedMechanisms,
  showArchivedSubsystems,
}: SubsystemsToolbarProps) {
  return (
    <div className="panel-actions filter-toolbar subsystem-manager-toolbar">
      <div data-tutorial-target="subsystem-search-input">
        <SearchToolbarInput
          ariaLabel="Search subsystems and mechanisms"
          onChange={setSearch}
          placeholder="Search subsystems or mechanisms..."
          value={search}
        />
      </div>
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

      <button
        aria-label="Add subsystem"
        className="primary-action queue-toolbar-action subsystem-manager-toolbar-action"
        data-tutorial-target="create-subsystem-button"
        onClick={openCreateSubsystemModal}
        type="button"
      >
        Add subsystem
      </button>
    </div>
  );
}
