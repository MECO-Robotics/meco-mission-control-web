import { NAVIGATION_SECTION_LABELS, type NavigationSection, type NavigationSubItemId, type NavigationTarget, type TaskViewTab } from "@/lib/workspaceNavigation";
import { SidebarItem, type SidebarItemConfig } from "./sidebar/SidebarItem";

const SCHEDULE_VIEWS = [
  { label: "Calendar", taskView: "calendar" },
  { label: "Agenda", taskView: "agenda" },
  { label: "Gantt", taskView: "timeline" },
] as const;

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
}

export function AppSidebarSections({
  activeSubItemId,
  isCollapsed,
  onSubItemSelect,
  onDisabledSubItemSelect,
  sectionModels,
  activeTaskView,
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
          <div aria-label="Schedule views" className="sidebar-nested-nav">
            {SCHEDULE_VIEWS.map(({ label, taskView }) => {
              const isActiveView = activeTaskView === taskView;
              return (
                <button
                  aria-current={isActiveView ? "page" : undefined}
                  aria-label={label}
                  className="sidebar-nested-nav-item"
                  data-active={isActiveView ? "true" : "false"}
                  key={taskView}
                  onClick={() => onSubItemSelect({ tab: "tasks", taskView })}
                  type="button"
                >
                  {label}
                </button>
              );
            })}
          </div>
        ) : null}
        </div>
      ))}
    </section>
  ));
}
