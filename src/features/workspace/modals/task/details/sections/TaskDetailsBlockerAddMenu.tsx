import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import type { TaskBlockerType } from "@/types";
import {
  IconCheck,
  IconChevronLeft,
  IconMapPin,
  IconManufacturing,
  IconParts,
  IconPerson,
  IconPlus,
  IconReports,
  IconSubsystems,
  IconTasks,
} from "@/components/shared/Icons";
import { useFilterDropdownMenuState } from "../../../../shared/filters/workspaceFilterDropdownHooks";

type BlockerAddStage = "type" | "description";

type BlockerTypeOption = {
  icon: ReactNode;
  id: TaskBlockerType;
  name: string;
};

const BLOCKER_TYPE_OPTIONS: BlockerTypeOption[] = [
  { id: "task", name: "Task", icon: <IconTasks /> },
  { id: "milestone", name: "Milestone", icon: <IconMapPin /> },
  { id: "workstream", name: "Workstream", icon: <IconSubsystems /> },
  { id: "mechanism", name: "Mechanism", icon: <IconManufacturing /> },
  { id: "part_instance", name: "Part instance", icon: <IconParts /> },
  { id: "artifact_instance", name: "Artifact instance", icon: <IconReports /> },
  { id: "external", name: "External", icon: <IconPerson /> },
];

const BLOCKER_TYPE_LABELS: Record<TaskBlockerType, string> = {
  artifact_instance: "Artifact instance",
  external: "External",
  mechanism: "Mechanism",
  milestone: "Milestone",
  part_instance: "Part instance",
  task: "Task",
  workstream: "Workstream",
};

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
  const [stage, setStage] = useState<BlockerAddStage>("type");
  const [selectedType, setSelectedType] = useState<TaskBlockerType | null>(null);
  const [description, setDescription] = useState("");
  const filterRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const descriptionInputRef = useRef<HTMLInputElement>(null);
  const menuId = useId();

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setStage("type");
    setSelectedType(null);
    setDescription("");
  }, []);

  const submitBlocker = useCallback(() => {
    if (!selectedType) {
      return;
    }

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
    if (!isOpen || stage !== "description") {
      return;
    }

    const handleFocus = window.requestAnimationFrame(() => {
      descriptionInputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(handleFocus);
  }, [isOpen, stage, selectedType]);

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
            {stage === "type" ? (
              <>
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
                <div style={{ display: "grid", gap: "0.25rem" }}>
                  {BLOCKER_TYPE_OPTIONS.map((option) => (
                    <button
                      aria-selected={selectedType === option.id}
                      className={`table-column-filter-option${selectedType === option.id ? " is-selected" : ""} has-icon`}
                      key={option.id}
                      onClick={(milestone) => {
                        milestone.stopPropagation();
                        setSelectedType(option.id);
                        setDescription("");
                        setStage("description");
                      }}
                      role="option"
                      type="button"
                    >
                      <span aria-hidden="true" className="table-column-filter-option-check">
                        {selectedType === option.id ? "\u2713" : ""}
                      </span>
                      <span aria-hidden="true" className="table-column-filter-option-icon">
                        {option.icon}
                      </span>
                      <span>{option.name}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div
                  style={{
                    alignItems: "center",
                    display: "flex",
                    gap: "0.4rem",
                    justifyContent: "space-between",
                    padding: "0.15rem 0.15rem 0.4rem",
                  }}
                >
                  <button
                    aria-label="Back to blocker types"
                    className="icon-button task-detail-section-action-button"
                    onClick={(milestone) => {
                      milestone.stopPropagation();
                      setStage("type");
                      setDescription("");
                    }}
                    type="button"
                  >
                    <IconChevronLeft />
                  </button>
                  <span
                    style={{
                      color: "var(--text-title)",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      letterSpacing: "0.03em",
                      textTransform: "uppercase",
                    }}
                  >
                    {selectedType ? BLOCKER_TYPE_LABELS[selectedType] : "Blocker"}
                  </span>
                </div>
                <label
                  style={{
                    color: "var(--text-title)",
                    display: "grid",
                    gap: "0.35rem",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                  }}
                >
                  <span>Describe blocker</span>
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
              </>
            )}
          </div>,
          document.body,
        )
      ) : null}
    </span>
  );
}
