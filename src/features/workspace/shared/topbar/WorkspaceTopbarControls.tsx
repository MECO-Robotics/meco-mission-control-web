import type { ReactNode } from "react";

interface WorkspaceTopbarControlsProps {
  actionsEnd?: ReactNode;
  actionsStart?: ReactNode;
  addMenu?: ReactNode;
  children?: ReactNode;
  className?: string;
  search?: ReactNode;
  variant?: "default" | "compact" | "standard";
}

const VARIANT_TO_CLASS: Record<NonNullable<WorkspaceTopbarControlsProps["variant"]>, string> = {
  default: "workspace-topbar-controls--default",
  compact: "workspace-topbar-controls--compact",
  standard: "workspace-topbar-controls--standard",
};

export function WorkspaceTopbarControls({
  actionsEnd,
  actionsStart,
  addMenu,
  children,
  className,
  search,
  variant = "standard",
}: WorkspaceTopbarControlsProps) {
  const variantClass = VARIANT_TO_CLASS[variant ?? "standard"];
  const rootClassName = [
    "panel-actions",
    "filter-toolbar",
    "workspace-topbar-controls",
    variantClass,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClassName}>
      {actionsStart}
      {search}
      {children}
      {actionsEnd}
      {addMenu}
    </div>
  );
}
