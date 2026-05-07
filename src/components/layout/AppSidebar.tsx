import {
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  Briefcase,
  Boxes,
  CalendarCheck,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardCheck,
  Cog,
  Columns3,
  Dumbbell,
  FileText,
  Flag,
  Folder,
  LayoutDashboard,
  LayoutGrid,
  ListTodo,
  Megaphone,
  Package,
  Plus,
  ShoppingCart,
  Users,
  Video,
  Wrench,
} from "lucide-react";

import {
  type InventoryViewTab,
  type NavigationItem,
  type NavigationSection,
  type NavigationSubItemId,
  type NavigationTarget,
  NAVIGATION_SECTION_LABELS,
  NAVIGATION_SECTION_ORDER,
  NAVIGATION_SUB_ITEMS_BY_SECTION,
  getActiveNavigationSubItemId,
  getNavigationSectionFromSubItem,
  type ReportsViewTab,
  type RosterViewTab,
  type RiskManagementViewTab,
  type TaskViewTab,
  type ViewTab,
  type WorklogsViewTab,
} from "@/lib/workspaceNavigation";
import type { ProjectType } from "@/types/common";
import type { ProjectRecord } from "@/types/recordsOrganization";
import {
  IconChevronLeft,
  IconChevronRight,
  IconEdit,
  IconHelp,
  IconParts,
  IconReports,
  IconRoster,
} from "@/components/shared/Icons";

const ADD_ROBOT_PROJECT_VALUE = "__add_robot_project__";
const POPUP_VERTICAL_MARGIN = 8;
const ROBOT_PROJECT_ICON_COLORS = [
  "#2563eb",
  "#0f766e",
  "#7c3aed",
  "#b45309",
  "#be185d",
  "#0369a1",
];
const PROJECT_TYPE_ICON_COLORS: Record<Exclude<ProjectType, "robot">, string> = {
  operations: "#0f766e",
  outreach: "#d97706",
  other: "#475569",
};
type NamedProjectCategory =
  | "media"
  | "strategy"
  | "training"
  | "business"
  | "operations";
const PROJECT_CATEGORY_ICON_COLORS: Record<NamedProjectCategory, string> = {
  media: "#dc2626",
  strategy: "#2563eb",
  training: "#9333ea",
  business: "#b45309",
  operations: "#0f766e",
};

function getNamedProjectCategory(name: string): NamedProjectCategory | null {
  const normalizedName = name.toLowerCase();

  if (normalizedName.includes("media")) {
    return "media";
  }

  if (normalizedName.includes("strategy")) {
    return "strategy";
  }

  if (normalizedName.includes("training") || normalizedName.includes("scouting")) {
    return "training";
  }

  if (normalizedName.includes("business")) {
    return "business";
  }

  if (normalizedName.includes("operations")) {
    return "operations";
  }

  return null;
}

function getProjectTypeIcon(projectType: ProjectType | null) {
  switch (projectType) {
    case "robot":
      return <Bot size={14} strokeWidth={2} />;
    case "operations":
      return <Cog size={14} strokeWidth={2} />;
    case "outreach":
      return <Megaphone size={14} strokeWidth={2} />;
    default:
      return <Folder size={14} strokeWidth={2} />;
  }
}

function getProjectIcon(
  project: Pick<ProjectRecord, "name" | "projectType"> | null,
) {
  if (project) {
    const namedCategory = getNamedProjectCategory(project.name);
    if (namedCategory === "media") {
      return <Video size={14} strokeWidth={2} />;
    }

    if (namedCategory === "strategy") {
      return <ChartNoAxesCombined size={14} strokeWidth={2} />;
    }

    if (namedCategory === "training") {
      return <Dumbbell size={14} strokeWidth={2} />;
    }

    if (namedCategory === "business") {
      return <Briefcase size={14} strokeWidth={2} />;
    }

    if (namedCategory === "operations") {
      return <Cog size={14} strokeWidth={2} />;
    }
  }

  return getProjectTypeIcon(project?.projectType ?? null);
}

function getRobotProjectIconColor(projectId: string) {
  let hash = 0;
  for (let index = 0; index < projectId.length; index += 1) {
    hash = (hash * 31 + projectId.charCodeAt(index)) | 0;
  }

  return ROBOT_PROJECT_ICON_COLORS[Math.abs(hash) % ROBOT_PROJECT_ICON_COLORS.length];
}

function getProjectIconColor(
  project: Pick<ProjectRecord, "id" | "name" | "projectType"> | null,
) {
  if (!project) {
    return "var(--official-blue)";
  }

  if (project.projectType === "robot") {
    return getRobotProjectIconColor(project.id);
  }

  const namedCategory = getNamedProjectCategory(project.name);
  if (namedCategory) {
    return PROJECT_CATEGORY_ICON_COLORS[namedCategory];
  }

  return PROJECT_TYPE_ICON_COLORS[project.projectType];
}

function clampPopupTop(
  shellElement: HTMLDivElement | null,
  popupElement: HTMLDivElement | null,
  preferredTop: number,
) {
  if (!shellElement || !popupElement) {
    return preferredTop;
  }

  const shellHeight = shellElement.getBoundingClientRect().height;
  const popupHeight = popupElement.getBoundingClientRect().height;
  const minimumTop = POPUP_VERTICAL_MARGIN;
  const maximumTop = Math.max(minimumTop, shellHeight - popupHeight - POPUP_VERTICAL_MARGIN);

  return Math.min(Math.max(preferredTop, minimumTop), maximumTop);
}

interface AppSidebarProps {
  activeTab: ViewTab;
  items: NavigationItem[];
  onSelectTarget: (
    target: NavigationTarget,
    options?: { keepSidebarOpen?: boolean },
  ) => void;
  isCollapsed: boolean;
  toggleSidebar: () => void;
  projects: ProjectRecord[];
  selectedProjectId: string | null;
  inventoryView: InventoryViewTab;
  reportsView: ReportsViewTab;
  rosterView: RosterViewTab;
  riskManagementView: RiskManagementViewTab;
  taskView: TaskViewTab;
  worklogsView: WorklogsViewTab;
  onSelectProject: (projectId: string | null) => void;
  onCreateRobot: () => void;
  onEditSelectedRobot: () => void;
}

export function AppSidebar({
  activeTab,
  items,
  onSelectTarget,
  isCollapsed,
  toggleSidebar,
  projects,
  selectedProjectId,
  inventoryView,
  reportsView,
  rosterView,
  riskManagementView,
  taskView,
  worklogsView,
  onSelectProject,
  onCreateRobot,
  onEditSelectedRobot,
}: AppSidebarProps) {
  const sidebarShellRef = useRef<HTMLDivElement | null>(null);
  const compactPopupRef = useRef<HTMLDivElement | null>(null);
  const projectPopupRef = useRef<HTMLDivElement | null>(null);
  const projectTriggerRef = useRef<HTMLButtonElement | null>(null);
  const selectedProject =
    projects.find((project) => project.id === selectedProjectId) ?? null;
  const isRobotProject = selectedProject?.projectType === "robot";
  const canEditSelectedRobot = selectedProject?.projectType === "robot";
  const selectedProjectLabel = selectedProject?.name ?? "All projects";
  const visibleTabs = useMemo(
    () => new Set(items.map((item) => item.value)),
    [items],
  );
  const activeSubItemId = getActiveNavigationSubItemId({
    activeTab,
    inventoryView,
    rosterView,
    reportsView,
    riskManagementView,
    taskView,
    worklogsView,
  });
  const activeSection = getNavigationSectionFromSubItem(activeSubItemId);
  const [expandedSection, setExpandedSection] = useState<NavigationSection>(activeSection);
  const [compactPopupSection, setCompactPopupSection] = useState<NavigationSection | null>(
    null,
  );
  const [compactPopupTop, setCompactPopupTop] = useState(0);
  const [projectPopupTop, setProjectPopupTop] = useState(0);
  const [isProjectPopupOpen, setIsProjectPopupOpen] = useState(false);

  useEffect(() => {
    setExpandedSection(activeSection);
  }, [activeSection]);

  useEffect(() => {
    if (!isCollapsed) {
      setCompactPopupSection(null);
    }
  }, [isCollapsed]);

  useEffect(() => {
    if ((!isCollapsed || compactPopupSection === null) && !isProjectPopupOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const targetNode = event.target;
      if (!(targetNode instanceof Node)) {
        return;
      }

      if (compactPopupRef.current?.contains(targetNode)) {
        return;
      }

      if (projectPopupRef.current?.contains(targetNode)) {
        return;
      }

      if (projectTriggerRef.current?.contains(targetNode)) {
        return;
      }

      if (compactPopupSection !== null) {
        setCompactPopupSection(null);
      }

      if (isProjectPopupOpen) {
        setIsProjectPopupOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCompactPopupSection(null);
        setIsProjectPopupOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [compactPopupSection, isCollapsed, isProjectPopupOpen]);

  useEffect(() => {
    if (!isCollapsed || compactPopupSection === null) {
      return;
    }

    const clampedTop = clampPopupTop(
      sidebarShellRef.current,
      compactPopupRef.current,
      compactPopupTop,
    );

    if (Math.abs(clampedTop - compactPopupTop) > 0.5) {
      setCompactPopupTop(clampedTop);
    }
  }, [compactPopupSection, compactPopupTop, isCollapsed]);

  useEffect(() => {
    if (!isProjectPopupOpen) {
      return;
    }

    const clampedTop = clampPopupTop(
      sidebarShellRef.current,
      projectPopupRef.current,
      projectPopupTop,
    );

    if (Math.abs(clampedTop - projectPopupTop) > 0.5) {
      setProjectPopupTop(clampedTop);
    }
  }, [isProjectPopupOpen, projectPopupTop]);

  const sectionIcons: Record<NavigationSection, ReactNode> = {
    dashboard: <LayoutDashboard size={14} strokeWidth={2} />,
    readiness: <ClipboardCheck size={14} strokeWidth={2} />,
    config: <Cog size={14} strokeWidth={2} />,
    tasks: <ListTodo size={14} strokeWidth={2} />,
    inventory: <IconParts />,
    roster: <IconRoster />,
    reports: <IconReports />,
  };
  const subItemIcons: Record<NavigationSubItemId, ReactNode> = {
    "dashboard-calendar": <CalendarDays size={14} strokeWidth={2} />,
    "dashboard-activity": <FileText size={14} strokeWidth={2} />,
    "dashboard-metrics": <BarChart3 size={14} strokeWidth={2} />,
    "readiness-attention": <AlertTriangle size={14} strokeWidth={2} />,
    "readiness-milestones": <Flag size={14} strokeWidth={2} />,
    "readiness-subsystems": <Cog size={14} strokeWidth={2} />,
    "readiness-risks": <AlertTriangle size={14} strokeWidth={2} />,
    "config-robot-model": <Bot size={14} strokeWidth={2} />,
    "config-part-mappings": <Boxes size={14} strokeWidth={2} />,
    "config-directory": <Users size={14} strokeWidth={2} />,
    "tasks-timeline": <CalendarDays size={14} strokeWidth={2} />,
    "tasks-board": <Columns3 size={14} strokeWidth={2} />,
    "tasks-manufacturing": <Wrench size={14} strokeWidth={2} />,
    "inventory-materials": <Package size={14} strokeWidth={2} />,
    "inventory-parts": <Boxes size={14} strokeWidth={2} />,
    "inventory-purchases": <ShoppingCart size={14} strokeWidth={2} />,
    "roster-workload": <BarChart3 size={14} strokeWidth={2} />,
    "roster-attendance": <CalendarCheck size={14} strokeWidth={2} />,
    "reports-work-logs": <FileText size={14} strokeWidth={2} />,
    "reports-qa-forms": <ClipboardCheck size={14} strokeWidth={2} />,
    "reports-milestone-results": <Flag size={14} strokeWidth={2} />,
  };

  const sectionVisibility: Record<NavigationSection, boolean> = {
    dashboard: visibleTabs.has("tasks") || visibleTabs.has("risk-management"),
    readiness:
      visibleTabs.has("tasks") ||
      visibleTabs.has("risk-management") ||
      visibleTabs.has("subsystems"),
    config: visibleTabs.has("tasks") || visibleTabs.has("roster") || visibleTabs.has("inventory"),
    tasks: visibleTabs.has("tasks"),
    inventory: visibleTabs.has("inventory"),
    roster: visibleTabs.has("roster"),
    reports: visibleTabs.has("reports") || visibleTabs.has("worklogs"),
  };

  const handleProjectChange = (value: string) => {
    if (value === ADD_ROBOT_PROJECT_VALUE) {
      onCreateRobot();
      return;
    }

    onSelectProject(value || null);
  };

  const handleHelpSelect = () => {
    setCompactPopupSection(null);
    setIsProjectPopupOpen(false);
    onSelectTarget({ tab: "help" }, { keepSidebarOpen: true });
  };

  const getSectionSubItems = (section: NavigationSection) =>
    NAVIGATION_SUB_ITEMS_BY_SECTION[section].filter((subItem) => {
      if (subItem.id === "dashboard-calendar") {
        return visibleTabs.has("tasks");
      }

      if (subItem.id === "dashboard-metrics") {
        return visibleTabs.has("risk-management");
      }

      if (subItem.id === "dashboard-activity") {
        return visibleTabs.has("worklogs");
      }

      if (subItem.id === "readiness-attention") {
        return visibleTabs.has("risk-management");
      }

      if (subItem.id === "readiness-risks") {
        return visibleTabs.has("risk-management");
      }

      if (subItem.id === "readiness-milestones") {
        return visibleTabs.has("tasks");
      }

      if (subItem.id === "readiness-subsystems") {
        return visibleTabs.has("subsystems");
      }

      if (subItem.id === "config-robot-model") {
        return visibleTabs.has("tasks") && isRobotProject;
      }

      if (subItem.id === "config-part-mappings") {
        return visibleTabs.has("inventory") && isRobotProject;
      }

      if (subItem.id === "config-directory") {
        return visibleTabs.has("roster");
      }

      if (subItem.id === "tasks-manufacturing") {
        return visibleTabs.has("manufacturing");
      }

      if (subItem.id === "inventory-parts") {
        return isRobotProject;
      }

      if (subItem.id === "reports-work-logs") {
        return visibleTabs.has("worklogs");
      }

      return true;
    });

  const handleSectionClick = (
    section: NavigationSection,
    event: ReactMouseEvent<HTMLButtonElement>,
  ) => {
    const subItems = getSectionSubItems(section);
    if (subItems.length === 0) {
      return;
    }

    if (isCollapsed) {
      const shellRect = sidebarShellRef.current?.getBoundingClientRect();
      const targetRect = event.currentTarget.getBoundingClientRect();
      const popupTop = shellRect ? targetRect.top - shellRect.top : 0;
      setCompactPopupTop(popupTop);
      setIsProjectPopupOpen(false);
      setCompactPopupSection((current) => (current === section ? null : section));
      return;
    }

    setExpandedSection(section);
    onSelectTarget(subItems[0].target, { keepSidebarOpen: true });
  };

  const handleSubItemSelect = (target: NavigationTarget) => {
    onSelectTarget(target);
    setCompactPopupSection(null);
  };

  const handleProjectTriggerClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    const shellRect = sidebarShellRef.current?.getBoundingClientRect();
    const targetRect = event.currentTarget.getBoundingClientRect();
    const popupTop = shellRect ? targetRect.top - shellRect.top : 0;
    setProjectPopupTop(popupTop);
    if (isCollapsed) {
      setCompactPopupSection(null);
    }

    setIsProjectPopupOpen((current) => !current);
  };

  const renderProjectOption = (
    label: string,
    icon: ReactNode,
    iconColor: string,
    isActive: boolean,
    onSelect: () => void,
    key: string,
  ) => (
    <button
      className="sidebar-project-option"
      data-active={isActive ? "true" : "false"}
      key={key}
      onClick={() => {
        onSelect();
        setIsProjectPopupOpen(false);
      }}
      type="button"
    >
      <span
        aria-hidden="true"
        className="sidebar-project-option-icon"
        style={{ color: iconColor }}
      >
        {icon}
      </span>
      <span className="sidebar-project-option-label">{label}</span>
    </button>
  );

  const projectOptionsContent = (
    <>
      {projects.length === 0 ? (
        <button className="sidebar-project-option" disabled type="button">
          No projects
        </button>
      ) : (
        <>
          {renderProjectOption(
            "All projects",
            <LayoutGrid size={14} strokeWidth={2} />,
            "var(--official-blue)",
            selectedProjectId === null,
            () => handleProjectChange(""),
            "all-projects",
          )}
          {projects.map((project) =>
            renderProjectOption(
              project.name,
              getProjectIcon(project),
              getProjectIconColor(project),
              selectedProjectId === project.id,
              () => handleProjectChange(project.id),
              project.id,
            ),
          )}
        </>
      )}
      {renderProjectOption(
        "Add robot",
        <Plus size={14} strokeWidth={2} />,
        "var(--meco-blue)",
        false,
        () => handleProjectChange(ADD_ROBOT_PROJECT_VALUE),
        ADD_ROBOT_PROJECT_VALUE,
      )}
    </>
  );

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
    <div
      className="sidebar-shell"
      data-collapsed={isCollapsed ? "true" : "false"}
      ref={sidebarShellRef}
    >
      <nav
        aria-label="Workspace views"
        className="sidebar"
        data-collapsed={isCollapsed ? "true" : "false"}
      >
        {toggleButton}

        {NAVIGATION_SECTION_ORDER.filter((section) => sectionVisibility[section]).map(
          (section) => {
            const subItems = getSectionSubItems(section);
            const isExpanded = !isCollapsed && expandedSection === section;

            return (
              <div className="sidebar-section-group" key={section}>
                <button
                  className="tab sidebar-section-toggle"
                  data-active={activeSection === section ? "true" : "false"}
                  data-tutorial-target={`sidebar-tab-${section}`}
                  onClick={(event) => handleSectionClick(section, event)}
                  type="button"
                >
                  <span className="sidebar-tab-main">
                    <span aria-hidden="true" className="sidebar-tab-icon">
                      {sectionIcons[section]}
                    </span>
                    {!isCollapsed ? (
                      <span className="sidebar-tab-label">
                        {NAVIGATION_SECTION_LABELS[section]}
                      </span>
                    ) : null}
                  </span>
                  {!isCollapsed ? (
                    <span
                      aria-hidden="true"
                      className={`sidebar-section-chevron${
                        isExpanded ? " is-expanded" : ""
                      }`}
                    >
                      <IconChevronRight />
                    </span>
                  ) : null}
                </button>

                {isExpanded ? (
                  <div className="sidebar-subtab-list">
                    {subItems.map((subItem) => (
                      <button
                        className="sidebar-subtab"
                        data-active={activeSubItemId === subItem.id ? "true" : "false"}
                        key={subItem.id}
                        onClick={() => handleSubItemSelect(subItem.target)}
                        type="button"
                      >
                        <span aria-hidden="true" className="sidebar-subtab-icon">
                          {subItemIcons[subItem.id]}
                        </span>
                        <span className="sidebar-subtab-label">{subItem.label}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          },
        )}

        {!isCollapsed ? (
          <div className="sidebar-footer-stack">
            <button
              className="tab sidebar-footer-help-button"
              data-active={activeTab === "help" ? "true" : "false"}
              onClick={handleHelpSelect}
              type="button"
            >
              <span className="sidebar-tab-main">
                <span aria-hidden="true" className="sidebar-tab-icon">
                  <IconHelp />
                </span>
                <span className="sidebar-tab-label">Help</span>
              </span>
            </button>
            <div className="sidebar-context-picker sidebar-project-picker">
              <span className="sidebar-context-label">Project</span>
              <div className="sidebar-project-compact-row" data-tutorial-target="project-select-outreach">
                <button
                  aria-expanded={isProjectPopupOpen ? "true" : "false"}
                  aria-label="Select project"
                  className="sidebar-project-trigger"
                  data-tutorial-target="project-select"
                  onClick={handleProjectTriggerClick}
                  ref={projectTriggerRef}
                  type="button"
                >
                  <span
                    aria-hidden="true"
                    className="sidebar-tab-icon"
                    style={{ color: getProjectIconColor(selectedProject) }}
                  >
                    {getProjectIcon(selectedProject)}
                  </span>
                  <span className="sidebar-project-trigger-label">{selectedProjectLabel}</span>
                  <span
                    aria-hidden="true"
                    className={`sidebar-project-trigger-chevron${
                      isProjectPopupOpen ? " is-open" : ""
                    }`}
                  >
                    <IconChevronRight />
                  </span>
                </button>
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
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <div className="sidebar-footer-stack sidebar-footer-stack-collapsed">
            <button
              aria-label="Help"
              className="tab sidebar-help-collapsed-trigger"
              data-active={activeTab === "help" ? "true" : "false"}
              onClick={handleHelpSelect}
              type="button"
            >
              <span className="sidebar-tab-main">
                <span aria-hidden="true" className="sidebar-tab-icon">
                  <IconHelp />
                </span>
              </span>
            </button>
            <div className="sidebar-project-collapsed-slot">
              <button
                aria-expanded={isProjectPopupOpen ? "true" : "false"}
                aria-label="Select project"
                className="tab sidebar-project-collapsed-trigger"
                data-tutorial-target="project-select"
                onClick={handleProjectTriggerClick}
                ref={projectTriggerRef}
                type="button"
              >
                <span className="sidebar-tab-main">
                  <span
                    aria-hidden="true"
                    className="sidebar-tab-icon"
                    style={{ color: getProjectIconColor(selectedProject) }}
                  >
                    {getProjectIcon(selectedProject)}
                  </span>
                </span>
              </button>
            </div>
          </div>
        )}
      </nav>
      {isCollapsed && compactPopupSection !== null ? (
        <div
          className="sidebar-compact-popup"
          ref={compactPopupRef}
          style={{ top: `${compactPopupTop}px` }}
        >
          <p className="sidebar-compact-popup-title">
            {NAVIGATION_SECTION_LABELS[compactPopupSection]}
          </p>
          {getSectionSubItems(compactPopupSection).map((subItem) => (
            <button
              className="sidebar-compact-popup-item"
              data-active={activeSubItemId === subItem.id ? "true" : "false"}
              key={subItem.id}
              onClick={() => handleSubItemSelect(subItem.target)}
              type="button"
            >
              <span aria-hidden="true" className="sidebar-subtab-icon">
                {subItemIcons[subItem.id]}
              </span>
              <span className="sidebar-subtab-label">{subItem.label}</span>
            </button>
          ))}
        </div>
      ) : null}
      {isProjectPopupOpen ? (
        <div
          className="sidebar-compact-popup sidebar-project-compact-popup"
          ref={projectPopupRef}
          style={{ top: `${projectPopupTop}px` }}
        >
          <p className="sidebar-compact-popup-title">Project</p>
          {projectOptionsContent}
        </div>
      ) : null}
    </div>
  );
}
