import type { BootstrapPayload, MilestoneRecord } from "@/types";
import { formatTaskPlanningState } from "@/features/workspace/shared/task/taskPlanning";

import { MilestoneTaskCard } from "./MilestoneTaskCard";

type TaskPlanningState = "blocked" | "at-risk" | "waiting-on-dependency" | "ready" | "overdue";

interface MilestonesMilestoneModalReadinessSectionProps {
  activeMilestone: MilestoneRecord | null;
  activeMilestoneCompleteTasks: BootstrapPayload["tasks"];
  activeMilestoneTasks: BootstrapPayload["tasks"];
  bootstrap: BootstrapPayload;
  milestoneModalMode: "create" | "edit" | null;
  milestoneTaskGroups: Record<TaskPlanningState, BootstrapPayload["tasks"]>;
  milestoneTaskOrder: readonly TaskPlanningState[];
}

export function MilestonesMilestoneModalReadinessSection({
  activeMilestone,
  activeMilestoneCompleteTasks,
  activeMilestoneTasks,
  bootstrap,
  milestoneModalMode,
  milestoneTaskGroups,
  milestoneTaskOrder,
}: MilestonesMilestoneModalReadinessSectionProps) {
  return milestoneModalMode === "edit" && activeMilestone ? (
    <div className="field modal-wide">
      <span style={{ color: "var(--text-title)" }}>Readiness</span>
      {activeMilestoneTasks.length > 0 ? (
        <div style={{ display: "grid", gap: "0.75rem", marginTop: "0.5rem" }}>
          {milestoneTaskOrder.map((state) => {
            const tasks = milestoneTaskGroups[state];
            if (tasks.length === 0) {
              return null;
            }

            return (
              <section key={state} style={{ display: "grid", gap: "0.5rem" }}>
                <h3
                  style={{
                    margin: 0,
                    color: "var(--text-title)",
                    fontSize: "0.9rem",
                    textTransform: "capitalize",
                  }}
                >
                  {formatTaskPlanningState(state)} ({tasks.length})
                </h3>
                <div style={{ display: "grid", gap: "0.5rem" }}>
                  {tasks.map((task) => (
                    <MilestoneTaskCard key={task.id} bootstrap={bootstrap} task={task} />
                  ))}
                </div>
              </section>
            );
          })}
          {activeMilestoneCompleteTasks.length > 0 ? (
            <section style={{ display: "grid", gap: "0.5rem" }}>
              <h3
                style={{
                  margin: 0,
                  color: "var(--text-title)",
                  fontSize: "0.9rem",
                  textTransform: "capitalize",
                }}
              >
                Complete ({activeMilestoneCompleteTasks.length})
              </h3>
              <div style={{ display: "grid", gap: "0.5rem" }}>
                {activeMilestoneCompleteTasks.map((task) => (
                  <MilestoneTaskCard key={task.id} bootstrap={bootstrap} task={task} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : (
        <p style={{ margin: "0.25rem 0 0", color: "var(--text-copy)" }}>
          No tasks currently target this milestone.
        </p>
      )}
    </div>
  ) : null;
}
