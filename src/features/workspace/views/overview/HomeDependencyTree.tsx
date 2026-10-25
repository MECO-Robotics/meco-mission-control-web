import type { CSSProperties } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { HomeDependencyModel, HomeDependencySelection } from "./homeDependencyModel";

export function HomeDependencyTree({ model, bootstrap, selectedKey, expanded = false, onSelect, onShowAll, onOpenTask, onOpenSchedule }: {
  model: HomeDependencyModel;
  bootstrap: BootstrapPayload;
  selectedKey?: string;
  expanded?: boolean;
  onShowAll?: () => void;
  onSelect: (selection: HomeDependencySelection) => void;
  onOpenTask: (id: string) => void;
  onOpenSchedule: (id: string) => void;
}) {
  const branches = expanded ? model.branches.filter(branch => !selectedKey || branch.key === selectedKey) : model.branches.slice(0, 4);
  return <section className="home-dependency-tree" aria-label="Direct prerequisites">
    {!expanded ? <div className="workspace-section-heading"><h2>What unlocks work</h2><span>{model.waitingTaskCount} waiting tasks</span></div> : null}
    {model.hasCycle ? <p className="home-dependency-warning" role="status">A dependency cycle needs review.</p> : null}
    {branches.length ? <div className={`home-dependency-branches${expanded ? " is-expanded" : ""}`}>
      {branches.map(branch => {
        const leaves = expanded ? branch.waitingTaskIds : branch.waitingTaskIds.slice(0, 2);
        const height = Math.max(100, leaves.length * 94);
        const openPrerequisite = () => {
          if (!expanded || !branch.available || branch.selection.kind === "part-instance") onSelect(branch.selection);
          else if (branch.selection.kind === "task") onOpenTask(branch.selection.id);
          else onOpenSchedule(branch.selection.id);
        };
        const rootContent = <>
          <small>{branch.selection.kind}{branch.hasCycle ? " · cycle" : ""}</small><strong>{branch.label}</strong>
          <small>{!branch.available ? "Unavailable record" : branch.outsideScope ? "Outside current task scope" : "Prerequisite"}</small>
        </>;
        return <div className="home-dependency-branch" key={branch.key}>
          <div className="home-dependency-scroll" role="region" aria-label={`${branch.label}: prerequisite tree`} tabIndex={0}>
            <div className="home-dependency-canvas" style={{ "--home-tree-height": `${height}px`, "--home-mobile-height": `${104 + leaves.length * 94}px` } as CSSProperties}>
              <svg className="home-tree-horizontal" viewBox={`0 0 530 ${height}`} width="530" height={height} aria-hidden="true">
                {leaves.map((id, index) => <path key={id} d={`M 205 ${height / 2} H 245 V ${index * 94 + 44} H 285`} />)}
              </svg>
              <svg className="home-tree-vertical" viewBox={`0 0 100 ${104 + leaves.length * 94}`} preserveAspectRatio="none" aria-hidden="true">
                {leaves.map((id, index) => <path key={id} vectorEffect="non-scaling-stroke" d={`M 50 84 V 94 H 4 V ${104 + index * 94 + 42} H 8`} />)}
              </svg>
              {expanded && (!branch.available || branch.selection.kind === "part-instance")
                ? <div className="home-dependency-node home-dependency-root" style={{ "--home-root-top": `${height / 2 - 42}px` } as CSSProperties}>{rootContent}</div>
                : <button className="home-dependency-node home-dependency-root" style={{ "--home-root-top": `${height / 2 - 42}px` } as CSSProperties} type="button" onClick={openPrerequisite}>{rootContent}</button>}
              {leaves.map((id, index) => {
                const task = bootstrap.tasks.find(item => item.id === id);
                const conditions = [...new Set(branch.dependencies.filter(item => item.taskId === id).map(item =>
                  item.requiredCondition?.value ?? item.requiredState ?? (item.kind === "milestone" ? "ready" : item.kind === "task" ? "complete" : "condition not recorded")))];
                return <button className="home-dependency-node home-dependency-leaf" key={id} style={{ "--home-leaf-top": `${index * 94 + 2}px`, "--home-leaf-mobile-top": `${104 + index * 94}px` } as CSSProperties}
                  type="button" disabled={!task} onClick={() => onOpenTask(id)}>
                  <small>Waiting task</small><strong>{task?.title ?? `Unavailable task · ${id}`}</strong>
                  <small>Needs {conditions.join(" / ")}</small>
                </button>;
              })}
            </div>
          </div>
          {!expanded ? <button className="home-dependency-more" type="button" onClick={() => onSelect(branch.selection)}>
            Review {branch.waitingTaskIds.length} waiting tasks{branch.waitingTaskIds.length > leaves.length ? ` · ${branch.waitingTaskIds.length - leaves.length} more` : ""}
          </button> : null}
        </div>;
      })}
    </div> : <p className="empty-state">{expanded ? "This prerequisite no longer blocks work in this scope." : "No unfinished tasks are waiting on prerequisites in this scope."}</p>}
    {!expanded && model.branches.length > branches.length && onShowAll
      ? <button className="secondary-action" type="button" onClick={onShowAll}>Review all {model.branches.length} prerequisites</button> : null}
    {!expanded ? <p className="home-chart-caption">Direct prerequisites → waiting tasks.{model.branches.length > branches.length ? ` Showing ${branches.length} of ${model.branches.length} prerequisites.` : ""}</p> : null}
  </section>;
}
