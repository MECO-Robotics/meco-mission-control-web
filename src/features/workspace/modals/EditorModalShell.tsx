import { ModalDialog } from "@/components/ModalDialog";
import type { FormEvent, ReactNode } from "react";

type EditorModalShellProps = {
  dialogLabel?: string;
  eyebrowLabel: string;
  title: string;
  onClose: () => void;
  onSubmit: (milestone: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
};

const modalCardStyle = {
  background: "var(--bg-panel)",
  border: "1px solid var(--border-base)",
} as const;

const formStyle = {
  color: "var(--text-copy)",
} as const;

export function EditorModalShell({
  children,
  dialogLabel,
  eyebrowLabel,
  onClose,
  onSubmit,
  title,
}: EditorModalShellProps) {
  return (
    <ModalDialog label={dialogLabel ?? title} onClose={onClose}>
      <section  className="modal-card"  style={modalCardStyle}>
        <div className="panel-header compact-header">
          <div>
            <p className="eyebrow">
              {eyebrowLabel}
            </p>
            <h2>{title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button">
            Close
          </button>
        </div>

        <form className="modal-form" onSubmit={onSubmit} style={formStyle}>
          {children}
        </form>
      </section>
    </ModalDialog>
  );
}
