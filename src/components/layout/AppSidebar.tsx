import type { NavigationItem, ViewTab } from "@/lib/workspaceNavigation";
import type { ProjectRecord } from "@/types/recordsOrganization";
import { IconChevronLeft, IconChevronRight, IconEdit } from "@/components/shared/Icons";

const ADD_ROBOT_PROJECT_VALUE = "__add_robot_project__";

interface AppSidebarProps {
  activeTab: ViewTab;
  items: NavigationItem[];
  onSelectTab: (tab: ViewTab) => void;
  isCollapsed: boolean;
  toggleSidebar: () => void;
  projects: ProjectRecord[];
  selectedProjectId: string | null;
  onSelectProject: (projectId: string | null) => void;
  onCreateRobot: () => void;
  onEditSelectedRobot: () => void;
}

export function AppSidebar({
  activeTab,
  items,
  onSelectTab,
  isCollapsed,
  toggleSidebar,
  projects,
  selectedProjectId,
  onSelectProject,
  onCreateRobot,
  onEditSelectedRobot,
}: AppSidebarProps) {
  const selectedProject =
    projects.find((project) => project.id === selectedProjectId) ?? null;
  const canEditSelectedRobot = selectedProject?.projectType === "robot";
  const toggleInsertIndex = items.findIndex((item) => item.value === "tasks");
  const insertIndex = toggleInsertIndex >= 0 ? toggleInsertIndex : 0;

  const handleProjectChange = (value: string) => {
    if (value === ADD_ROBOT_PROJECT_VALUE) {
      onCreateRobot();
      return;
    }

    onSelectProject(value || null);
  };

  const toggleButton = (
    <button
      key="sidebar-toggle"
      aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      className="tab"
      onClick={toggleSidebar}
      title="Toggle sidebar"
      type="button"
    >
      <span className="sidebar-tab-main">
        <span aria-hidden="true" className="sidebar-tab-icon">
          {isCollapsed ? <IconChevronRight /> : <IconChevronLeft />}
        </span>
        {!isCollapsed ? (
          <span className="sidebar-tab-label">
            {isCollapsed ? "Unfold sidebar" : "Collapse sidebar"}
          </span>
        ) : null}
      </span>
    </button>
  );

  return (
    <div className="sidebar-shell" data-collapsed={isCollapsed ? "true" : "false"}>
      <nav
        aria-label="Workspace views"
        className="sidebar"
        data-collapsed={isCollapsed ? "true" : "false"}
      >
        {items.flatMap((item, index) => {
          const itemButton = (
            <button
              key={item.value}
              className="tab"
              data-active={activeTab === item.value ? "true" : "false"}
              data-tutorial-target={`sidebar-tab-${item.value}`}
              onClick={() => onSelectTab(item.value)}
              type="button"
            >
              <span className="sidebar-tab-main">
                <span
                  aria-hidden="true"
                  className="sidebar-tab-icon"
                >
                  {item.icon}
                </span>
                {!isCollapsed ? (
                  <span className="sidebar-tab-label">{item.label}</span>
                ) : null}
              </span>
            </button>
          );

          return index === insertIndex ? [toggleButton, itemButton] : [itemButton];
        })}

        {items.length === 0 ? toggleButton : null}

        {!isCollapsed ? (
          <label className="sidebar-context-picker">
            <span className="sidebar-context-label">Project</span>
            <div className="sidebar-context-picker-row" data-tutorial-target="project-select-outreach">
              <select
                className="sidebar-context-select"
                data-tutorial-target="project-select"
                onChange={(milestone) => handleProjectChange(milestone.target.value)}
                value={selectedProjectId ?? ""}
              >
                {projects.length === 0 ? (
                  <option value="" disabled>
                    No projects
                  </option>
                ) : (
                  <>
                    <option value="">All projects</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </>
                )}
                <option value={ADD_ROBOT_PROJECT_VALUE}>Add robot</option>
              </select>
              {canEditSelectedRobot ? (
                <button
                  aria-label="Edit robot name"
                  className="sidebar-context-action"
                  onClick={onEditSelectedRobot}
                  title="Edit robot name"
                  type="button"
                >
                  <IconEdit />
                </button>
              ) : (
                null
              )}
            </div>
          </label>
        ) : null}
      </nav>
    </div>
  );
}
