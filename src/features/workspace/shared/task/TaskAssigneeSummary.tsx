import { useState } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";
import { getTaskSelectedAssigneeIds } from "./taskTargeting";
import "./TaskAssigneeSummary.css";

interface TaskAssigneeSummaryProps {
  task: Pick<TaskRecord, "assigneeIds" | "ownerId">;
  membersById: Record<string, BootstrapPayload["members"][number]>;
}

export function TaskAssigneeSummary({ task, membersById }: TaskAssigneeSummaryProps) {
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null);
  const assigneeIds = [...new Set(getTaskSelectedAssigneeIds(task))];
  const person = membersById[assigneeIds[0]];
  const assigneeNames = assigneeIds.map((id) => membersById[id]?.name ?? "Unavailable assignee").join(", ");

  if (!assigneeIds.length) return <span className="task-assignee-summary">Unassigned</span>;

  return (
    <span aria-label={assigneeNames} className="task-assignee-summary" role="img" title={assigneeNames}>
      {person?.photoUrl && person.photoUrl !== failedPhotoUrl ? (
        <img
          alt=""
          className="profile-avatar"
          loading="lazy"
          onError={() => setFailedPhotoUrl(person.photoUrl ?? null)}
          referrerPolicy="no-referrer"
          src={person.photoUrl}
        />
      ) : (
        <span className="profile-avatar profile-avatar-fallback" aria-hidden="true">
          {person?.name.trim().slice(0, 1).toUpperCase() || "?"}
        </span>
      )}
      {assigneeIds.length > 1 ? <span aria-hidden="true" className="task-assignee-summary-count">+{assigneeIds.length - 1}</span> : null}
    </span>
  );
}
