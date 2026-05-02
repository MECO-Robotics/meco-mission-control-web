export function WorkspaceInfoToast({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <aside className="workspace-info-toast" role="status" aria-live="polite">
      <section className="workspace-info-toast-card">
        <div className="workspace-info-toast-header">
          <div>
            <p className="eyebrow" style={{ color: "var(--official-blue)" }}>
              Info
            </p>
            <h2>Task edit canceled</h2>
          </div>
          <button className="icon-button" onClick={onDismiss} type="button">
            Dismiss
          </button>
        </div>

        <p className="workspace-info-toast-message">{message}</p>
        <div className="workspace-info-toast-timer" aria-hidden="true">
          <span />
        </div>
      </section>
    </aside>
  );
}

export function WorkspaceErrorPopup({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return <WorkspaceInfoToast message={message} onDismiss={onDismiss} />;
}
