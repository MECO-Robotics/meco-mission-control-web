import { useState } from "react";

import type { MemberPayload } from "@/types";
import type { FilterSelection } from "@/features/workspace/shared";

export function useAppWorkspaceUiStatePeople() {
  const [activePersonFilter, setActivePersonFilter] = useState<FilterSelection>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState<MemberPayload>({
    name: "",
    email: "",
    photoUrl: "",
    role: "student",
    elevated: false,
  });
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [isEditPersonOpen, setIsEditPersonOpen] = useState(false);
  const [memberEditDraft, setMemberEditDraft] = useState<MemberPayload | null>(null);
  const [isSavingMember, setIsSavingMember] = useState(false);
  const [isDeletingMember, setIsDeletingMember] = useState(false);
  const [isAddSeasonPopupOpen, setIsAddSeasonPopupOpen] = useState(false);
  const [seasonNameDraft, setSeasonNameDraft] = useState("");
  const [isSavingSeason, setIsSavingSeason] = useState(false);
  const [robotProjectModalMode, setRobotProjectModalMode] =
    useState<"create" | "edit" | null>(null);
  const [robotProjectNameDraft, setRobotProjectNameDraft] = useState("");
  const [isSavingRobotProject, setIsSavingRobotProject] = useState(false);

  return {
    activePersonFilter,
    isAddPersonOpen,
    isAddSeasonPopupOpen,
    isDeletingMember,
    isEditPersonOpen,
    isSavingMember,
    isSavingRobotProject,
    isSavingSeason,
    memberEditDraft,
    memberForm,
    robotProjectModalMode,
    robotProjectNameDraft,
    seasonNameDraft,
    selectedMemberId,
    selectedProjectId,
    selectedSeasonId,
    setActivePersonFilter,
    setIsAddPersonOpen,
    setIsAddSeasonPopupOpen,
    setIsDeletingMember,
    setIsEditPersonOpen,
    setIsSavingMember,
    setIsSavingRobotProject,
    setIsSavingSeason,
    setMemberEditDraft,
    setMemberForm,
    setRobotProjectModalMode,
    setRobotProjectNameDraft,
    setSeasonNameDraft,
    setSelectedMemberId,
    setSelectedProjectId,
    setSelectedSeasonId,
  };
}
