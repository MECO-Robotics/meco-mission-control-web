import { useCallback, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { TaskDependencyKind } from "@/types";
import { IconChevronLeft, IconPlus } from "@/components/shared/Icons";
import type { DropdownOption } from "@/features/workspace/shared/model/workspaceTypes";
import {
  TASK_DEPENDENCY_KIND_LABELS,
  TASK_DEPENDENCY_KIND_OPTIONS,
} from "@/features/workspace/shared/task/taskTargeting";
import { FilterOptionMenu } from "../../../../shared/filters/workspaceFilterDropdownMenu";
import { useFilterDropdownMenuState } from "../../../../shared/filters/workspaceFilterDropdownHooks";

type AddStage = "kind" | "target";

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
  const [stage, setStage] = useState<AddStage>("kind");
  const [selectedKind, setSelectedKind] = useState<TaskDependencyKind | null>(null);
  const filterRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setStage("kind");
    setSelectedKind(null);
  }, []);

  const { menuOffsetX, menuPosition } = useFilterDropdownMenuState({
    buttonRef,
    filterRef,
    isOpen,
    menuRef,
    onClose: closeMenu,
    portalMenu: true,
    portalMenuPlacement: "below",
    viewSelector: ".workspace-panel, .panel, .page-shell, .modal-card",
  });

  const currentOptions = stage === "kind" ? TASK_DEPENDENCY_KIND_OPTIONS : getTargetOptions(selectedKind ?? "task");
  const currentLabel =
    stage === "kind"
      ? "Dependency type"
      : selectedKind
        ? `${TASK_DEPENDENCY_KIND_LABELS[selectedKind]} targets`
        : "Dependency targets";

  const headerContent =
    stage === "target" && selectedKind ? (
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: "0.4rem",
          justifyContent: "space-between",
          padding: "0.15rem 0.15rem 0.35rem",
        }}
      >
        <button
          aria-label="Back to dependency types"
          className="icon-button task-detail-section-action-button"
          onClick={(milestone) => {
            milestone.stopPropagation();
            setStage("kind");
            setSelectedKind(null);
          }}
          type="button"
        >
          <IconChevronLeft />
        </button>
        <span style={{ color: "var(--text-title)", fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.03em", textTransform: "uppercase" }}>
          {TASK_DEPENDENCY_KIND_LABELS[selectedKind]}
        </span>
      </div>
    ) : (
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
    );

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
          <FilterOptionMenu
            allLabel={currentLabel}
            className={menuClassName ?? className}
            headerContent={headerContent}
            key={`${stage}-${selectedKind ?? "none"}`}
            menuId={menuId}
            menuRef={menuRef}
            menuOffsetX={menuOffsetX}
            onChange={(selection) => {
              const choice = selection[0];
              if (!choice) {
                return;
              }

              if (stage === "kind") {
                setSelectedKind(choice as TaskDependencyKind);
                setStage("target");
                return;
              }

              if (selectedKind) {
                onAddDependency(selectedKind, choice);
                closeMenu();
              }
            }}
            options={currentOptions}
            showAllOption={false}
            singleSelect
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
            value={[]}
          />,
          document.body,
        )
      ) : null}
    </span>
  );
}
