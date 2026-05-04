import type React from "react";

import type { BootstrapPayload, MilestoneRecord } from "@/types";
import type { TimelineMilestoneDraft } from "@/features/workspace/shared/timeline";

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

