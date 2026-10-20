import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { WorkspaceTopbarControls } from "@/features/workspace/shared/topbar";
import { useRememberedViewState } from "@/features/workspace/shared/navigation/WorkspaceViewMemory";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import { buildAttentionQueue, type AttentionQueueRow } from "../attention/attentionQueue";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { BootstrapPayload } from "@/types/bootstrap";
import { HomeActionRequired } from "./HomeActionRequired";
import { HomeTaskStatusDistribution } from "./HomeTaskStatusDistribution";
import { HomeDeadlineChart } from "./HomeDeadlineChart";
import { HomeWorkloadChart } from "./HomeWorkloadChart";
import { HomeDependencyTree } from "./HomeDependencyTree";
import { HomeDashboardDetails, type HomeDashboardSelection } from "./HomeDashboardDetails";
import { buildHomeViewModel } from "./overviewViewModel";
import { buildHomePressureGroups, HOME_PRESSURE_BUCKETS, type HomePressureBucket } from "./homePressureModel";
import { buildHomeWorkloadModel, type HomeWorkloadMode } from "./homeWorkloadModel";
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
  const [pressureBucket, setPressureBucket] = useRememberedViewState<HomePressureBucket>("home.pressure.bucket", "urgency");
  const [workloadMode, setWorkloadMode] = useRememberedViewState<HomeWorkloadMode>("home.workload.mode", "team");
  const [selection, setSelection] = useState<HomeDashboardSelection | null>(null);
  const close = () => setSelection(null);
  const model = useMemo(() => buildHomeViewModel({ activePersonFilter, bootstrap, projectId, search }),
    [activePersonFilter, bootstrap, projectId, search]);
  const actionItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return buildAttentionQueue({ activePersonFilter, bootstrap, projectId, today })
      .filter(item => `${item.title} ${item.detail}`.toLocaleLowerCase().includes(query));
  }, [activePersonFilter, bootstrap, projectId, search, today]);
  const pressureGroups = buildHomePressureGroups(actionItems, pressureBucket, bootstrap, { activePersonFilter });
  const workload = buildHomeWorkloadModel({ tasks: model.tasks, bootstrap, mode: workloadMode });
  const deadlines = buildHomeDeadlineModel({ tasks: model.tasks, milestones: model.milestones, today });
  const dependencies = buildHomeDependencyModel(model.tasks, bootstrap);
  const selectDependency = (dependency: HomeDependencySelection) => setSelection({ kind: "dependency", key: `${dependency.kind}:${dependency.id}` });

  return <section className={`panel dense-panel overview-shell home-view ${WORKSPACE_PANEL_CLASS}`}>
    <TopbarResponsiveSearch ariaLabel="Search dashboard records" placeholder="Search tasks, risks and milestones…"
      compactPlaceholder="Search" value={search} onChange={value => { close(); setSearch(value); }} />
    <AppTopbarSlotPortal slot="controls"><WorkspaceTopbarControls>
      <CompactFilterMenu ariaLabel="Dashboard chart settings" buttonLabel="Charts" menuTitle="Dashboard charts" icon={<SlidersHorizontal size={16} />} items={[
        { label: "Pressure grouped by", content: <select className="toolbar-filter-select" aria-label="Pressure grouped by" value={pressureBucket}
          onChange={event => { close(); setPressureBucket(event.target.value as HomePressureBucket); }}>
          {HOME_PRESSURE_BUCKETS.map(bucket => <option key={bucket.id} value={bucket.id}>{bucket.label}</option>)}
        </select> },
        { label: "Work distribution", content: <select className="toolbar-filter-select" aria-label="Work distribution" value={workloadMode}
          onChange={event => { close(); setWorkloadMode(event.target.value as HomeWorkloadMode); }}>
          <option value="team">By team</option><option value="individual">By individual</option>
        </select> },
      ]} />
    </WorkspaceTopbarControls></AppTopbarSlotPortal>
    <div className="home-dashboard-lead-grid">
      <HomeActionRequired items={actionItems} groups={pressureGroups} bucket={pressureBucket}
        onSelect={group => setSelection({ kind: "actions", group })} />
      <HomeTaskStatusDistribution tasksByStatus={model.tasksByStatus} onSelect={status => setSelection({ kind: "tasks", status })} />
    </div>
    <div className="home-dashboard-lead-grid home-dashboard-secondary-grid">
      <HomeDeadlineChart model={deadlines} onSelect={key => setSelection({ kind: "deadline", key })} />
      <HomeWorkloadChart model={workload} mode={workloadMode} onSelect={(rowId, state) => setSelection({ kind: "workload", rowId, state })} />
    </div>
    <HomeDependencyTree model={dependencies} bootstrap={bootstrap} onSelect={selectDependency}
      onShowAll={() => setSelection({ kind: "dependency", key: null })} onOpenTask={onOpenTask} onOpenSchedule={onOpenSchedule} />
    {selection ? <HomeDashboardDetails selection={selection} model={model} groups={pressureGroups} actions={actionItems}
      workload={workload} deadlines={deadlines} dependencies={dependencies} bootstrap={bootstrap} scopeLabel={scopeLabel}
      onClose={close} onOpenTask={onOpenTask} onOpenSchedule={onOpenSchedule} onOpenActionItem={onOpenActionItem}
      onOpenAllActions={onOpenAllActions} onSelectDependency={selectDependency} /> : null}
  </section>;
}
