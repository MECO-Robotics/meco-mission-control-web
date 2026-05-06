import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { TaskDependencyKind } from "@/types/common";
import { IconPlus } from "@/components/shared/Icons";
import type { DropdownOption } from "@/features/workspace/shared/model/workspaceTypes";
import {
  TASK_DEPENDENCY_KIND_LABELS,
  TASK_DEPENDENCY_KIND_OPTIONS,
} from "@/features/workspace/shared/task/taskTargeting";
import { useFilterDropdownMenuState } from "../../../../shared/filters/workspaceFilterDropdownHooks";

interface TaskDetailsDependencyAddMenuProps {
  className?: string;
  menuClassName?: string;
  getTargetOptions: (kind: TaskDependencyKind) => DropdownOption[];
  onAddDependency: (kind: TaskDependencyKind, targetId: string) => void;
}

export function TaskDetailsDependencyAddMenu({
  className,
  getTargetOptions,
  menuClassName,
  onAddDependency,
}: TaskDetailsDependencyAddMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedKind, setSelectedKind] = useState<TaskDependencyKind | null>(null);
  const filterRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setSelectedKind(null);
  }, []);

  useEffect(() => {
    if (!isOpen || !selectedKind || typeof window === "undefined") {
      return;
    }

    const handleResize = window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event("resize"));
    });

    return () => window.cancelAnimationFrame(handleResize);
  }, [isOpen, selectedKind]);

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

  const currentTargetOptions = selectedKind ? getTargetOptions(selectedKind) : [];

  return (
    <span
      className={`toolbar-filter toolbar-filter-dropdown${isOpen ? " is-open" : ""}${className ? ` ${className}` : ""}`}
      ref={filterRef}
    >
      <button
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Add dependency"
        className="toolbar-filter-menu-button"
        data-inline-edit-field="dependency-add"
        ref={buttonRef}
        onClick={(milestone) => {
          milestone.stopPropagation();
          setIsOpen((current) => !current);
          if (isOpen) {
            closeMenu();
          }
        }}
        title="Add dependency"
        type="button"
      >
        <span className="toolbar-filter-icon">
          <IconPlus />
        </span>
      </button>
      {isOpen ? (
        createPortal(
          <div
            aria-label="Add dependency"
            className={`task-details-dependency-add-menu-shell${menuClassName ? ` ${menuClassName}` : ""}`}
            id={menuId}
            ref={menuRef}
            role="dialog"
            style={{
              display: "inline-flex",
              flexDirection: "row-reverse",
              alignItems: "flex-start",
              gap: "0.5rem",
              width: "max-content",
              maxWidth: "min(36rem, calc(100vw - 1.5rem))",
              overflow: "visible",
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
              className="task-details-dependency-menu-popup table-column-filter-menu task-details-dependency-menu-panel task-details-dependency-kind-panel"
              style={{
                position: "static",
                top: "auto",
                right: "auto",
                bottom: "auto",
                left: "auto",
                flex: "0 0 auto",
              }}
            >
              <div
                style={{
                  color: "var(--text-title)",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  letterSpacing: "0.03em",
                  padding: "0.15rem 0.15rem 0.35rem",
                  textTransform: "uppercase",
                }}
              >
                Add dependency
              </div>
              <div className="task-details-dependency-menu-option-stack" role="listbox">
                {TASK_DEPENDENCY_KIND_OPTIONS.map((option) => {
                  const isSelected = selectedKind === option.id;

                  return (
                    <button
                      aria-selected={isSelected}
                      className={`table-column-filter-option${isSelected ? " is-selected" : ""}${option.icon ? " has-icon" : ""}`}
                      key={option.id}
                      onClick={(milestone) => {
                        milestone.stopPropagation();
                        setSelectedKind(option.id as TaskDependencyKind);
                      }}
                      role="option"
                      type="button"
                    >
                      <span aria-hidden="true" className="table-column-filter-option-check">
                        {isSelected ? "\u2713" : ""}
                      </span>
                      {option.icon ? (
                        <span aria-hidden="true" className="table-column-filter-option-icon">
                          {option.icon}
                        </span>
                      ) : null}
                      <span>{option.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {selectedKind ? (
              <div
                className="task-details-dependency-menu-popup table-column-filter-menu task-details-dependency-menu-panel task-details-dependency-target-panel"
                style={{
                  position: "static",
                  top: "auto",
                  right: "auto",
                  bottom: "auto",
                  left: "auto",
                  flex: "0 0 auto",
                }}
              >
                <div
                  style={{
                    color: "var(--text-title)",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    letterSpacing: "0.03em",
                    padding: "0.15rem 0.15rem 0.35rem",
                    textTransform: "uppercase",
                  }}
                >
                  {TASK_DEPENDENCY_KIND_LABELS[selectedKind]} targets
                </div>
                <div className="task-details-dependency-menu-option-stack" role="listbox">
                  {currentTargetOptions.length > 0 ? (
                    currentTargetOptions.map((option) => (
                      <button
                        aria-selected={false}
                        className="table-column-filter-option"
                        key={option.id}
                        onClick={(milestone) => {
                          milestone.stopPropagation();
                          onAddDependency(selectedKind, option.id);
                          closeMenu();
                        }}
                        role="option"
                        type="button"
                      >
                        <span aria-hidden="true" className="table-column-filter-option-check" />
                        <span>{option.name}</span>
                      </button>
                    ))
                  ) : (
                    <div className="table-column-filter-empty" role="presentation">
                      No targets available
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>,
          document.body,
        )
      ) : null}
    </span>
  );
}
