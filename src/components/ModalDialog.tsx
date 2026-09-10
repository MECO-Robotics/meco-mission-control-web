import { useLayoutEffect, useRef, type ReactNode } from "react";

/** Mount only while open. Native modality owns focus, inertness and nested dialogs. */
export function ModalDialog({
  children,
  label,
  onClose,
  dismissOnBackdrop = false,
  className = "modal-scrim",
}: {
  children: ReactNode;
  label: string;
  onClose: () => void;
  dismissOnBackdrop?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    document.dispatchEvent(new Event("workspace-modal-change"));
    return () => {
      dialog.close();
      document.dispatchEvent(new Event("workspace-modal-change"));
    };
  }, []);

  return (
    <dialog
      aria-label={label}
      className={className}
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
      onClick={(event) => {
        if (dismissOnBackdrop && event.target === event.currentTarget) onClose();
      }}
    >
      {children}
    </dialog>
  );
}
