import { CalendarDays, ChartGantt, ClipboardCheck, FileText, History, List, type LucideIcon } from "lucide-react";

import { NAVIGATION_SECTION_LABELS, type NavigationSection, type NavigationSubItemId, type NavigationTarget, type TaskViewTab, type WorklogsViewTab } from "@/lib/workspaceNavigation";
import { SidebarItem, type SidebarItemConfig } from "./sidebar/SidebarItem";

const SCHEDULE_VIEWS = [
  { icon: CalendarDays, label: "Calendar", key: "calendar", target: { tab: "tasks", taskView: "calendar" } },
  { icon: List, label: "Agenda", key: "agenda", target: { tab: "tasks", taskView: "agenda" } },
  { icon: ChartGantt, label: "Gantt", key: "timeline", target: { tab: "tasks", taskView: "timeline" } },
] as const;
const ACTIVITY_VIEWS = [
  { icon: List, label: "Work logs", key: "logs", target: { tab: "worklogs", worklogsView: "logs" } },
  { icon: History, label: "Changes", key: "activity", target: { tab: "worklogs", worklogsView: "activity" } },
] as const;
const QA_REPORT_VIEWS = [
  { icon: ClipboardCheck, label: "QA results", key: "qa", target: { tab: "worklogs", worklogsView: "qa" } },
  { icon: FileText, label: "Milestone results", key: "results", target: { tab: "worklogs", worklogsView: "results" } },
] as const;
const SUBVIEW_PARENT_IDS = new Set<NavigationSubItemId>([
  "work-schedule",
  "work-activity",
  "resources-qa-reports",
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
  activeTaskView,
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
        {item.id === "work-schedule" && (isCollapsed || activeSubItemId === "work-schedule") ? (
          <SidebarSubviews activeKey={activeTaskView} ariaLabel="Schedule views" compact={isCollapsed} items={SCHEDULE_VIEWS} onSelect={onSubItemSelect} title="Schedule" />
        ) : null}
        {item.id === "work-activity" && (isCollapsed || activeSubItemId === "work-activity") ? (
          <SidebarSubviews activeKey={activeWorklogsView} ariaLabel="Activity views" compact={isCollapsed} items={ACTIVITY_VIEWS} onSelect={onSubItemSelect} title="Activity" />
        ) : null}
        {item.id === "resources-qa-reports" && (isCollapsed || activeSubItemId === "resources-qa-reports") ? (
          <SidebarSubviews activeKey={activeWorklogsView} ariaLabel="QA and report views" compact={isCollapsed} items={QA_REPORT_VIEWS} onSelect={onSubItemSelect} title="QA / Reports" />
        ) : null}
        </div>
      ))}
    </section>
  ));
}
