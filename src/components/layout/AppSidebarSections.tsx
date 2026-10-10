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

interface SidebarSubview {
  icon: LucideIcon;
  key: string;
  label: string;
  target: NavigationTarget;
}

function SidebarSubviews({ activeKey, ariaLabel, items, onSelect }: {
  activeKey: string;
  ariaLabel: string;
  items: readonly SidebarSubview[];
  onSelect: (target: NavigationTarget) => void;
}) {
  return (
    <div aria-label={ariaLabel} className="sidebar-nested-nav">
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
        <div className="sidebar-nav-group" key={item.id}>
        <SidebarItem
          config={item}
          isActive={activeSubItemId === item.id}
          activeViewId={activeSubItemId ?? ""}
          isCollapsed={isCollapsed}
          onSelect={(config) => onSubItemSelect(config.target)}
          onDisabledSelect={() => onDisabledSubItemSelect()}
        />
        {item.id === "work-schedule" && activeSubItemId === "work-schedule" && !isCollapsed ? (
          <SidebarSubviews activeKey={activeTaskView} ariaLabel="Schedule views" items={SCHEDULE_VIEWS} onSelect={onSubItemSelect} />
        ) : null}
        {item.id === "work-activity" && activeSubItemId === "work-activity" && !isCollapsed ? (
          <SidebarSubviews activeKey={activeWorklogsView} ariaLabel="Activity views" items={ACTIVITY_VIEWS} onSelect={onSubItemSelect} />
        ) : null}
        {item.id === "resources-qa-reports" && activeSubItemId === "resources-qa-reports" && !isCollapsed ? (
          <SidebarSubviews activeKey={activeWorklogsView} ariaLabel="QA and report views" items={QA_REPORT_VIEWS} onSelect={onSubItemSelect} />
        ) : null}
        </div>
      ))}
    </section>
  ));
}
