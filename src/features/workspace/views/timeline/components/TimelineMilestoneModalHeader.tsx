interface TimelineMilestoneModalHeaderProps {
  activeMilestoneDay: string | null;
  mode: "create" | "edit";
  onClose: () => void;
  onSwitchToTask: () => void;
}

export function TimelineMilestoneModalHeader({
  activeMilestoneDay,
  mode,
  onClose,
  onSwitchToTask,
}: TimelineMilestoneModalHeaderProps) {
  return (
    <div className="panel-header compact-header" style={mode === "create" ? { marginBottom: "0.65rem" } : undefined}>
      <div>
        <p
          className="eyebrow"
          style={{
            color: "var(--meco-blue)",
            ...(mode === "create" ? { marginBottom: "0.2rem" } : null),
          }}
        >
          Timeline milestone
        </p>
        {mode === "create" ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexWrap: "wrap",
              marginTop: 0,
            }}
          >
            <h2 style={{ color: "var(--text-title)", margin: 0 }}>Create</h2>
            <button className="secondary-action" onClick={onSwitchToTask} type="button">
              Task
            </button>
            <button className="primary-action" type="button">
              Milestone
            </button>
          </div>
        ) : (
          <h2 style={{ color: "var(--text-title)" }}>Edit milestone</h2>
        )}
        {activeMilestoneDay ? (
          <p className="section-copy" style={{ marginTop: "0.25rem" }}>
            Date: {activeMilestoneDay}
          </p>
        ) : null}
      </div>
      <button
        className="icon-button"
        onClick={onClose}
        style={{ color: "var(--text-copy)", background: "transparent" }}
        type="button"
      >
        Close
      </button>
    </div>
  );
}
