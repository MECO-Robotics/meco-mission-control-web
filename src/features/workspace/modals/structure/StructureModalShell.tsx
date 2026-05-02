import type { FormEvent, ReactNode } from "react";

type StructureModalShellProps = {
  eyebrowLabel: string;
  title: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
};

const modalCardStyle = {
  background: "var(--bg-panel)",
  border: "1px solid var(--border-base)",
} as const;

const eyebrowStyle = {
  color: "var(--meco-blue)",
} as const;

const titleStyle = {
  color: "var(--text-title)",
} as const;

const closeButtonStyle = {
  background: "transparent",
  color: "var(--text-copy)",
} as const;

const formStyle = {
  color: "var(--text-copy)",
} as const;

export function StructureModalShell({
  children,
  eyebrowLabel,
  onClose,
  onSubmit,
  title,
}: StructureModalShellProps) {
  return (
    <div className="modal-scrim" role="presentation" style={{ zIndex: 2000 }}>
      <section aria-modal="true" className="modal-card" role="dialog" style={modalCardStyle}>
        <div className="panel-header compact-header">
          <div>
            <p className="eyebrow" style={eyebrowStyle}>
              {eyebrowLabel}
            </p>
            <h2 style={titleStyle}>{title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button" style={closeButtonStyle}>
            Close
          </button>
        </div>

        <form className="modal-form" onSubmit={onSubmit} style={formStyle}>
          {children}
        </form>
      </section>
    </div>
  );
}
