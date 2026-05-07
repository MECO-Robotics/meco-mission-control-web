import type React from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { MilestoneRecord } from "@/types/recordsExecution";
import type { TimelineMilestoneDraft } from "@/features/workspace/shared/timeline/timelineEventHelpers";

export interface TimelineMilestoneModalProps {
  activeDayMilestones: MilestoneRecord[];
  activeMilestoneDay: string | null;
  bootstrap: BootstrapPayload;
  milestoneDraft: TimelineMilestoneDraft;
  milestoneEndDate: string;
  milestoneEndTime: string;
  milestoneError: string | null;
  milestoneStartDate: string;
  milestoneStartTime: string;
  isDeletingMilestone: boolean;
  isSavingMilestone: boolean;
  mode: "create" | "edit" | null;
  onClose: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onSubmit: (milestone: React.FormEvent<HTMLFormElement>) => void;
  onSwitchToTask: () => void;
  portalTarget: HTMLElement | null;
  setMilestoneDraft: React.Dispatch<React.SetStateAction<TimelineMilestoneDraft>>;
  setMilestoneEndDate: React.Dispatch<React.SetStateAction<string>>;
  setMilestoneEndTime: React.Dispatch<React.SetStateAction<string>>;
  setMilestoneStartDate: React.Dispatch<React.SetStateAction<string>>;
  setMilestoneStartTime: React.Dispatch<React.SetStateAction<string>>;
}
