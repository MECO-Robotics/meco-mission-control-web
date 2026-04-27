import type { NavigationItem, ViewTab } from "@/lib/workspaceNavigation";
import type { ProjectRecord } from "@/types";
import { IconEdit } from "@/components/shared";

const ADD_ROBOT_PROJECT_VALUE = "__add_robot_project__";

interface AppSidebarProps {
  activeTab: ViewTab;
  items: NavigationItem[];
  onSelectTab: (tab: ViewTab) => void;
  isCollapsed: boolean;
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
  projects,
  selectedProjectId,
  onSelectProject,
  onCreateRobot,
  onEditSelectedRobot,
}: AppSidebarProps) {
  const selectedProject =
    projects.find((project) => project.id === selectedProjectId) ?? null;
  const canEditSelectedRobot = selectedProject?.projectType === "robot";

  const handleProjectChange = (value: string) => {
    if (value === ADD_ROBOT_PROJECT_VALUE) {
      onCreateRobot();
      return;
    }

    onSelectProject(value || null);
  };

  return (
    <nav
      aria-label="Workspace views"
      className="sidebar"
      data-collapsed={isCollapsed ? "true" : "false"}
    >
      {items.map(({ value, label, icon }) => {
        const isActive = activeTab === value;

        return (
          <button
            key={value}
            className="tab"
            data-active={isActive ? "true" : "false"}
            data-tutorial-target={`sidebar-tab-${value}`}
            onClick={() => onSelectTab(value)}
            type="button"
          >
            <span className="sidebar-tab-main">
              <span
                aria-hidden="true"
                className="sidebar-tab-icon"
              >
                {icon}
              </span>
              {!isCollapsed ? (
                <span className="sidebar-tab-label">{label}</span>
              ) : null}
            </span>
          </button>
        );
      })}

      {!isCollapsed ? (
        <label className="sidebar-context-picker">
          <span className="sidebar-context-label">Project</span>
          <div className="sidebar-context-picker-row" data-tutorial-target="project-select-outreach">
            <select
              className="sidebar-context-select"
              data-tutorial-target="project-select"
              onChange={(event) => handleProjectChange(event.target.value)}
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
  );
}
