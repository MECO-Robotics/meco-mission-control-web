import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useFilterDropdownMenuState } from "../filters/workspaceFilterDropdownHooks";

/** Anchored, nonmodal details for legends and record-reference lists. */
export function WorkspacePopover({ label, trigger, children, className = "" }: {
  label: string;
  trigger: ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const filterRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const close = useCallback(() => setIsOpen(false), []);
  const { menuPosition } = useFilterDropdownMenuState({
    buttonRef, filterRef, menuRef, isOpen, onClose: close,
    portalMenu: true, viewSelector: ".page-shell",
  });
  const isPositioned = Boolean(menuPosition);
  useEffect(() => {
    if (isOpen && isPositioned) menuRef.current?.focus();
  }, [isOpen, isPositioned]);
  return <span ref={filterRef} className={`toolbar-filter toolbar-filter-dropdown workspace-popover ${className}`}>
    <button type="button" ref={buttonRef} className="toolbar-filter-menu-button"
      aria-label={label} aria-expanded={isOpen} aria-controls={isOpen ? id : undefined}
      aria-haspopup="dialog" onClick={() => setIsOpen((value) => !value)}>{trigger}</button>
    {isOpen && createPortal(<div ref={menuRef} id={id} role="dialog" aria-label={label}
      tabIndex={-1} className="task-queue-filter-menu-popover workspace-popover-panel"
      onBlur={(event) => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)
          && !filterRef.current?.contains(event.relatedTarget as Node)) close();
      }}
      style={{ position: "fixed", left: menuPosition?.left ?? 0, top: menuPosition?.top ?? 0,
        right: "auto", bottom: "auto", transform: "none", zIndex: 50000,
        visibility: menuPosition ? "visible" : "hidden", maxWidth: "calc(100vw - 24px)",
        maxHeight: "min(24rem, calc(100vh - 24px))", overflow: "auto" }}>
      <strong>{label}</strong>
      {typeof children === "function" ? children(() => { close(); buttonRef.current?.focus(); }) : children}
    </div>, buttonRef.current?.closest("dialog") ?? document.body)}
  </span>;
}
