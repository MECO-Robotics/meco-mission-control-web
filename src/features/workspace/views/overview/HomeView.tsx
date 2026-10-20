import { useMemo, useState } from "react";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import { useRememberedViewState } from "@/features/workspace/shared/navigation/WorkspaceViewMemory";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import { buildAttentionQueue, type AttentionQueueRow } from "../attention/attentionQueue";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { BootstrapPayload } from "@/types/bootstrap";
import { HomeWorkChart } from "./HomeWorkChart";
import { HomeTaskStatusDistribution } from "./HomeTaskStatusDistribution";
import { HomeDeadlineChart } from "./HomeDeadlineChart";
import { HomeDependencyTree } from "./HomeDependencyTree";
import { HomeDashboardDetails, type HomeDashboardSelection } from "./HomeDashboardDetails";
import { buildHomeViewModel } from "./overviewViewModel";
import { buildHomePressureGroups, type HomePressureBucket } from "./homePressureModel";
import { buildHomeWorkloadModel } from "./homeWorkloadModel";
import { buildHomeDeadlineModel } from "./homeDeadlineModel";
import { buildHomeDependencyModel, type HomeDependencySelection } from "./homeDependencyModel";
import "./dashboardCharts.css";

interface HomeViewProps {
  activePersonFilter?: FilterSelection;
  bootstrap: BootstrapPayload;
  onOpenActionItem: (item: AttentionQueueRow) => void;
  onOpenAllActions: () => void;
  onOpenTask: (taskId: string) => void;
  onOpenSchedule: (milestoneId: string) => void;
  projectId?: string | null;
  scopeLabel?: string;
  today?: Date;
}

export function HomeView({ activePersonFilter = [], bootstrap, onOpenActionItem, onOpenAllActions, onOpenTask,
  onOpenSchedule, projectId = null, scopeLabel = "All projects", today = new Date() }: HomeViewProps) {
  const [search, setSearch] = useRememberedViewState("home.search", "");
  const [workGroup, setWorkGroup] = useRememberedViewState<HomePressureBucket>("home.work.group", "team");
  const [selection, setSelection] = useState<HomeDashboardSelection | null>(null);
  const close = () => setSelection(null);
  const model = useMemo(() => buildHomeViewModel({ activePersonFilter, bootstrap, projectId, search }),
    [activePersonFilter, bootstrap, projectId, search]);
  const workItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const scopedTaskIds = new Set(model.tasks.map(task => task.id));
    return buildAttentionQueue({ activePersonFilter, bootstrap, projectId, today, includeAllUnfinishedTasks: true })
      .filter(item => item.source === "task" ? scopedTaskIds.has(item.recordId)
        : `${item.title} ${item.detail}`.toLocaleLowerCase().includes(query));
  }, [activePersonFilter, bootstrap, projectId, search, today, model.tasks]);
  const workGroups = buildHomePressureGroups(workItems, workGroup, bootstrap, { activePersonFilter });
  const workload = buildHomeWorkloadModel({ tasks: model.tasks, groups: workGroups });
  const deadlines = buildHomeDeadlineModel({ tasks: model.tasks, milestones: model.milestones, today });
  const dependencies = buildHomeDependencyModel(model.tasks, bootstrap);
  const selectDependency = (dependency: HomeDependencySelection) => setSelection({ kind: "dependency", key: `${dependency.kind}:${dependency.id}` });

  return <section className={`panel dense-panel overview-shell home-view ${WORKSPACE_PANEL_CLASS}`}>
    <TopbarResponsiveSearch ariaLabel="Search dashboard records" placeholder="Search tasks, risks and milestones…"
      compactPlaceholder="Search" value={search} onChange={value => { close(); setSearch(value); }} />

    <div className="home-dashboard-lead-grid">
      <HomeWorkChart groupBy={workGroup} onGroupChange={group => { close(); setWorkGroup(group); }} model={workload}
        onSelectWorkload={(rowId, state) => setSelection({ kind: "workload", rowId, state })}
        onSelectRisks={rowId => setSelection({ kind: "risks", rowId })} />
      <HomeTaskStatusDistribution tasksByStatus={model.tasksByStatus} onSelect={status => setSelection({ kind: "tasks", status })} />
    </div>
    <div className="home-dashboard-secondary-grid">
      <HomeDeadlineChart model={deadlines} onSelect={key => setSelection({ kind: "deadline", key })} />
    </div>
    <HomeDependencyTree model={dependencies} bootstrap={bootstrap} onSelect={selectDependency}
      onShowAll={() => setSelection({ kind: "dependency", key: null })} onOpenTask={onOpenTask} onOpenSchedule={onOpenSchedule} />
    {selection ? <HomeDashboardDetails selection={selection} model={model}
      workload={workload} deadlines={deadlines} dependencies={dependencies} bootstrap={bootstrap} scopeLabel={scopeLabel}
      onClose={close} onOpenTask={onOpenTask} onOpenSchedule={onOpenSchedule} onOpenActionItem={onOpenActionItem}
      onOpenAllActions={onOpenAllActions} onSelectDependency={selectDependency} /> : null}
  </section>;
}
