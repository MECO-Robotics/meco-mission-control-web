import {
  startTransition,
  useCallback,
  useEffect,
  useState,
} from "react";

import "./App.css";
import { AuthStatusScreen, SignInScreen } from "../components/auth/AuthScreens";
import { AppSidebar } from "../components/layout/AppSidebar";
import { AppTopbar } from "../components/layout/AppTopbar";
import { WorkspaceContent } from "../components/workspace/WorkspaceContent";
import type { ViewTab } from "../components/workspace/workspaceTypes";
import {
  buildEmptyMechanismPayload,
  buildEmptyManufacturingPayload,
  buildEmptyMaterialPayload,
  buildEmptyPartDefinitionPayload,
  buildEmptyPartInstancePayload,
  buildEmptyPurchasePayload,
  buildEmptySubsystemPayload,
  buildEmptyTaskPayload,
  joinList,
  mechanismToPayload,
  manufacturingToPayload,
  materialToPayload,
  partDefinitionToPayload,
  partInstanceToPayload,
  purchaseToPayload,
  splitList,
  subsystemToPayload,
  taskToPayload,
  toErrorMessage
} from "../lib/appUtils";
import {
  createManufacturingItemRecord,
  createMaterialRecord,
  createMemberRecord,
  createMechanismRecord,
  createSubsystemRecord,
  createPartDefinitionRecord,
  createPartInstanceRecord,
  createPurchaseItemRecord,
  createTask,
  deleteMaterialRecord,
  deleteMemberRecord,
  deleteMechanismRecord,
  deletePartDefinitionRecord,
  fetchBootstrap,
  updateManufacturingItemRecord,
  updateMaterialRecord,
  updateMemberRecord,
  updateMechanismRecord,
  updateSubsystemRecord,
  updatePartDefinitionRecord,
  updatePartInstanceRecord,
  updatePurchaseItemRecord,
  updateTaskRecord,
} from "../lib/auth";
import type {
  BootstrapPayload,
  ManufacturingItemPayload,
  ManufacturingItemRecord,
  MaterialPayload,
  MaterialRecord,
  MechanismPayload,
  MechanismRecord,
  MemberPayload,
  PartDefinitionPayload,
  PartDefinitionRecord,
  PartInstancePayload,
  PartInstanceRecord,
  PurchaseItemPayload,
  PurchaseItemRecord,
  SubsystemPayload,
  SubsystemRecord,
  TaskPayload,
  TaskRecord,
} from "../types";
import { EMPTY_BOOTSTRAP } from "./appConstants";
import type {
  ManufacturingModalMode,
  MaterialModalMode,
  MechanismModalMode,
  PartDefinitionModalMode,
  PartInstanceModalMode,
  PurchaseModalMode,
  SubsystemModalMode,
  TaskModalMode,
} from "./appTypes";
import { useAppAuth } from "./useAppAuth";
import { useAppShell } from "./useAppShell";
import { useWorkspaceDerivedData } from "./useWorkspaceDerivedData";
import { WorkspaceModalHost } from "./WorkspaceModalHost";

export default function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>("timeline");
  const [bootstrap, setBootstrap] = useState<BootstrapPayload>(EMPTY_BOOTSTRAP);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataMessage, setDataMessage] = useState<string | null>(null);

  const {
    isDarkMode,
    isShellCompact,
    pageShellStyle,
    toggleDarkMode,
    toggleSidebar,
  } = useAppShell();

  const {
    authBooting,
    authConfig,
    authMessage,
    clearAuthMessage,
    enforcedAuthConfig,
    expireSession,
    googleButtonRef,
    handleSignOut,
    handleRequestEmailCode,
    handleVerifyEmailCode,
    isEmailAuthAvailable,
    isGoogleAuthAvailable,
    isLocalGoogleDevHost,
    isLocalGoogleOverrideActive,
    isSigningIn,
    sessionUser,
  } = useAppAuth({
    resetWorkspace: () => {
      setBootstrap(EMPTY_BOOTSTRAP);
    },
  });

  const [taskModalMode, setTaskModalMode] = useState<TaskModalMode>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [taskDraft, setTaskDraft] = useState<TaskPayload>(
    buildEmptyTaskPayload(EMPTY_BOOTSTRAP),
  );
  const [taskDraftBlockers, setTaskDraftBlockers] = useState("");
  const [isSavingTask, setIsSavingTask] = useState(false);

  const [purchaseModalMode, setPurchaseModalMode] =
    useState<PurchaseModalMode>(null);
  const [activePurchaseId, setActivePurchaseId] = useState<string | null>(null);
  const [purchaseDraft, setPurchaseDraft] = useState<PurchaseItemPayload>(
    buildEmptyPurchasePayload(EMPTY_BOOTSTRAP),
  );
  const [purchaseFinalCost, setPurchaseFinalCost] = useState("");
  const [isSavingPurchase, setIsSavingPurchase] = useState(false);

  const [manufacturingModalMode, setManufacturingModalMode] =
    useState<ManufacturingModalMode>(null);
  const [activeManufacturingId, setActiveManufacturingId] = useState<string | null>(
    null,
  );
  const [manufacturingDraft, setManufacturingDraft] =
    useState<ManufacturingItemPayload>(
      buildEmptyManufacturingPayload(EMPTY_BOOTSTRAP, "cnc"),
    );
  const [isSavingManufacturing, setIsSavingManufacturing] = useState(false);

  const [materialModalMode, setMaterialModalMode] = useState<MaterialModalMode>(null);
  const [activeMaterialId, setActiveMaterialId] = useState<string | null>(null);
  const [materialDraft, setMaterialDraft] = useState<MaterialPayload>(
    buildEmptyMaterialPayload(),
  );
  const [isSavingMaterial, setIsSavingMaterial] = useState(false);
  const [isDeletingMaterial, setIsDeletingMaterial] = useState(false);

  const [partDefinitionModalMode, setPartDefinitionModalMode] =
    useState<PartDefinitionModalMode>(null);
  const [activePartDefinitionId, setActivePartDefinitionId] = useState<string | null>(
    null,
  );
  const [partDefinitionDraft, setPartDefinitionDraft] =
    useState<PartDefinitionPayload>(buildEmptyPartDefinitionPayload(EMPTY_BOOTSTRAP));
  const [isSavingPartDefinition, setIsSavingPartDefinition] = useState(false);
  const [isDeletingPartDefinition, setIsDeletingPartDefinition] = useState(false);

  const [partInstanceModalMode, setPartInstanceModalMode] =
    useState<PartInstanceModalMode>(null);
  const [activePartInstanceId, setActivePartInstanceId] = useState<string | null>(null);
  const [partInstanceDraft, setPartInstanceDraft] = useState<PartInstancePayload>(
    buildEmptyPartInstancePayload(EMPTY_BOOTSTRAP),
  );
  const [isSavingPartInstance, setIsSavingPartInstance] = useState(false);

  const [subsystemModalMode, setSubsystemModalMode] =
    useState<SubsystemModalMode>(null);
  const [activeSubsystemId, setActiveSubsystemId] = useState<string | null>(null);
  const [subsystemDraft, setSubsystemDraft] = useState<SubsystemPayload>(
    buildEmptySubsystemPayload(EMPTY_BOOTSTRAP),
  );
  const [subsystemDraftRisks, setSubsystemDraftRisks] = useState("");
  const [isSavingSubsystem, setIsSavingSubsystem] = useState(false);

  const [mechanismModalMode, setMechanismModalMode] =
    useState<MechanismModalMode>(null);
  const [activeMechanismId, setActiveMechanismId] = useState<string | null>(null);
  const [mechanismDraft, setMechanismDraft] = useState<MechanismPayload>(
    buildEmptyMechanismPayload(EMPTY_BOOTSTRAP),
  );
  const [isSavingMechanism, setIsSavingMechanism] = useState(false);
  const [isDeletingMechanism, setIsDeletingMechanism] = useState(false);

  const [activePersonFilter, setActivePersonFilter] = useState<string>("all");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState<MemberPayload>({
    name: "",
    role: "student",
  });
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [isEditPersonOpen, setIsEditPersonOpen] = useState(false);
  const [memberEditDraft, setMemberEditDraft] = useState<MemberPayload | null>(
    null,
  );
  const [isSavingMember, setIsSavingMember] = useState(false);
  const [isDeletingMember, setIsDeletingMember] = useState(false);
  const {
    activeTask,
    cncItems,
    disciplinesById,
    eventsById,
    mechanismsById,
    mentors,
    membersById,
    navigationItems,
    partDefinitionsById,
    partInstancesById,
    printItems,
    requirementsById,
    rosterMentors,
    students,
    subsystemsById,
  } = useWorkspaceDerivedData({
    activeTaskId,
    bootstrap,
  });

  const handleUnauthorized = useCallback(() => {
    expireSession("Your session expired. Please sign in again.");
    setDataMessage("Your session expired. Please sign in again.");
  }, [expireSession]);

  const selectMember = useCallback((memberId: string | null, payload: BootstrapPayload) => {
    const member = payload.members.find((candidate) => candidate.id === memberId) ?? null;
    setSelectedMemberId(member?.id ?? null);
    setMemberEditDraft(
      member
        ? {
          name: member.name,
          role: member.role,
        }
        : null,
    );
  }, []);

  const loadWorkspace = useCallback(async () => {
    setIsLoadingData(true);
    setDataMessage(null);

    try {
      const payload = await fetchBootstrap(
        activePersonFilter === "all" ? null : activePersonFilter,
        handleUnauthorized,
      );
      const nextMemberId =
        selectedMemberId && payload.members.some((member) => member.id === selectedMemberId)
          ? selectedMemberId
          : payload.members[0]?.id ?? null;

      startTransition(() => {
        setBootstrap(payload);
      });

      if (
        activePersonFilter !== "all" &&
        !payload.members.some((member) => member.id === activePersonFilter)
      ) {
        setActivePersonFilter("all");
      }

      selectMember(nextMemberId, payload);

      if (taskModalMode === "create") {
        setTaskDraft(buildEmptyTaskPayload(payload));
        setTaskDraftBlockers("");
      }

      if (taskModalMode === "edit" && activeTaskId) {
        const nextTask = payload.tasks.find((task) => task.id === activeTaskId);
        if (nextTask) {
          setTaskDraft(taskToPayload(nextTask));
          setTaskDraftBlockers(joinList(nextTask.blockers));
        } else {
          setTaskModalMode(null);
          setActiveTaskId(null);
        }
      }

      if (purchaseModalMode === "create") {
        setPurchaseDraft(buildEmptyPurchasePayload(payload));
        setPurchaseFinalCost("");
      }

      if (purchaseModalMode === "edit" && activePurchaseId) {
        const nextItem = payload.purchaseItems.find((item) => item.id === activePurchaseId);
        if (nextItem) {
          setPurchaseDraft(purchaseToPayload(nextItem));
          setPurchaseFinalCost(
            typeof nextItem.finalCost === "number" ? String(nextItem.finalCost) : "",
          );
        } else {
          setPurchaseModalMode(null);
          setActivePurchaseId(null);
        }
      }

      if (manufacturingModalMode === "create") {
        setManufacturingDraft((current) =>
          buildEmptyManufacturingPayload(payload, current.process),
        );
      }

      if (manufacturingModalMode === "edit" && activeManufacturingId) {
        const nextItem = payload.manufacturingItems.find(
          (item) => item.id === activeManufacturingId,
        );
        if (nextItem) {
          setManufacturingDraft(manufacturingToPayload(nextItem));
        } else {
          setManufacturingModalMode(null);
          setActiveManufacturingId(null);
        }
      }

      if (materialModalMode === "create") {
        setMaterialDraft(buildEmptyMaterialPayload());
      }

      if (materialModalMode === "edit" && activeMaterialId) {
        const nextItem = payload.materials.find((item) => item.id === activeMaterialId);
        if (nextItem) {
          setMaterialDraft(materialToPayload(nextItem));
        } else {
          setMaterialModalMode(null);
          setActiveMaterialId(null);
        }
      }

      if (partDefinitionModalMode === "create") {
        setPartDefinitionDraft(buildEmptyPartDefinitionPayload(payload));
      }

      if (partDefinitionModalMode === "edit" && activePartDefinitionId) {
        const nextItem = payload.partDefinitions.find(
          (item) => item.id === activePartDefinitionId,
        );
        if (nextItem) {
          setPartDefinitionDraft(partDefinitionToPayload(nextItem));
        } else {
          setPartDefinitionModalMode(null);
          setActivePartDefinitionId(null);
        }
      }

      if (partInstanceModalMode === "create") {
        setPartInstanceDraft((current) =>
          buildEmptyPartInstancePayload(payload, {
            subsystemId: current.subsystemId,
            mechanismId: current.mechanismId ?? undefined,
            partDefinitionId: current.partDefinitionId || undefined,
          }),
        );
      }

      if (partInstanceModalMode === "edit" && activePartInstanceId) {
        const nextItem = payload.partInstances.find(
          (item) => item.id === activePartInstanceId,
        );
        if (nextItem) {
          setPartInstanceDraft(partInstanceToPayload(nextItem));
        } else {
          setPartInstanceModalMode(null);
          setActivePartInstanceId(null);
        }
      }

      if (subsystemModalMode === "create") {
        setSubsystemDraft(buildEmptySubsystemPayload(payload));
        setSubsystemDraftRisks("");
      }

      if (subsystemModalMode === "edit" && activeSubsystemId) {
        const nextSubsystem = payload.subsystems.find(
          (subsystem) => subsystem.id === activeSubsystemId,
        );
        if (nextSubsystem) {
          setSubsystemDraft(subsystemToPayload(nextSubsystem));
          setSubsystemDraftRisks(joinList(nextSubsystem.risks));
        } else {
          setSubsystemModalMode(null);
          setActiveSubsystemId(null);
        }
      }

      if (mechanismModalMode === "create") {
        setMechanismDraft((current) =>
          buildEmptyMechanismPayload(payload, current.subsystemId),
        );
      }

      if (mechanismModalMode === "edit" && activeMechanismId) {
        const nextMechanism = payload.mechanisms.find(
          (mechanism) => mechanism.id === activeMechanismId,
        );
        if (nextMechanism) {
          setMechanismDraft(mechanismToPayload(nextMechanism));
        } else {
          setMechanismModalMode(null);
          setActiveMechanismId(null);
        }
      }

    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsLoadingData(false);
    }
  }, [
    activeManufacturingId,
    activeMaterialId,
    activePartDefinitionId,
    activePartInstanceId,
    activePersonFilter,
    activePurchaseId,
    activeTaskId,
    activeSubsystemId,
    activeMechanismId,
    handleUnauthorized,
    mechanismModalMode,
    manufacturingModalMode,
    materialModalMode,
    partDefinitionModalMode,
    partInstanceModalMode,
    purchaseModalMode,
    selectedMemberId,
    selectMember,
    subsystemModalMode,
    taskModalMode,
  ]);

  const openCreateTaskModal = () => {
    setActiveTaskId(null);
    setTaskDraft(buildEmptyTaskPayload(bootstrap));
    setTaskDraftBlockers("");
    setTaskModalMode("create");
  };

  const openEditTaskModal = (task: TaskRecord) => {
    setActiveTaskId(task.id);
    setTaskDraft(taskToPayload(task));
    setTaskDraftBlockers(joinList(task.blockers));
    setTaskModalMode("edit");
  };

  const closeTaskModal = () => {
    setTaskModalMode(null);
    setActiveTaskId(null);
  };

  const openCreatePurchaseModal = () => {
    setActivePurchaseId(null);
    setPurchaseDraft(buildEmptyPurchasePayload(bootstrap));
    setPurchaseFinalCost("");
    setPurchaseModalMode("create");
  };

  const openEditPurchaseModal = (item: PurchaseItemRecord) => {
    setActivePurchaseId(item.id);
    setPurchaseDraft(purchaseToPayload(item));
    setPurchaseFinalCost(typeof item.finalCost === "number" ? String(item.finalCost) : "");
    setPurchaseModalMode("edit");
  };

  const closePurchaseModal = () => {
    setPurchaseModalMode(null);
    setActivePurchaseId(null);
  };

  const openCreateManufacturingModal = (
    process: ManufacturingItemPayload["process"],
  ) => {
    setActiveManufacturingId(null);
    setManufacturingDraft(buildEmptyManufacturingPayload(bootstrap, process));
    setManufacturingModalMode("create");
  };

  const openEditManufacturingModal = (item: ManufacturingItemRecord) => {
    setActiveManufacturingId(item.id);
    setManufacturingDraft(manufacturingToPayload(item));
    setManufacturingModalMode("edit");
  };

  const closeManufacturingModal = () => {
    setManufacturingModalMode(null);
    setActiveManufacturingId(null);
  };

  const openCreateMaterialModal = () => {
    setActiveMaterialId(null);
    setMaterialDraft(buildEmptyMaterialPayload());
    setMaterialModalMode("create");
  };

  const openEditMaterialModal = (item: MaterialRecord) => {
    setActiveMaterialId(item.id);
    setMaterialDraft(materialToPayload(item));
    setMaterialModalMode("edit");
  };

  const closeMaterialModal = () => {
    setMaterialModalMode(null);
    setActiveMaterialId(null);
  };

  const openCreatePartDefinitionModal = () => {
    setActivePartDefinitionId(null);
    setPartDefinitionDraft(buildEmptyPartDefinitionPayload(bootstrap));
    setPartDefinitionModalMode("create");
  };

  const openEditPartDefinitionModal = (item: PartDefinitionRecord) => {
    setActivePartDefinitionId(item.id);
    setPartDefinitionDraft(partDefinitionToPayload(item));
    setPartDefinitionModalMode("edit");
  };

  const closePartDefinitionModal = () => {
    setPartDefinitionModalMode(null);
    setActivePartDefinitionId(null);
  };

  const openCreatePartInstanceModal = (mechanism: MechanismRecord) => {
    setActivePartInstanceId(null);
    setPartInstanceDraft(
      buildEmptyPartInstancePayload(bootstrap, {
        subsystemId: mechanism.subsystemId,
        mechanismId: mechanism.id,
      }),
    );
    setPartInstanceModalMode("create");
  };

  const openEditPartInstanceModal = (partInstance: PartInstanceRecord) => {
    setActivePartInstanceId(partInstance.id);
    setPartInstanceDraft(partInstanceToPayload(partInstance));
    setPartInstanceModalMode("edit");
  };

  const closePartInstanceModal = () => {
    setPartInstanceModalMode(null);
    setActivePartInstanceId(null);
  };

  const openCreateSubsystemModal = () => {
    setActiveSubsystemId(null);
    setSubsystemDraft(buildEmptySubsystemPayload(bootstrap));
    setSubsystemDraftRisks("");
    setSubsystemModalMode("create");
  };

  const openEditSubsystemModal = (subsystem: SubsystemRecord) => {
    setActiveSubsystemId(subsystem.id);
    setSubsystemDraft(subsystemToPayload(subsystem));
    setSubsystemDraftRisks(joinList(subsystem.risks));
    setSubsystemModalMode("edit");
  };

  const closeSubsystemModal = () => {
    setSubsystemModalMode(null);
    setActiveSubsystemId(null);
  };

  const openCreateMechanismModal = (subsystemId?: string) => {
    setActiveMechanismId(null);
    setMechanismDraft(buildEmptyMechanismPayload(bootstrap, subsystemId));
    setMechanismModalMode("create");
  };

  const openEditMechanismModal = (mechanism: MechanismRecord) => {
    setActiveMechanismId(mechanism.id);
    setMechanismDraft(mechanismToPayload(mechanism));
    setMechanismModalMode("edit");
  };

  const closeMechanismModal = () => {
    setMechanismModalMode(null);
    setActiveMechanismId(null);
  };

  useEffect(() => {
    if (authBooting) {
      return;
    }

    if (authConfig?.enabled && !sessionUser) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadWorkspace();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [authBooting, authConfig?.enabled, loadWorkspace, sessionUser]);

  const handleTaskSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingTask(true);
    setDataMessage(null);

    try {
      const payload: TaskPayload = {
        ...taskDraft,
        blockers: splitList(taskDraftBlockers),
      };

      if (taskModalMode === "create") {
        await createTask(payload, handleUnauthorized);
      } else if (taskModalMode === "edit" && activeTaskId) {
        await updateTaskRecord(activeTaskId, payload, handleUnauthorized);
      }

      await loadWorkspace();
      closeTaskModal();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingTask(false);
    }
  };

  const handlePurchaseSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setIsSavingPurchase(true);
    setDataMessage(null);

    try {
      const selectedPartDefinition = bootstrap.partDefinitions.find(
        (partDefinition) => partDefinition.id === purchaseDraft.partDefinitionId,
      );

      if (!selectedPartDefinition) {
        setDataMessage("Please choose a real part from the Parts tab before saving the purchase.");
        return;
      }

      const payload: PurchaseItemPayload = {
        ...purchaseDraft,
        title: selectedPartDefinition.name,
        finalCost:
          purchaseFinalCost.trim().length > 0 ? Number(purchaseFinalCost) : undefined,
      };

      if (purchaseModalMode === "create") {
        await createPurchaseItemRecord(payload, handleUnauthorized);
      } else if (purchaseModalMode === "edit" && activePurchaseId) {
        await updatePurchaseItemRecord(activePurchaseId, payload, handleUnauthorized);
      }

      await loadWorkspace();
      closePurchaseModal();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingPurchase(false);
    }
  };

  const handleManufacturingSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setIsSavingManufacturing(true);
    setDataMessage(null);

    try {
      const selectedPartDefinition = manufacturingDraft.partDefinitionId
        ? bootstrap.partDefinitions.find(
            (partDefinition) => partDefinition.id === manufacturingDraft.partDefinitionId,
          )
        : null;

      if (manufacturingDraft.process !== "fabrication" && !selectedPartDefinition) {
        setDataMessage(
          "Please choose a real part from the Parts tab before saving the CNC or 3D print job.",
        );
        return;
      }

      const payload: ManufacturingItemPayload = {
        ...manufacturingDraft,
        title:
          manufacturingDraft.process === "fabrication"
            ? manufacturingDraft.title
            : selectedPartDefinition?.name ?? manufacturingDraft.title,
        batchLabel: manufacturingDraft.batchLabel?.trim() || undefined,
      };

      if (manufacturingModalMode === "create") {
        await createManufacturingItemRecord(payload, handleUnauthorized);
      } else if (manufacturingModalMode === "edit" && activeManufacturingId) {
        await updateManufacturingItemRecord(
          activeManufacturingId,
          payload,
          handleUnauthorized,
        );
      }

      await loadWorkspace();
      closeManufacturingModal();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingManufacturing(false);
    }
  };

  const handleMaterialSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingMaterial(true);
    setDataMessage(null);

    try {
      if (materialModalMode === "create") {
        await createMaterialRecord(materialDraft, handleUnauthorized);
      } else if (materialModalMode === "edit" && activeMaterialId) {
        await updateMaterialRecord(activeMaterialId, materialDraft, handleUnauthorized);
      }

      await loadWorkspace();
      closeMaterialModal();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingMaterial(false);
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    setIsDeletingMaterial(true);
    setDataMessage(null);

    try {
      await deleteMaterialRecord(materialId, handleUnauthorized);
      if (activeMaterialId === materialId) {
        closeMaterialModal();
      }
      await loadWorkspace();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsDeletingMaterial(false);
    }
  };

  const handlePartDefinitionSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setIsSavingPartDefinition(true);
    setDataMessage(null);

    try {
      if (partDefinitionModalMode === "create") {
        await createPartDefinitionRecord(partDefinitionDraft, handleUnauthorized);
      } else if (partDefinitionModalMode === "edit" && activePartDefinitionId) {
        await updatePartDefinitionRecord(
          activePartDefinitionId,
          partDefinitionDraft,
          handleUnauthorized,
        );
      }

      await loadWorkspace();
      closePartDefinitionModal();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingPartDefinition(false);
    }
  };

  const handleDeletePartDefinition = async (partDefinitionId: string) => {
    setIsDeletingPartDefinition(true);
    setDataMessage(null);

    try {
      await deletePartDefinitionRecord(partDefinitionId, handleUnauthorized);
      if (activePartDefinitionId === partDefinitionId) {
        closePartDefinitionModal();
      }
      await loadWorkspace();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsDeletingPartDefinition(false);
    }
  };

  const handlePartInstanceSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setIsSavingPartInstance(true);
    setDataMessage(null);

    try {
      const selectedPartDefinition = bootstrap.partDefinitions.find(
        (partDefinition) => partDefinition.id === partInstanceDraft.partDefinitionId,
      );

      if (!selectedPartDefinition) {
        setDataMessage("Please choose a real part from the Parts tab before saving the part instance.");
        return;
      }

      if (!partInstanceDraft.mechanismId) {
        setDataMessage("Please choose a mechanism before saving the part instance.");
        return;
      }

      const payload: PartInstancePayload = {
        ...partInstanceDraft,
        name: partInstanceDraft.name.trim(),
      };

      if (partInstanceModalMode === "create") {
        await createPartInstanceRecord(payload, handleUnauthorized);
      } else if (partInstanceModalMode === "edit" && activePartInstanceId) {
        await updatePartInstanceRecord(
          activePartInstanceId,
          payload,
          handleUnauthorized,
        );
      }

      await loadWorkspace();
      closePartInstanceModal();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingPartInstance(false);
    }
  };

  const handleSubsystemSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingSubsystem(true);
    setDataMessage(null);

    try {
      const payload: SubsystemPayload = {
        ...subsystemDraft,
        risks: splitList(subsystemDraftRisks),
      };

      if (subsystemModalMode === "create") {
        await createSubsystemRecord(payload, handleUnauthorized);
      } else if (subsystemModalMode === "edit" && activeSubsystemId) {
        await updateSubsystemRecord(activeSubsystemId, payload, handleUnauthorized);
      }

      await loadWorkspace();
      closeSubsystemModal();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingSubsystem(false);
    }
  };

  const handleMechanismSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingMechanism(true);
    setDataMessage(null);

    try {
      if (mechanismModalMode === "create") {
        await createMechanismRecord(mechanismDraft, handleUnauthorized);
      } else if (mechanismModalMode === "edit" && activeMechanismId) {
        await updateMechanismRecord(activeMechanismId, mechanismDraft, handleUnauthorized);
      }

      await loadWorkspace();
      closeMechanismModal();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingMechanism(false);
    }
  };

  const handleDeleteMechanism = async (mechanismId: string) => {
    setIsDeletingMechanism(true);
    setDataMessage(null);

    try {
      await deleteMechanismRecord(mechanismId, handleUnauthorized);
      if (activeMechanismId === mechanismId) {
        closeMechanismModal();
      }
      await loadWorkspace();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsDeletingMechanism(false);
    }
  };

  const handleCreateMember = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingMember(true);
    setDataMessage(null);

    try {
      await createMemberRecord(memberForm, handleUnauthorized);
      setMemberForm({ name: "", role: "student" });
      setIsAddPersonOpen(false);
      await loadWorkspace();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingMember(false);
    }
  };

  const handleUpdateMember = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedMemberId || !memberEditDraft) {
      return;
    }

    setIsSavingMember(true);
    setDataMessage(null);

    try {
      await updateMemberRecord(
        selectedMemberId,
        {
          name: memberEditDraft.name.trim(),
          role: memberEditDraft.role,
        },
        handleUnauthorized,
      );
      setIsEditPersonOpen(false);
      await loadWorkspace();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingMember(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!memberId) {
      return;
    }

    setIsDeletingMember(true);
    setDataMessage(null);

    try {
      await deleteMemberRecord(memberId, handleUnauthorized);
      if (activePersonFilter === memberId) {
        setActivePersonFilter("all");
      }
      if (selectedMemberId === memberId) {
        setSelectedMemberId(null);
        setMemberEditDraft(null);
        setIsEditPersonOpen(false);
      }
      await loadWorkspace();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsDeletingMember(false);
    }
  };

  if (authBooting) {
    return (
      <AuthStatusScreen
        body="Checking the server-side auth configuration before the workspace opens."
        title="Loading sign-in requirements for MECO Robotics."
      />
    );
  }

  if (!authConfig) {
    return (
      <AuthStatusScreen
        body="The app could not confirm the server-side sign-in rules, so access is paused until the API is reachable again."
        message={authMessage}
        title="Couldn&apos;t load the authentication configuration."
      />
    );
  }

  if (enforcedAuthConfig && !sessionUser) {
      return (
      <SignInScreen
        authMessage={authMessage}
        clearAuthMessage={clearAuthMessage}
        hasEmailSignIn={isEmailAuthAvailable}
        hasGoogleSignIn={isGoogleAuthAvailable}
        googleButtonRef={googleButtonRef}
        isLocalGoogleDevHost={isLocalGoogleDevHost}
        isLocalGoogleOverrideActive={isLocalGoogleOverrideActive}
        isSigningIn={isSigningIn}
        onRequestEmailCode={handleRequestEmailCode}
        onVerifyEmailCode={handleVerifyEmailCode}
        signInConfig={enforcedAuthConfig}
      />
    );
  }

  return (
    <main
      className={`page-shell ${isDarkMode ? "dark-mode" : ""} ${isShellCompact ? "is-sidebar-collapsed" : ""}`}
      style={pageShellStyle}
    >
      <AppTopbar
        handleSignOut={handleSignOut}
        isLoadingData={isLoadingData}
        loadWorkspace={loadWorkspace}
        sessionUser={sessionUser}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        toggleSidebar={toggleSidebar}
        isSidebarCollapsed={isShellCompact}
      />

      <AppSidebar
        activeTab={activeTab}
        items={navigationItems}
        onSelectTab={setActiveTab}
        isCollapsed={isShellCompact}
      />

      <WorkspaceContent
        activePersonFilter={activePersonFilter}
        activeTab={activeTab}
        bootstrap={bootstrap}
        cncItems={cncItems}
        dataMessage={dataMessage}
        handleCreateMember={handleCreateMember}
        handleDeleteMember={handleDeleteMember}
        handleUpdateMember={handleUpdateMember}
        isAddPersonOpen={isAddPersonOpen}
        isDeletingMember={isDeletingMember}
        isEditPersonOpen={isEditPersonOpen}
        isLoadingData={isLoadingData}
        isSavingMember={isSavingMember}
        memberEditDraft={memberEditDraft}
        memberForm={memberForm}
        membersById={membersById}
        openCreateManufacturingModal={openCreateManufacturingModal}
        openCreateMaterialModal={openCreateMaterialModal}
        openCreateMechanismModal={openCreateMechanismModal}
        openCreatePartInstanceModal={openCreatePartInstanceModal}
        openCreateSubsystemModal={openCreateSubsystemModal}
        openCreatePartDefinitionModal={openCreatePartDefinitionModal}
        openCreatePurchaseModal={openCreatePurchaseModal}
        openCreateTaskModal={openCreateTaskModal}
        openEditManufacturingModal={openEditManufacturingModal}
        openEditMaterialModal={openEditMaterialModal}
        openEditMechanismModal={openEditMechanismModal}
        openEditPartInstanceModal={openEditPartInstanceModal}
        openEditSubsystemModal={openEditSubsystemModal}
        openEditPartDefinitionModal={openEditPartDefinitionModal}
        openEditPurchaseModal={openEditPurchaseModal}
        openEditTaskModal={openEditTaskModal}
        printItems={printItems}
        rosterMentors={rosterMentors}
        selectMember={selectMember}
        selectedMemberId={selectedMemberId}
        setIsAddPersonOpen={setIsAddPersonOpen}
        setIsEditPersonOpen={setIsEditPersonOpen}
        setMemberEditDraft={setMemberEditDraft}
        setMemberForm={setMemberForm}
        setActivePersonFilter={setActivePersonFilter}
        students={students}
        disciplinesById={disciplinesById}
        eventsById={eventsById}
        mechanismsById={mechanismsById}
        partDefinitionsById={partDefinitionsById}
        partInstancesById={partInstancesById}
        requirementsById={requirementsById}
        subsystemsById={subsystemsById}
      />

      <WorkspaceModalHost
        activePartDefinitionId={activePartDefinitionId}
        activeMaterialId={activeMaterialId}
        activeMechanismId={activeMechanismId}
        activeSubsystemId={activeSubsystemId}
        activeTask={activeTask}
        bootstrap={bootstrap}
        closeManufacturingModal={closeManufacturingModal}
        closeMaterialModal={closeMaterialModal}
        closeMechanismModal={closeMechanismModal}
        closePartInstanceModal={closePartInstanceModal}
        closePartDefinitionModal={closePartDefinitionModal}
        closePurchaseModal={closePurchaseModal}
        closeSubsystemModal={closeSubsystemModal}
        closeTaskModal={closeTaskModal}
        disciplinesById={disciplinesById}
        eventsById={eventsById}
        handleDeleteMaterial={handleDeleteMaterial}
        handleDeletePartDefinition={handleDeletePartDefinition}
        handleDeleteMechanism={handleDeleteMechanism}
        handlePartInstanceSubmit={handlePartInstanceSubmit}
        handleMechanismSubmit={handleMechanismSubmit}
        handleManufacturingSubmit={handleManufacturingSubmit}
        handleMaterialSubmit={handleMaterialSubmit}
        handlePartDefinitionSubmit={handlePartDefinitionSubmit}
        handlePurchaseSubmit={handlePurchaseSubmit}
        handleSubsystemSubmit={handleSubsystemSubmit}
        handleTaskSubmit={handleTaskSubmit}
        isDeletingMaterial={isDeletingMaterial}
        isDeletingPartDefinition={isDeletingPartDefinition}
        isDeletingMechanism={isDeletingMechanism}
        isSavingManufacturing={isSavingManufacturing}
        isSavingMaterial={isSavingMaterial}
        isSavingPartDefinition={isSavingPartDefinition}
        isSavingPartInstance={isSavingPartInstance}
        isSavingMechanism={isSavingMechanism}
        isSavingPurchase={isSavingPurchase}
        isSavingSubsystem={isSavingSubsystem}
        isSavingTask={isSavingTask}
        manufacturingDraft={manufacturingDraft}
        manufacturingModalMode={manufacturingModalMode}
        materialDraft={materialDraft}
        materialModalMode={materialModalMode}
        mechanismsById={mechanismsById}
        mentors={mentors}
        mechanismDraft={mechanismDraft}
        mechanismModalMode={mechanismModalMode}
        partInstanceDraft={partInstanceDraft}
        partInstanceModalMode={partInstanceModalMode}
        partDefinitionDraft={partDefinitionDraft}
        partDefinitionModalMode={partDefinitionModalMode}
        partDefinitionsById={partDefinitionsById}
        partInstancesById={partInstancesById}
        purchaseDraft={purchaseDraft}
        purchaseFinalCost={purchaseFinalCost}
        purchaseModalMode={purchaseModalMode}
        requirementsById={requirementsById}
        setMechanismDraft={setMechanismDraft}
        setManufacturingDraft={setManufacturingDraft}
        setMaterialDraft={setMaterialDraft}
        setPartInstanceDraft={setPartInstanceDraft}
        setPartDefinitionDraft={setPartDefinitionDraft}
        setPurchaseDraft={setPurchaseDraft}
        setPurchaseFinalCost={setPurchaseFinalCost}
        setSubsystemDraft={setSubsystemDraft}
        setSubsystemDraftRisks={setSubsystemDraftRisks}
        setTaskDraft={setTaskDraft}
        setTaskDraftBlockers={setTaskDraftBlockers}
        students={students}
        subsystemDraft={subsystemDraft}
        subsystemDraftRisks={subsystemDraftRisks}
        subsystemModalMode={subsystemModalMode}
        taskDraft={taskDraft}
        taskDraftBlockers={taskDraftBlockers}
        taskModalMode={taskModalMode}
      />
    </main>
  );
}
