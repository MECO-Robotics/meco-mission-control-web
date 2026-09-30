import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskDependencyDraft } from "@/types/payloads";

interface Props {
  bootstrap: BootstrapPayload;
  ownerId: string;
  ownerType: "task" | "manufacturing";
  dependencies: readonly TaskDependencyDraft[];
  onChange: (dependencies: TaskDependencyDraft[]) => void;
}

export function WorkDependenciesEditor({ bootstrap, ownerId, ownerType, dependencies, onChange }: Props) {
  const workTargets = [
    ...bootstrap.tasks.map((item) => ({ id: `work_item:task:${item.id}`, label: `Task · ${item.title}` })),
    ...bootstrap.manufacturingItems.map((item) => ({ id: `work_item:manufacturing:${item.id}`, label: `Manufacturing · ${item.title}` })),
    ...bootstrap.milestones.map((item) => ({ id: `milestone::${item.id}`, label: `Milestone · ${item.title}` })),
    ...bootstrap.partInstances.map((item) => ({ id: `part_instance::${item.id}`, label: `Part instance · ${item.name}` })),
  ].filter((item) => item.id !== `work_item:${ownerType}:${ownerId}`);
  const append = () => onChange([...dependencies, { kind: "work_item", refType: "task", refId: "", requiredState: "complete", dependencyType: "hard" }]);
  return <fieldset className="work-dependencies-editor"><legend>Dependencies</legend>
    {dependencies.map((dependency, index) => {
      const kind = dependency.kind;
      const selected = kind === "work_item" ? `${kind}:${dependency.refType ?? "task"}:${dependency.refId}` : `${kind}::${dependency.refId}`;
      return <div className="work-dependency-row" key={dependency.id ?? `dependency-${index}`}>
        <select aria-label={`Dependency ${index + 1} target`} value={selected} onChange={(event) => {
          const [kind, refType, ...id] = event.target.value.split(":");
          onChange(dependencies.map((item, current) => current === index ? { ...item, kind: kind as TaskDependencyDraft["kind"], refType: kind === "work_item" ? refType as "task" | "manufacturing" : undefined, refId: id.join(":") } : item));
        }}>
          <option value="">Select dependency target…</option>{workTargets.map((target) => <option key={target.id} value={target.id}>{target.label}</option>)}
        </select>
        <select aria-label={`Dependency ${index + 1} required state`} value={dependency.requiredState} onChange={(event) => onChange(dependencies.map((item, current) => current === index ? { ...item, requiredState: event.target.value } : item))}>
          <option value="not-started">Not started</option><option value="in-progress">In progress</option><option value="waiting-for-qa">Waiting for QA</option><option value="complete">Complete</option>
        </select>
        <select aria-label={`Dependency ${index + 1} strength`} value={dependency.dependencyType} onChange={(event) => onChange(dependencies.map((item, current) => current === index ? { ...item, dependencyType: event.target.value as TaskDependencyDraft["dependencyType"] } : item))}><option value="hard">Hard</option><option value="soft">Soft</option></select>
        <button className="ghost-button" onClick={() => onChange(dependencies.filter((_, current) => current !== index))} type="button">Remove</button>
      </div>;
    })}
    <button className="ghost-button" onClick={append} type="button">Add dependency</button>
  </fieldset>;
}
