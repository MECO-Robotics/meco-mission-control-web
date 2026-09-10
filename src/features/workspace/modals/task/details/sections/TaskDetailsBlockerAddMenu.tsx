import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { TASK_BLOCKER_TYPE_OPTIONS, type TaskBlockerType } from "@/types/common";
import { IconCheck, IconPlus } from "@/components/shared/Icons";
import { useFilterDropdownMenuState } from "../../../../shared/filters/workspaceFilterDropdownHooks";

const DEFAULT_BLOCKER_TYPE: TaskBlockerType = "other";

interface TaskDetailsBlockerAddMenuProps {
  className?: string;
  menuClassName?: string;
  onAddBlocker: (blockerType: TaskBlockerType, description: string) => void;
}

export function TaskDetailsBlockerAddMenu({
  className,
  menuClassName,
  onAddBlocker,
}: TaskDetailsBlockerAddMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [selectedType, setSelectedType] = useState<TaskBlockerType>(DEFAULT_BLOCKER_TYPE);
  const filterRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const descriptionInputRef = useRef<HTMLInputElement>(null);
  const menuId = useId();

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setDescription("");
    setSelectedType(DEFAULT_BLOCKER_TYPE);
  }, []);

  const submitBlocker = useCallback(() => {
    const trimmedDescription = description.trim();
    if (!trimmedDescription) {
      return;
    }

    onAddBlocker(selectedType, trimmedDescription);
    closeMenu();
  }, [closeMenu, description, onAddBlocker, selectedType]);

  const { menuPosition } = useFilterDropdownMenuState({
    buttonRef,
    filterRef,
    isOpen,
    menuRef,
    onClose: closeMenu,
    portalMenu: true,
    portalMenuPlacement: "below",
    viewSelector: ".workspace-panel, .panel, .page-shell, .modal-card",
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleFocus = window.requestAnimationFrame(() => {
      descriptionInputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(handleFocus);
  }, [isOpen]);

  return (
    <span
      className={`toolbar-filter toolbar-filter-dropdown${isOpen ? " is-open" : ""}${className ? ` ${className}` : ""}`}
      ref={filterRef}
    >
      <button
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="Add blocker"
        className="toolbar-filter-menu-button"
        data-inline-edit-field="blocker-add"
        ref={buttonRef}
        onClick={(milestone) => {
          milestone.stopPropagation();
          setIsOpen((current) => !current);
          if (isOpen) {
            closeMenu();
          }
        }}
        title="Add blocker"
        type="button"
      >
        <span className="toolbar-filter-icon">
          <IconPlus />
        </span>
      </button>
      {isOpen ? (
        createPortal(
          <div
            aria-label="Add blocker"
            className={`task-details-blocker-menu-popup table-column-filter-menu${menuClassName ? ` ${menuClassName}` : ""}`}
            id={menuId}
            ref={menuRef}
            role="dialog"
            style={{
              position: "fixed",
              top: `${menuPosition?.top ?? 0}px`,
              left: `${menuPosition?.left ?? 0}px`,
              right: "auto",
              bottom: "auto",
              transform: "none",
              visibility: menuPosition ? "visible" : "hidden",
              zIndex: 50000,
            }}
          >
            <div
              style={{
                color: "var(--text-title)",
                fontSize: "0.75rem",
                fontWeight: 800,
                letterSpacing: "0.03em",
                padding: "0.15rem 0.15rem 0.4rem",
                textTransform: "uppercase",
              }}
            >
              Add blocker
            </div>
            <label
              style={{
                color: "var(--text-title)",
                display: "grid",
                gap: "0.35rem",
                fontSize: "0.78rem",
                fontWeight: 700,
                paddingBottom: "0.4rem",
              }}
            >
              Type
              <select
                aria-label="Blocker type"
                className="task-detail-inline-edit-input task-details-blocker-input"
                onChange={(milestone) => setSelectedType(milestone.target.value as TaskBlockerType)}
                value={selectedType}
              >
                {TASK_BLOCKER_TYPE_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
            <label
              style={{
                color: "var(--text-title)",
                display: "grid",
                gap: "0.35rem",
                fontSize: "0.78rem",
                fontWeight: 700,
              }}
            >
              Description
              <div style={{ alignItems: "center", display: "flex", gap: "0.35rem" }}>
                <input
                  aria-label="Blocker description"
                  className="task-details-blocker-input"
                  onChange={(milestone) => setDescription(milestone.target.value)}
                  onKeyDown={(milestone) => {
                    if (milestone.key === "Enter") {
                      milestone.preventDefault();
                      submitBlocker();
                    }
                  }}
                  placeholder="Describe blocker"
                  ref={descriptionInputRef}
                  value={description}
                />
                <button
                  aria-label="Add blocker"
                  className="icon-button task-detail-section-action-button"
                  disabled={!description.trim()}
                  onClick={(milestone) => {
                    milestone.stopPropagation();
                    submitBlocker();
                  }}
                  type="button"
                >
                  <IconCheck />
                </button>
              </div>
            </label>
          </div>,
          buttonRef.current?.closest("dialog") ?? document.body,
        )
      ) : null}
    </span>
  );
}
