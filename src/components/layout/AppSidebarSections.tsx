import { History, List, type LucideIcon } from "lucide-react";

import { NAVIGATION_SECTION_LABELS, type NavigationSection, type NavigationSubItemId, type NavigationTarget, type TaskViewTab, type WorklogsViewTab } from "@/lib/workspaceNavigation";
import { SidebarItem, type SidebarItemConfig } from "./sidebar/SidebarItem";

const ACTIVITY_VIEWS = [
  { icon: List, label: "Work logs", key: "logs", target: { tab: "worklogs", worklogsView: "logs" } },
  { icon: History, label: "Changes", key: "activity", target: { tab: "worklogs", worklogsView: "activity" } },
] as const;
const SUBVIEW_PARENT_IDS = new Set<NavigationSubItemId>([
  "work-activity",
]);

interface SidebarSubview {
  icon: LucideIcon;
  key: string;
  label: string;
  target: NavigationTarget;
}

function SidebarSubviews({ activeKey, ariaLabel, compact, items, onSelect, title }: {
  activeKey: string;
  ariaLabel: string;
  compact: boolean;
  items: readonly SidebarSubview[];
  onSelect: (target: NavigationTarget) => void;
  title: string;
}) {
  return (
    <div aria-label={ariaLabel} className={`sidebar-nested-nav${compact ? " sidebar-nested-nav-compact" : ""}`} role="group">
      {compact ? <p className="sidebar-nested-nav-title">{title}</p> : null}
      {items.map(({ icon: Icon, key, label, target }) => {
        const isActiveView = activeKey === key;
        return (
          <button
            aria-current={isActiveView ? "page" : undefined}
            aria-label={label}
            className="sidebar-nested-nav-item"
            data-active={isActiveView ? "true" : "false"}
            key={key}
            onClick={() => onSelect(target)}
            type="button"
          >
            <Icon aria-hidden="true" className="sidebar-nested-nav-icon" size={14} strokeWidth={1.9} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

export type SidebarSubItemModel = SidebarItemConfig;

interface SidebarSectionModel {
  section: NavigationSection;
  subItems: SidebarSubItemModel[];
}

interface AppSidebarSectionsProps {
  activeSubItemId: NavigationSubItemId | null;
  isCollapsed: boolean;
  onSubItemSelect: (target: NavigationTarget) => void;
  onDisabledSubItemSelect: () => void;
  sectionModels: SidebarSectionModel[];
  activeTaskView: TaskViewTab;
  activeWorklogsView: WorklogsViewTab;
}

export function AppSidebarSections({
  activeSubItemId,
  isCollapsed,
  onSubItemSelect,
  onDisabledSubItemSelect,
  sectionModels,
  activeWorklogsView,
}: AppSidebarSectionsProps) {
  return sectionModels.map(({ section, subItems }) => (
    <section className="sidebar-section-group" aria-label={NAVIGATION_SECTION_LABELS[section]} key={section}>
      {!isCollapsed && (
        <h2 className="sidebar-section-heading">
          {NAVIGATION_SECTION_LABELS[section]}
        </h2>
      )}
      {subItems.map((item) => (
        <div
          className="sidebar-nav-group"
          data-has-compact-subitems={isCollapsed && SUBVIEW_PARENT_IDS.has(item.id) ? "true" : undefined}
          key={item.id}
        >
        <SidebarItem
          config={item}
          isActive={activeSubItemId === item.id}
          activeViewId={activeSubItemId ?? ""}
          isCollapsed={isCollapsed}
          hasSubItems={SUBVIEW_PARENT_IDS.has(item.id)}
          onSelect={(config) => onSubItemSelect(config.target)}
          onDisabledSelect={() => onDisabledSubItemSelect()}
        />
        {item.id === "work-activity" && (isCollapsed || activeSubItemId === "work-activity") ? (
          <SidebarSubviews activeKey={activeWorklogsView} ariaLabel="Activity views" compact={isCollapsed} items={ACTIVITY_VIEWS} onSelect={onSubItemSelect} title="Activity" />
        ) : null}
        </div>
      ))}
    </section>
  ));
}
