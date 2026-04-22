import {
  startTransition,
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";

import "./App.css";
import {
  clearStoredSessionToken,
  createManufacturingItemRecord,
  createMemberRecord,
  createPurchaseItemRecord,
  createTask,
  deleteMemberRecord,
  exchangeGoogleCredential,
  fetchAuthConfig,
  fetchBootstrap,
  fetchCurrentUser,
  loadGoogleIdentityScript,
  loadStoredSessionToken,
  signOutFromGoogle,
  storeSessionToken,
  type AuthConfig,
  type GoogleCredentialResponse,
  type SessionUser,
  updateManufacturingItemRecord,
  updateMemberRecord,
  updatePurchaseItemRecord,
  updateTaskRecord,
  validateSession,
} from "./auth";
import type {
  BootstrapPayload,
  ManufacturingItemPayload,
  ManufacturingItemRecord,
  MemberPayload,
  PurchaseItemPayload,
  PurchaseItemRecord,
  TaskPayload,
  TaskRecord,
} from "./types";

type ViewTab = "timeline" | "queue" | "purchases" | "cnc" | "prints" | "roster";
type TaskModalMode = "create" | "edit" | null;
type PurchaseModalMode = "create" | "edit" | null;
type ManufacturingModalMode = "create" | "edit" | null;

const EMPTY_BOOTSTRAP: BootstrapPayload = {
  members: [],
  subsystems: [],
  tasks: [],
  purchaseItems: [],
  manufacturingItems: [],
};

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong while checking your session.";
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(value: number | undefined) {
  if (typeof value !== "number") {
    return "Pending";
  }

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function dateDiffInDays(start: string, end: string) {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  return Math.round(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinList(values: string[]) {
  return values.join(", ");
}

function buildEmptyTaskPayload(bootstrap: BootstrapPayload): TaskPayload {
  const firstSubsystem = bootstrap.subsystems[0]?.id ?? "";
  const firstStudent =
    bootstrap.members.find((member) => member.role === "student")?.id ??
    bootstrap.members[0]?.id ??
    null;
  const firstMentor =
    bootstrap.members.find((member) => member.role === "mentor")?.id ??
    bootstrap.members[0]?.id ??
    null;
  const today = new Date().toISOString().slice(0, 10);

  return {
    title: "",
    summary: "",
    subsystemId: firstSubsystem,
    ownerId: firstStudent,
    mentorId: firstMentor,
    startDate: today,
    dueDate: today,
    priority: "medium",
    status: "not-started",
    estimatedHours: 4,
    actualHours: 0,
    blockers: [],
    dependencyIds: [],
    linkedManufacturingIds: [],
    linkedPurchaseIds: [],
    requiresDocumentation: false,
    documentationLinked: false,
  };
}

function buildEmptyPurchasePayload(bootstrap: BootstrapPayload): PurchaseItemPayload {
  const firstSubsystem = bootstrap.subsystems[0]?.id ?? "";
  const requester = bootstrap.members[0]?.id ?? null;

  return {
    title: "",
    subsystemId: firstSubsystem,
    requestedById: requester,
    quantity: 1,
    vendor: "",
    linkLabel: "",
    estimatedCost: 0,
    finalCost: undefined,
    approvedByMentor: false,
    status: "requested",
  };
}

function buildEmptyManufacturingPayload(
  bootstrap: BootstrapPayload,
  process: ManufacturingItemPayload["process"],
): ManufacturingItemPayload {
  const firstSubsystem = bootstrap.subsystems[0]?.id ?? "";
  const requester = bootstrap.members[0]?.id ?? null;
  const today = new Date().toISOString().slice(0, 10);

  return {
    title: "",
    subsystemId: firstSubsystem,
    requestedById: requester,
    process,
    dueDate: today,
    material: "",
    quantity: 1,
    status: "requested",
    mentorReviewed: false,
    batchLabel: "",
  };
}

function taskToPayload(task: TaskRecord): TaskPayload {
  return {
    title: task.title,
    summary: task.summary,
    subsystemId: task.subsystemId,
    ownerId: task.ownerId,
    mentorId: task.mentorId,
    startDate: task.startDate,
    dueDate: task.dueDate,
    priority: task.priority,
    status: task.status,
    estimatedHours: task.estimatedHours,
    actualHours: task.actualHours,
    blockers: task.blockers,
    dependencyIds: task.dependencyIds,
    linkedManufacturingIds: task.linkedManufacturingIds,
    linkedPurchaseIds: task.linkedPurchaseIds,
    requiresDocumentation: task.requiresDocumentation,
    documentationLinked: task.documentationLinked,
  };
}

function purchaseToPayload(item: PurchaseItemRecord): PurchaseItemPayload {
  return {
    title: item.title,
    subsystemId: item.subsystemId,
    requestedById: item.requestedById,
    quantity: item.quantity,
    vendor: item.vendor,
    linkLabel: item.linkLabel,
    estimatedCost: item.estimatedCost,
    finalCost: item.finalCost,
    approvedByMentor: item.approvedByMentor,
    status: item.status,
  };
}

function manufacturingToPayload(
  item: ManufacturingItemRecord,
): ManufacturingItemPayload {
  return {
    title: item.title,
    subsystemId: item.subsystemId,
    requestedById: item.requestedById,
    process: item.process,
    dueDate: item.dueDate,
    material: item.material,
    quantity: item.quantity,
    status: item.status,
    mentorReviewed: item.mentorReviewed,
    batchLabel: item.batchLabel ?? "",
  };
}

function renderItemMeta(
  item: PurchaseItemRecord | ManufacturingItemRecord,
  membersById: Record<string, BootstrapPayload["members"][number]>,
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>,
) {
  return (
    <>
      <strong>{item.title}</strong>
      <small>
        {(item.subsystemId ? subsystemsById[item.subsystemId]?.name : null) ?? "Unknown subsystem"} /{" "}
        {(item.requestedById ? membersById[item.requestedById]?.name : null) ?? "Unassigned"}
      </small>
    </>
  );
}

const IconTasks = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
);
const IconPurchases = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
);
const IconManufacturing = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path></svg>
);
const IconRoster = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
);
const IconRefresh = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}><path d="M21 2v6h-6"></path><path d="M3 22v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.13-3.36L21 8"></path><path d="M20.49 15a9 9 0 0 1-14.13 3.36L3 16"></path></svg>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>("timeline");
  const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [authBooting, setAuthBooting] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [bootstrap, setBootstrap] = useState<BootstrapPayload>(EMPTY_BOOTSTRAP);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataMessage, setDataMessage] = useState<string | null>(null);

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
  const [collapsedSubsystems, setCollapsedSubsystems] = useState<
    Record<string, boolean>
  >({});
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  const students = useMemo(
    () => bootstrap.members.filter((member) => member.role === "student"),
    [bootstrap.members],
  );
  const mentors = useMemo(
    () => bootstrap.members.filter((member) => member.role === "mentor"),
    [bootstrap.members],
  );
  const membersById = useMemo(
    () => Object.fromEntries(bootstrap.members.map((member) => [member.id, member])),
    [bootstrap.members],
  );
  const subsystemsById = useMemo(
    () =>
      Object.fromEntries(
        bootstrap.subsystems.map((subsystem) => [subsystem.id, subsystem]),
      ),
    [bootstrap.subsystems],
  );
  const activeTask = useMemo(
    () => bootstrap.tasks.find((task) => task.id === activeTaskId) ?? null,
    [bootstrap.tasks, activeTaskId],
  );

  const timeline = useMemo(() => {
    if (!bootstrap.tasks.length) {
      return {
        days: [] as string[],
        subsystemRows: [] as Array<{
          id: string;
          name: string;
          taskCount: number;
          completeCount: number;
          tasks: Array<TaskRecord & { offset: number; span: number }>;
        }>,
      };
    }

    const sortedByStart = [...bootstrap.tasks].sort((left, right) => {
      return left.startDate.localeCompare(right.startDate);
    });
    const startDate = sortedByStart[0].startDate;
    const endDate = [...bootstrap.tasks].sort((left, right) => {
      return right.dueDate.localeCompare(left.dueDate);
    })[0].dueDate;
    const totalDays = dateDiffInDays(startDate, endDate) + 1;
    const days = Array.from({ length: totalDays }, (_, index) => {
      const date = new Date(`${startDate}T00:00:00`);
      date.setDate(date.getDate() + index);
      return date.toISOString().slice(0, 10);
    });

    const subsystemRows = bootstrap.subsystems.map((subsystem) => {
      const subsystemTasks = bootstrap.tasks
        .filter((task) => task.subsystemId === subsystem.id)
        .sort((left, right) => left.startDate.localeCompare(right.startDate))
        .map((task) => ({
          ...task,
          offset: dateDiffInDays(startDate, task.startDate),
          span: Math.max(1, dateDiffInDays(task.startDate, task.dueDate) + 1),
        }));

      return {
        id: subsystem.id,
        name: subsystem.name,
        taskCount: subsystemTasks.length,
        completeCount: subsystemTasks.filter((task) => task.status === "complete")
          .length,
        tasks: subsystemTasks,
      };
    });

    return {
      days,
      subsystemRows,
    };
  }, [bootstrap.subsystems, bootstrap.tasks]);

  const monthGroups = useMemo(() => {
    const groups: { month: string; span: number }[] = [];
    if (!timeline.days.length) return groups;

    let lastMonth = "";
    let currentSpan = 0;

    timeline.days.forEach((day) => {
      const d = new Date(`${day}T00:00:00`);
      const monthName = d.toLocaleDateString(undefined, { month: "long" });
      if (monthName !== lastMonth) {
        if (lastMonth !== "") {
          groups.push({ month: lastMonth, span: currentSpan });
        }
        lastMonth = monthName;
        currentSpan = 1;
      } else {
        currentSpan++;
      }
    });
    groups.push({ month: lastMonth, span: currentSpan });
    return groups;
  }, [timeline.days]);

  const purchaseSummary = useMemo(() => {
    const totalEstimated = bootstrap.purchaseItems.reduce(
      (sum, item) => sum + item.estimatedCost,
      0,
    );
    const delivered = bootstrap.purchaseItems.filter(
      (item) => item.status === "delivered",
    ).length;

    return {
      totalEstimated,
      delivered,
    };
  }, [bootstrap.purchaseItems]);

  const cncItems = useMemo(
    () =>
      bootstrap.manufacturingItems.filter((item) => item.process === "cnc"),
    [bootstrap.manufacturingItems],
  );
  const printItems = useMemo(
    () =>
      bootstrap.manufacturingItems.filter((item) => item.process === "3d-print"),
    [bootstrap.manufacturingItems],
  );

  const enforcedAuthConfig = authConfig?.enabled ? authConfig : null;
  const googleClientId = enforcedAuthConfig?.googleClientId ?? null;
  const hostedDomain = enforcedAuthConfig?.hostedDomain ?? "";
  const navigationItems = [
    {
      value: "timeline" as ViewTab,
      label: "Timeline",
      icon: <IconTasks />,
      count: bootstrap.tasks.length,
    },
    {
      value: "queue" as ViewTab,
      label: "Task queue",
      icon: <IconTasks />,
      count: bootstrap.tasks.length,
    },
    {
      value: "purchases" as ViewTab,
      label: "Purchases",
      icon: <IconPurchases />,
      count: bootstrap.purchaseItems.length,
    },
    {
      value: "cnc" as ViewTab,
      label: "CNC",
      icon: <IconManufacturing />,
      count: cncItems.length,
    },
    {
      value: "prints" as ViewTab,
      label: "3D print",
      icon: <IconManufacturing />,
      count: printItems.length,
    },
    {
      value: "roster" as ViewTab,
      label: "Roster editor",
      icon: <IconRoster />,
      count: bootstrap.members.length,
    },
  ];

  const handleUnauthorized = () => {
    signOutFromGoogle();
    startTransition(() => {
      setSessionUser(null);
    });
    setDataMessage("Your session expired. Please sign in again.");
  };

  const selectMember = (memberId: string | null, payload: BootstrapPayload) => {
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
  };

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
        setCollapsedSubsystems((current) => {
          const nextState = { ...current };
          payload.subsystems.forEach((subsystem) => {
            if (!(subsystem.id in nextState)) {
              nextState[subsystem.id] = false;
            }
          });
          return nextState;
        });
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
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsLoadingData(false);
    }
  }, [
    activeManufacturingId,
    activePersonFilter,
    activePurchaseId,
    activeTaskId,
    manufacturingModalMode,
    purchaseModalMode,
    selectedMemberId,
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

  const handleGoogleCredential = useEffectEvent(
    async (response: GoogleCredentialResponse) => {
      if (!response.credential) {
        setAuthMessage("Google did not return a credential to verify.");
        return;
      }

      setIsSigningIn(true);
      setAuthMessage(null);

      try {
        const session = await exchangeGoogleCredential(response.credential);
        storeSessionToken(session.token);
        startTransition(() => {
          setSessionUser(session.user);
        });
      } catch (error) {
        clearStoredSessionToken();
        setAuthMessage(toErrorMessage(error));
      } finally {
        setIsSigningIn(false);
      }
    },
  );

  useEffect(() => {
    let cancelled = false;

    async function bootstrapAuth() {
      try {
        const config = await fetchAuthConfig();
        if (cancelled) {
          return;
        }

        setAuthConfig(config);

        if (!config.enabled) {
          return;
        }

        const storedToken = loadStoredSessionToken();
        if (!storedToken) {
          return;
        }

        try {
          const user = await fetchCurrentUser(storedToken);
          if (cancelled) {
            return;
          }

          startTransition(() => {
            setSessionUser(user);
          });
        } catch {
          clearStoredSessionToken();
        }
      } catch (error) {
        if (!cancelled) {
          setAuthMessage(toErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setAuthBooting(false);
        }
      }
    }

    void bootstrapAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sessionUser || !enforcedAuthConfig) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void (async () => {
        const isValid = await validateSession();
        if (!isValid) {
          clearStoredSessionToken();
          signOutFromGoogle();
          startTransition(() => {
            setSessionUser(null);
          });
          setAuthMessage("Your session expired. Please sign in again.");
        }
      })();
    }, 5 * 60 * 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [enforcedAuthConfig, sessionUser]);

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

  useEffect(() => {
    if (authBooting || sessionUser || !googleClientId) {
      return;
    }

    const buttonSlot = googleButtonRef.current;
    if (!buttonSlot) {
      return;
    }

    let cancelled = false;
    const activeGoogleClientId = googleClientId;

    async function setupGoogleButton() {
      try {
        await loadGoogleIdentityScript();
        const activeButtonSlot = googleButtonRef.current;
        if (cancelled || !window.google || !activeButtonSlot) {
          return;
        }

        activeButtonSlot.innerHTML = "";
        window.google.accounts.id.initialize({
          client_id: activeGoogleClientId,
          callback: (response) => {
            void handleGoogleCredential(response);
          },
          hd: hostedDomain,
          ux_mode: "popup",
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        window.google.accounts.id.renderButton(activeButtonSlot, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          width: 320,
          logo_alignment: "left",
        });
      } catch (error) {
        if (!cancelled) {
          setAuthMessage(toErrorMessage(error));
        }
      }
    }

    void setupGoogleButton();

    return () => {
      cancelled = true;
      buttonSlot.innerHTML = "";
    };
  }, [authBooting, googleClientId, hostedDomain, sessionUser]);

  const handleSignOut = () => {
    clearStoredSessionToken();
    signOutFromGoogle();
    startTransition(() => {
      setSessionUser(null);
    });
    setAuthMessage(null);
    setBootstrap(EMPTY_BOOTSTRAP);
  };

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
      const payload: PurchaseItemPayload = {
        ...purchaseDraft,
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
      const payload: ManufacturingItemPayload = {
        ...manufacturingDraft,
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
      await updateMemberRecord(selectedMemberId, memberEditDraft, handleUnauthorized);
      setIsEditPersonOpen(false);
      await loadWorkspace();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingMember(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!selectedMemberId) {
      return;
    }

    setIsDeletingMember(true);
    setDataMessage(null);

    try {
      await deleteMemberRecord(selectedMemberId, handleUnauthorized);
      if (activePersonFilter === selectedMemberId) {
        setActivePersonFilter("all");
      }
      setSelectedMemberId(null);
      setMemberEditDraft(null);
      setIsEditPersonOpen(false);
      await loadWorkspace();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsDeletingMember(false);
    }
  };

  const toggleSubsystem = (subsystemId: string) => {
    setCollapsedSubsystems((current) => ({
      ...current,
      [subsystemId]: !current[subsystemId],
    }));
  };

  if (authBooting) {
    return (
      <main className="page-shell auth-shell">
        <section className="auth-card">
          <p className="eyebrow">Google SSO</p>
          <h1>Loading sign-in requirements for MECO Robotics.</h1>
          <p className="auth-body">
            Checking the server-side auth configuration before the workspace opens.
          </p>
        </section>
      </main>
    );
  }

  if (!authConfig) {
    return (
      <main className="page-shell auth-shell">
        <section className="auth-card">
          <p className="eyebrow">Google SSO</p>
          <h1>Couldn&apos;t load the authentication configuration.</h1>
          <p className="auth-body">
            The app could not confirm the server-side sign-in rules, so access is
            paused until the API is reachable again.
          </p>
          {authMessage ? <p className="auth-error">{authMessage}</p> : null}
        </section>
      </main>
    );
  }

  if (enforcedAuthConfig && !sessionUser) {
    return (
      <main className="page-shell auth-shell">
        <section className="auth-card">
          <p className="eyebrow">Google SSO</p>
          <h1>Sign in with your {enforcedAuthConfig.hostedDomain} Google account.</h1>
          <p className="auth-body">
            Google verifies the account, and the API then issues a short-lived app
            session for the project-management workspace.
          </p>
          <div className="auth-chip-row">
            <span className="auth-chip">
              Hosted domain: {enforcedAuthConfig.hostedDomain}
            </span>
            <span className="auth-chip">Google ID token + app session</span>
          </div>
          <div className="google-button-slot" ref={googleButtonRef} />
          <p className="auth-note">
            {isSigningIn
              ? "Verifying your Google identity..."
              : `Choose a Google Workspace account from ${enforcedAuthConfig.hostedDomain}.`}
          </p>
          {authMessage ? <p className="auth-error">{authMessage}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell with-sidebar" style={{ background: "#ffffff" }}>
      <header className="topbar" style={{ padding: "0.5rem 1.5rem", minHeight: "60px", background: "#fff", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
          <p className="eyebrow" style={{ fontSize: "0.65rem", margin: 0, color: "#16478e" }}>MECO PM</p>
          <h1 style={{ fontSize: "1.1rem", margin: 0, color: "#000000" }}>Project workspace</h1>
        </div>
        <div className="topbar-right" style={{ gap: "0.5rem" }}>
          <label className="toolbar-filter">
            <span>Filter person</span>
            <select
              onChange={(event) => setActivePersonFilter(event.target.value)}
              value={activePersonFilter}
            >
              <option value="all">All roster</option>
              {bootstrap.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>
          {sessionUser ? (
            <div className="profile-menu" style={{ marginLeft: "8px" }}>
              <button
                aria-haspopup="menu"
                className="user-chip profile-trigger"
                type="button"
                style={{ padding: "4px 12px", height: "34px" }}
                title={sessionUser.name}
              >
                {sessionUser.picture ? (
                  <img
                    alt={`${sessionUser.name} profile`}
                    className="profile-avatar"
                    referrerPolicy="no-referrer"
                    src={sessionUser.picture}
                  />
                ) : (
                  <span className="profile-avatar profile-avatar-fallback" aria-hidden="true">
                    {sessionUser.name.slice(0, 1).toUpperCase()}
                  </span>
                )}
              </button>
              <div aria-label="Profile menu" className="profile-menu-popover" role="menu">
                <button
                  className="profile-menu-item"
                  onClick={handleSignOut}
                  role="menuitem"
                  type="button"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="user-chip" style={{ padding: "4px 12px", marginLeft: "8px", height: "34px" }}>
              <strong style={{ fontSize: "0.85rem", color: "#000000" }}>Local access</strong>
            </div>
          )}
          <button
            aria-label="Refresh workspace"
            className={isLoadingData ? "icon-button refresh-button is-loading" : "icon-button refresh-button"}
            onClick={() => void loadWorkspace()}
            title="Refresh workspace"
            type="button"
          >
            <IconRefresh />
          </button>
        </div>
      </header>

      <nav className="sidebar" aria-label="Workspace views" style={{ padding: 0 }}>
        {navigationItems.map(({ value, label, icon, count }) => (
          <button
            className={activeTab === value ? "tab active" : "tab"}
            key={value}
            onClick={() => setActiveTab(value)}
            type="button"
          >
            <span className="sidebar-tab-main">
              <span className="sidebar-tab-icon" aria-hidden="true">{icon}</span>
              <span>{label}</span>
            </span>
            <span className="sidebar-tab-count" aria-label={`${count} items`}>{count}</span>
          </button>
        ))}
      </nav>

      <div
        className="dense-shell with-sidebar"
        style={{
          padding: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "stretch",
          minHeight: "100%",
        }}
      >

        {dataMessage ? <p className="banner banner-error">{dataMessage}</p> : null}
        {isLoadingData ? <p className="banner">Refreshing workspace data...</p> : null}

        {activeTab === "timeline" ? (
          <section className="panel dense-panel" style={{ margin: 0, borderRadius: 0, border: "none" }}>
            <div className="panel-header compact-header">
              <div>
                <p className="eyebrow">Schedule</p>
                <h2>Subsystem timeline</h2>
                <p className="section-copy filter-copy">
                  {activePersonFilter === "all"
                    ? "Showing all roster-linked tasks."
                    : `Filtered to ${membersById[activePersonFilter]?.name ?? "selected person"}.`}
                </p>
              </div>
              <div className="panel-actions">
                <button className="primary-action" onClick={openCreateTaskModal} type="button">
                  New task
                </button>
              </div>
            </div>
            {timeline.days.length ? (
              <div className="timeline-shell" style={{ overflowX: "auto", padding: 0, background: "#fff", borderRadius: 0 }}>
                <div
                  className="timeline-grid header-grid"
                  style={{
                    display: "grid",
                    width: "max-content",
                    minWidth: "100%",
                    gridTemplateColumns: `40px 200px repeat(${timeline.days.length}, minmax(44px, 1fr))`,
                    background: "#f9f9f9",
                    borderBottom: "2px solid #eee",
                    position: "sticky",
                    top: 0,
                    zIndex: 10
                  }}
                >
                  <div style={{ gridRow: "1 / span 2", borderRight: "1px solid #eee", borderBottom: "1px solid #eee" }} />
                  <div className="sticky-label" style={{ gridRow: "1 / span 2", padding: "10px 16px", fontWeight: "bold", borderRight: "1px solid #eee", borderBottom: "1px solid #eee", display: "flex", alignItems: "center" }}>Subsystem / Task</div>

                  {monthGroups.map((group, idx) => (
                    <div
                      key={`month-${idx}`}
                      style={{
                        gridColumn: `span ${group.span}`,
                        textAlign: "center",
                        fontSize: "10px",
                        fontWeight: "bold",
                        padding: "6px 0",
                        borderBottom: "1px solid #eee",
                        borderRight: "1px solid #f0f0f0",
                        textTransform: "uppercase",
                        color: "var(--official-blue)",
                        background: "#f4f4f4"
                      }}
                    >
                      {group.month}
                    </div>
                  ))}

                  {timeline.days.map((day) => {
                    const dateObj = new Date(`${day}T00:00:00`);
                    return (
                      <div
                        className="timeline-day"
                        key={day}
                        style={{ textAlign: "center", fontSize: "9px", padding: "4px 0", borderRight: "1px solid #f0f0f0", color: "#58667d", textTransform: "uppercase", display: "flex", flexDirection: "column", justifyContent: "center", gap: "1px", lineHeight: "1.1" }}
                      >
                        <span>{dateObj.toLocaleDateString(undefined, { weekday: "short" })}</span>
                        <strong style={{ fontSize: "13px", color: "var(--official-black)" }}>{dateObj.toLocaleDateString(undefined, { day: "numeric" })}</strong>
                      </div>
                    );
                  })}
                </div>
                {timeline.subsystemRows.map((subsystem) => {
                  const collapsed = collapsedSubsystems[subsystem.id] ?? false;
                  return (
                    <div className="subsystem-block" key={subsystem.id} style={{
                      display: "flex",
                      width: "max-content",
                      minWidth: "100%",
                      margin: "12px 0",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      overflow: "hidden",
                      background: "#fff",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                    }}>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: `40px 200px repeat(${timeline.days.length}, minmax(44px, 1fr))`,
                          background: "#fcfcfc",
                          borderBottom: collapsed ? "none" : "1px solid #f1f5f9"
                        }}>
                          <div className="subsystem-sidebar" style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            borderRight: "1px solid #f1f5f9",
                            background: "#f8fafc"
                          }}>
                            <button className="subsystem-toggle" onClick={() => toggleSubsystem(subsystem.id)} type="button" style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", fontSize: "12px", color: "#94a3b8" }}>
                              {collapsed ? "▶" : "▼"}
                            </button>
                          </div>
                          <div style={{ width: "200px", padding: "10px 12px", fontWeight: "bold", fontSize: "0.9rem", color: "#334155" }}>
                            {subsystem.name}
                            <span style={{ fontSize: "0.7rem", fontWeight: "normal", color: "#94a3b8", marginLeft: "8px" }}>
                              {subsystem.completeCount}/{subsystem.taskCount}
                            </span>
                          </div>
                          {timeline.days.map(day => <div key={day} style={{ borderLeft: "1px solid #f1f5f9" }} />)}
                        </div>

                        {!collapsed && subsystem.tasks.map((task) => (
                          <div key={task.id} style={{
                            display: "grid",
                            gridTemplateColumns: `40px 200px repeat(${timeline.days.length}, minmax(44px, 1fr))`,
                            borderBottom: "1px solid #f1f5f9",
                            minHeight: "40px"
                          }}>
                            <div style={{ borderRight: "1px solid #f1f5f9", background: "#f8fafc" }} />
                            <div className="task-label" style={{ width: "200px", padding: "8px 12px", fontSize: "0.8rem", borderRight: "1px solid #f1f5f9" }}>
                              <strong style={{ display: "block", color: "#475569" }}>{task.title}</strong>
                              <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{(task.ownerId ? membersById[task.ownerId]?.name : null) ?? "Unassigned"}</span>
                            </div>
                            {timeline.days.map(day => <div key={day} style={{ borderLeft: "1px solid #f8fafc" }} />)}
                            <button
                              className={`timeline-bar timeline-${task.status}`}
                              onClick={() => openEditTaskModal(task)}
                              style={{
                                gridColumn: `${task.offset + 3} / span ${task.span}`,
                                margin: "6px 4px",
                                zIndex: 5,
                                borderRadius: "4px",
                                border: "none",
                                color: "#fff",
                                fontSize: "0.7rem",
                                textAlign: "left",
                                padding: "0 8px",
                                cursor: "pointer",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                                alignSelf: "center"
                              }}
                              type="button"
                            >
                              {task.title}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="section-copy">Create a task to populate the subsystem timeline.</p>
            )}
          </section>
        ) : null}

        {activeTab === "queue" ? (
          <section className="panel dense-panel" style={{ margin: 0, borderRadius: 0, border: "none" }}>
            <div className="panel-header compact-header">
              <div>
                <p className="eyebrow">Execution</p>
                <h2>Task queue</h2>
                <p className="section-copy filter-copy">
                  {activePersonFilter === "all"
                    ? "All tasks in queue."
                    : `Only tasks owned by or mentored by ${membersById[activePersonFilter]?.name ?? "selected person"}.`}
                </p>
              </div>
              <div className="panel-actions">
                <button className="primary-action" onClick={openCreateTaskModal} type="button">
                  New task
                </button>
              </div>
            </div>
            <div className="table-shell">
              <div className="queue-table queue-table-header">
                <span>Task</span>
                <span>Subsystem</span>
                <span>Owner</span>
                <span>Status</span>
                <span>Due</span>
                <span>Priority</span>
              </div>
              {bootstrap.tasks.map((task) => (
                <button
                  className="queue-table queue-row"
                  key={task.id}
                  onClick={() => openEditTaskModal(task)}
                  type="button"
                >
                  <span className="queue-title">
                    <strong>{task.title}</strong>
                    <small>{task.summary}</small>
                  </span>
                  <span>{(task.subsystemId ? subsystemsById[task.subsystemId]?.name : null) ?? "Unknown"}</span>
                  <span>{(task.ownerId ? membersById[task.ownerId]?.name : null) ?? "Unassigned"}</span>
                  <span className={`pill status-${task.status}`}>{task.status}</span>
                  <span>{formatDate(task.dueDate)}</span>
                  <span className={`pill priority-${task.priority}`}>{task.priority}</span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === "purchases" ? (
          <section className="panel dense-panel" style={{ margin: 0, borderRadius: 0, border: "none" }}>
            <div className="panel-header compact-header">
              <div>
                <p className="eyebrow">Procurement</p>
                <h2>Purchase list</h2>
                <p className="section-copy filter-copy">
                  {activePersonFilter === "all"
                    ? "All purchase requests."
                    : `Only requests submitted by ${membersById[activePersonFilter]?.name ?? "selected person"}.`}
                </p>
              </div>
              <div className="panel-actions">
                <div className="mini-summary-row">
                  <div className="mini-chip">
                    <span>Estimated</span>
                    <strong>{formatCurrency(purchaseSummary.totalEstimated)}</strong>
                  </div>
                  <div className="mini-chip">
                    <span>Delivered</span>
                    <strong>{purchaseSummary.delivered}</strong>
                  </div>
                </div>
                <button
                  className="primary-action"
                  onClick={openCreatePurchaseModal}
                  type="button"
                >
                  Add purchase
                </button>
              </div>
            </div>
            <div className="table-shell">
              <div className="ops-table ops-table-header purchase-table">
                <span>Item</span>
                <span>Vendor</span>
                <span>Qty</span>
                <span>Status</span>
                <span>Mentor</span>
                <span>Est.</span>
                <span>Final</span>
              </div>
              {bootstrap.purchaseItems.map((item) => (
                <button
                  className="ops-table ops-row purchase-table ops-button-row"
                  key={item.id}
                  onClick={() => openEditPurchaseModal(item)}
                  type="button"
                >
                  <span className="queue-title">
                    {renderItemMeta(item, membersById, subsystemsById)}
                  </span>
                  <span>{item.vendor}</span>
                  <span>{item.quantity}</span>
                  <span className={`pill purchase-${item.status}`}>{item.status}</span>
                  <span>{item.approvedByMentor ? "Approved" : "Waiting"}</span>
                  <span>{formatCurrency(item.estimatedCost)}</span>
                  <span>{formatCurrency(item.finalCost)}</span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === "cnc" ? (
          <section className="panel dense-panel" style={{ margin: 0, borderRadius: 0, border: "none" }}>
            <div className="panel-header compact-header">
              <div>
                <p className="eyebrow">Manufacturing</p>
                <h2>CNC queue</h2>
                <p className="section-copy filter-copy">
                  {activePersonFilter === "all"
                    ? "All CNC jobs."
                    : `Only CNC jobs submitted by ${membersById[activePersonFilter]?.name ?? "selected person"}.`}
                </p>
              </div>
              <div className="panel-actions">
                <div className="mini-summary-row">
                  <div className="mini-chip">
                    <span>Open jobs</span>
                    <strong>{cncItems.length}</strong>
                  </div>
                </div>
                <button
                  className="primary-action"
                  onClick={() => openCreateManufacturingModal("cnc")}
                  type="button"
                >
                  Add CNC job
                </button>
              </div>
            </div>
            <div className="table-shell">
              <div className="ops-table ops-table-header manufacturing-table">
                <span>Part</span>
                <span>Material</span>
                <span>Qty</span>
                <span>Batch</span>
                <span>Due</span>
                <span>Status</span>
                <span>Mentor</span>
              </div>
              {cncItems.map((item) => (
                <button
                  className="ops-table ops-row manufacturing-table ops-button-row"
                  key={item.id}
                  onClick={() => openEditManufacturingModal(item)}
                  type="button"
                >
                  <span className="queue-title">
                    {renderItemMeta(item, membersById, subsystemsById)}
                  </span>
                  <span>{item.material}</span>
                  <span>{item.quantity}</span>
                  <span>{item.batchLabel ?? "Unbatched"}</span>
                  <span>{formatDate(item.dueDate)}</span>
                  <span className={`pill manufacturing-${item.status}`}>{item.status}</span>
                  <span>{item.mentorReviewed ? "Reviewed" : "Pending"}</span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === "prints" ? (
          <section className="panel dense-panel" style={{ margin: 0, borderRadius: 0, border: "none" }}>
            <div className="panel-header compact-header">
              <div>
                <p className="eyebrow">Manufacturing</p>
                <h2>3D print queue</h2>
                <p className="section-copy filter-copy">
                  {activePersonFilter === "all"
                    ? "All 3D print jobs."
                    : `Only print jobs submitted by ${membersById[activePersonFilter]?.name ?? "selected person"}.`}
                </p>
              </div>
              <div className="panel-actions">
                <div className="mini-summary-row">
                  <div className="mini-chip">
                    <span>Open jobs</span>
                    <strong>{printItems.length}</strong>
                  </div>
                </div>
                <button
                  className="primary-action"
                  onClick={() => openCreateManufacturingModal("3d-print")}
                  type="button"
                >
                  Add print job
                </button>
              </div>
            </div>
            <div className="table-shell">
              <div className="ops-table ops-table-header manufacturing-table">
                <span>Part</span>
                <span>Material</span>
                <span>Qty</span>
                <span>Batch</span>
                <span>Due</span>
                <span>Status</span>
                <span>Mentor</span>
              </div>
              {printItems.map((item) => (
                <button
                  className="ops-table ops-row manufacturing-table ops-button-row"
                  key={item.id}
                  onClick={() => openEditManufacturingModal(item)}
                  type="button"
                >
                  <span className="queue-title">
                    {renderItemMeta(item, membersById, subsystemsById)}
                  </span>
                  <span>{item.material}</span>
                  <span>{item.quantity}</span>
                  <span>{item.batchLabel ?? "Unbatched"}</span>
                  <span>{formatDate(item.dueDate)}</span>
                  <span className={`pill manufacturing-${item.status}`}>{item.status}</span>
                  <span>{item.mentorReviewed ? "Reviewed" : "Pending"}</span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === "roster" ? (
          <section className="panel dense-panel roster-layout" style={{ margin: 0, borderRadius: 0, border: "none" }}>
            <div className="panel-header compact-header">
              <div>
                <p className="eyebrow">People</p>
                <h2>Roster editor</h2>
              </div>
            </div>
            <div className="roster-columns">
              <div className="panel-subsection">
                <h3>Current roster</h3>
                <div className="roster-list">
                  {bootstrap.members.map((member) => (
                    <button
                      className={member.id === selectedMemberId ? "member-row active" : "member-row"}
                      key={member.id}
                      onClick={() => selectMember(member.id, bootstrap)}
                      type="button"
                    >
                      <strong>{member.name}</strong>
                      <span>{member.role}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="panel-subsection">
                <div className="compact-form">
                  <button
                    aria-expanded={isAddPersonOpen}
                    className="secondary-action roster-toggle-button"
                    onClick={() => setIsAddPersonOpen((current) => !current)}
                    type="button"
                  >
                    {isAddPersonOpen ? "Hide add person" : "Add person"}
                  </button>
                  {isAddPersonOpen ? (
                    <form className="compact-form roster-inline-form" onSubmit={handleCreateMember}>
                      <h3>Add person</h3>
                      <label className="field">
                        <span>Name</span>
                        <input
                          onChange={(event) =>
                            setMemberForm((current) => ({ ...current, name: event.target.value }))
                          }
                          required
                          value={memberForm.name}
                        />
                      </label>
                      <label className="field">
                        <span>Role</span>
                        <select
                          onChange={(event) =>
                            setMemberForm((current) => ({
                              ...current,
                              role: event.target.value as MemberPayload["role"],
                            }))
                          }
                          value={memberForm.role}
                        >
                          <option value="student">Student</option>
                          <option value="mentor">Mentor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </label>
                      <button className="primary-action" disabled={isSavingMember} type="submit">
                        {isSavingMember ? "Saving..." : "Add person"}
                      </button>
                    </form>
                  ) : null}
                </div>

                <div className="compact-form">
                  <button
                    aria-expanded={isEditPersonOpen}
                    className="secondary-action roster-toggle-button"
                    disabled={!memberEditDraft}
                    onClick={() => setIsEditPersonOpen((current) => !current)}
                    type="button"
                  >
                    {isEditPersonOpen ? "Hide edit person" : "Edit selected person"}
                  </button>
                  {memberEditDraft ? (
                    isEditPersonOpen ? (
                      <form className="compact-form roster-inline-form" onSubmit={handleUpdateMember}>
                        <h3>Edit selected person</h3>
                        <label className="field">
                          <span>Name</span>
                          <input
                            onChange={(event) =>
                              setMemberEditDraft((current) =>
                                current ? { ...current, name: event.target.value } : current,
                              )
                            }
                            value={memberEditDraft.name}
                          />
                        </label>
                        <label className="field">
                          <span>Role</span>
                          <select
                            onChange={(event) =>
                              setMemberEditDraft((current) =>
                                current
                                  ? {
                                    ...current,
                                    role: event.target.value as MemberPayload["role"],
                                  }
                                  : current,
                              )
                            }
                            value={memberEditDraft.role}
                          >
                            <option value="student">Student</option>
                            <option value="mentor">Mentor</option>
                            <option value="admin">Admin</option>
                          </select>
                        </label>
                        <button className="secondary-action" disabled={isSavingMember} type="submit">
                          {isSavingMember ? "Saving..." : "Update person"}
                        </button>
                        <button
                          className="danger-action"
                          disabled={isDeletingMember}
                          onClick={handleDeleteMember}
                          type="button"
                        >
                          {isDeletingMember ? "Removing..." : "Remove person"}
                        </button>
                      </form>
                    ) : null
                  ) : (
                    <div className="empty-state">
                      <p>Select someone from the roster to edit their role or name.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {taskModalMode ? (
          <div className="modal-scrim" role="presentation">
            <section aria-modal="true" className="modal-card" role="dialog">
              <div className="panel-header compact-header">
                <div>
                  <p className="eyebrow">Task editor</p>
                  <h2>{taskModalMode === "create" ? "Create task" : activeTask?.title ?? "Edit task"}</h2>
                </div>
                <button className="icon-button" onClick={closeTaskModal} type="button">
                  Close
                </button>
              </div>
              <form className="modal-form" onSubmit={handleTaskSubmit}>
                <label className="field modal-wide">
                  <span>Title</span>
                  <input
                    onChange={(event) =>
                      setTaskDraft((current) => ({ ...current, title: event.target.value }))
                    }
                    required
                    value={taskDraft.title}
                  />
                </label>
                <label className="field modal-wide">
                  <span>Summary</span>
                  <textarea
                    onChange={(event) =>
                      setTaskDraft((current) => ({ ...current, summary: event.target.value }))
                    }
                    required
                    rows={3}
                    value={taskDraft.summary}
                  />
                </label>
                <label className="field">
                  <span>Subsystem</span>
                  <select
                    onChange={(event) =>
                      setTaskDraft((current) => ({ ...current, subsystemId: event.target.value }))
                    }
                    value={taskDraft.subsystemId}
                  >
                    {bootstrap.subsystems.map((subsystem) => (
                      <option key={subsystem.id} value={subsystem.id}>
                        {subsystem.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Owner</span>
                  <select
                    onChange={(event) =>
                      setTaskDraft((current) => ({
                        ...current,
                        ownerId: event.target.value || null,
                      }))
                    }
                    value={taskDraft.ownerId ?? ""}
                  >
                    <option value="">Unassigned</option>
                    {students.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Mentor</span>
                  <select
                    onChange={(event) =>
                      setTaskDraft((current) => ({
                        ...current,
                        mentorId: event.target.value || null,
                      }))
                    }
                    value={taskDraft.mentorId ?? ""}
                  >
                    <option value="">Unassigned</option>
                    {mentors.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Status</span>
                  <select
                    onChange={(event) =>
                      setTaskDraft((current) => ({
                        ...current,
                        status: event.target.value as TaskPayload["status"],
                      }))
                    }
                    value={taskDraft.status}
                  >
                    <option value="not-started">Not started</option>
                    <option value="in-progress">In progress</option>
                    <option value="waiting-for-qa">Waiting for QA</option>
                    <option value="complete">Complete</option>
                  </select>
                </label>
                <label className="field">
                  <span>Priority</span>
                  <select
                    onChange={(event) =>
                      setTaskDraft((current) => ({
                        ...current,
                        priority: event.target.value as TaskPayload["priority"],
                      }))
                    }
                    value={taskDraft.priority}
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </label>
                <label className="field">
                  <span>Start date</span>
                  <input
                    onChange={(event) =>
                      setTaskDraft((current) => ({ ...current, startDate: event.target.value }))
                    }
                    type="date"
                    value={taskDraft.startDate}
                  />
                </label>
                <label className="field">
                  <span>Due date</span>
                  <input
                    onChange={(event) =>
                      setTaskDraft((current) => ({ ...current, dueDate: event.target.value }))
                    }
                    type="date"
                    value={taskDraft.dueDate}
                  />
                </label>
                <label className="field">
                  <span>Estimated hours</span>
                  <input
                    min="0"
                    onChange={(event) =>
                      setTaskDraft((current) => ({
                        ...current,
                        estimatedHours: Number(event.target.value),
                      }))
                    }
                    type="number"
                    value={taskDraft.estimatedHours}
                  />
                </label>
                <label className="field">
                  <span>Actual hours</span>
                  <input
                    min="0"
                    onChange={(event) =>
                      setTaskDraft((current) => ({
                        ...current,
                        actualHours: Number(event.target.value),
                      }))
                    }
                    step="0.5"
                    type="number"
                    value={taskDraft.actualHours}
                  />
                </label>
                <label className="field modal-wide">
                  <span>Blockers</span>
                  <input
                    onChange={(event) => setTaskDraftBlockers(event.target.value)}
                    placeholder="Comma-separated blockers"
                    value={taskDraftBlockers}
                  />
                </label>
                <div className="checkbox-row modal-wide">
                  <label className="checkbox-field">
                    <input
                      checked={taskDraft.requiresDocumentation}
                      onChange={(event) =>
                        setTaskDraft((current) => ({
                          ...current,
                          requiresDocumentation: event.target.checked,
                        }))
                      }
                      type="checkbox"
                    />
                    <span>Requires documentation</span>
                  </label>
                  <label className="checkbox-field">
                    <input
                      checked={taskDraft.documentationLinked}
                      onChange={(event) =>
                        setTaskDraft((current) => ({
                          ...current,
                          documentationLinked: event.target.checked,
                        }))
                      }
                      type="checkbox"
                    />
                    <span>Documentation linked</span>
                  </label>
                </div>
                <div className="modal-actions modal-wide">
                  <button className="secondary-action" onClick={closeTaskModal} type="button">
                    Cancel
                  </button>
                  <button className="primary-action" disabled={isSavingTask} type="submit">
                    {isSavingTask
                      ? "Saving..."
                      : taskModalMode === "create"
                        ? "Create task"
                        : "Save changes"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        ) : null}

        {purchaseModalMode ? (
          <div className="modal-scrim" role="presentation">
            <section aria-modal="true" className="modal-card" role="dialog">
              <div className="panel-header compact-header">
                <div>
                  <p className="eyebrow">Purchase editor</p>
                  <h2>
                    {purchaseModalMode === "create"
                      ? "Add purchase"
                      : "Edit purchase"}
                  </h2>
                </div>
                <button className="icon-button" onClick={closePurchaseModal} type="button">
                  Close
                </button>
              </div>
              <form className="modal-form" onSubmit={handlePurchaseSubmit}>
                <label className="field modal-wide">
                  <span>Title</span>
                  <input
                    onChange={(event) =>
                      setPurchaseDraft((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    required
                    value={purchaseDraft.title}
                  />
                </label>
                <label className="field">
                  <span>Subsystem</span>
                  <select
                    onChange={(event) =>
                      setPurchaseDraft((current) => ({
                        ...current,
                        subsystemId: event.target.value,
                      }))
                    }
                    value={purchaseDraft.subsystemId}
                  >
                    {bootstrap.subsystems.map((subsystem) => (
                      <option key={subsystem.id} value={subsystem.id}>
                        {subsystem.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Requester</span>
                  <select
                    onChange={(event) =>
                      setPurchaseDraft((current) => ({
                        ...current,
                        requestedById: event.target.value || null,
                      }))
                    }
                    value={purchaseDraft.requestedById ?? ""}
                  >
                    <option value="">Unassigned</option>
                    {bootstrap.members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Vendor</span>
                  <input
                    onChange={(event) =>
                      setPurchaseDraft((current) => ({
                        ...current,
                        vendor: event.target.value,
                      }))
                    }
                    required
                    value={purchaseDraft.vendor}
                  />
                </label>
                <label className="field">
                  <span>Link label</span>
                  <input
                    onChange={(event) =>
                      setPurchaseDraft((current) => ({
                        ...current,
                        linkLabel: event.target.value,
                      }))
                    }
                    required
                    value={purchaseDraft.linkLabel}
                  />
                </label>
                <label className="field">
                  <span>Quantity</span>
                  <input
                    min="1"
                    onChange={(event) =>
                      setPurchaseDraft((current) => ({
                        ...current,
                        quantity: Number(event.target.value),
                      }))
                    }
                    type="number"
                    value={purchaseDraft.quantity}
                  />
                </label>
                <label className="field">
                  <span>Status</span>
                  <select
                    onChange={(event) =>
                      setPurchaseDraft((current) => ({
                        ...current,
                        status: event.target.value as PurchaseItemPayload["status"],
                      }))
                    }
                    value={purchaseDraft.status}
                  >
                    <option value="requested">Requested</option>
                    <option value="approved">Approved</option>
                    <option value="purchased">Purchased</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </label>
                <label className="field">
                  <span>Estimated cost</span>
                  <input
                    min="0"
                    onChange={(event) =>
                      setPurchaseDraft((current) => ({
                        ...current,
                        estimatedCost: Number(event.target.value),
                      }))
                    }
                    type="number"
                    value={purchaseDraft.estimatedCost}
                  />
                </label>
                <label className="field">
                  <span>Final cost</span>
                  <input
                    min="0"
                    onChange={(event) => setPurchaseFinalCost(event.target.value)}
                    placeholder="Optional"
                    type="number"
                    value={purchaseFinalCost}
                  />
                </label>
                <div className="checkbox-row modal-wide">
                  <label className="checkbox-field">
                    <input
                      checked={purchaseDraft.approvedByMentor}
                      onChange={(event) =>
                        setPurchaseDraft((current) => ({
                          ...current,
                          approvedByMentor: event.target.checked,
                        }))
                      }
                      type="checkbox"
                    />
                    <span>Mentor approved</span>
                  </label>
                </div>
                <div className="modal-actions modal-wide">
                  <button className="secondary-action" onClick={closePurchaseModal} type="button">
                    Cancel
                  </button>
                  <button className="primary-action" disabled={isSavingPurchase} type="submit">
                    {isSavingPurchase
                      ? "Saving..."
                      : purchaseModalMode === "create"
                        ? "Add purchase"
                        : "Save changes"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        ) : null}

        {manufacturingModalMode ? (
          <div className="modal-scrim" role="presentation">
            <section aria-modal="true" className="modal-card" role="dialog">
              <div className="panel-header compact-header">
                <div>
                  <p className="eyebrow">Manufacturing editor</p>
                  <h2>
                    {manufacturingModalMode === "create"
                      ? manufacturingDraft.process === "cnc"
                        ? "Add CNC job"
                        : "Add 3D print job"
                      : "Edit manufacturing job"}
                  </h2>
                </div>
                <button
                  className="icon-button"
                  onClick={closeManufacturingModal}
                  type="button"
                >
                  Close
                </button>
              </div>
              <form className="modal-form" onSubmit={handleManufacturingSubmit}>
                <label className="field modal-wide">
                  <span>Title</span>
                  <input
                    onChange={(event) =>
                      setManufacturingDraft((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    required
                    value={manufacturingDraft.title}
                  />
                </label>
                <label className="field">
                  <span>Subsystem</span>
                  <select
                    onChange={(event) =>
                      setManufacturingDraft((current) => ({
                        ...current,
                        subsystemId: event.target.value,
                      }))
                    }
                    value={manufacturingDraft.subsystemId}
                  >
                    {bootstrap.subsystems.map((subsystem) => (
                      <option key={subsystem.id} value={subsystem.id}>
                        {subsystem.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Requester</span>
                  <select
                    onChange={(event) =>
                      setManufacturingDraft((current) => ({
                        ...current,
                        requestedById: event.target.value || null,
                      }))
                    }
                    value={manufacturingDraft.requestedById ?? ""}
                  >
                    <option value="">Unassigned</option>
                    {bootstrap.members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Process</span>
                  <select
                    onChange={(event) =>
                      setManufacturingDraft((current) => ({
                        ...current,
                        process: event.target.value as ManufacturingItemPayload["process"],
                      }))
                    }
                    value={manufacturingDraft.process}
                  >
                    <option value="cnc">CNC</option>
                    <option value="3d-print">3D print</option>
                    <option value="fabrication">Fabrication</option>
                  </select>
                </label>
                <label className="field">
                  <span>Due date</span>
                  <input
                    onChange={(event) =>
                      setManufacturingDraft((current) => ({
                        ...current,
                        dueDate: event.target.value,
                      }))
                    }
                    type="date"
                    value={manufacturingDraft.dueDate}
                  />
                </label>
                <label className="field">
                  <span>Material</span>
                  <input
                    onChange={(event) =>
                      setManufacturingDraft((current) => ({
                        ...current,
                        material: event.target.value,
                      }))
                    }
                    required
                    value={manufacturingDraft.material}
                  />
                </label>
                <label className="field">
                  <span>Quantity</span>
                  <input
                    min="1"
                    onChange={(event) =>
                      setManufacturingDraft((current) => ({
                        ...current,
                        quantity: Number(event.target.value),
                      }))
                    }
                    type="number"
                    value={manufacturingDraft.quantity}
                  />
                </label>
                <label className="field">
                  <span>Status</span>
                  <select
                    onChange={(event) =>
                      setManufacturingDraft((current) => ({
                        ...current,
                        status: event.target.value as ManufacturingItemPayload["status"],
                      }))
                    }
                    value={manufacturingDraft.status}
                  >
                    <option value="requested">Requested</option>
                    <option value="approved">Approved</option>
                    <option value="in-progress">In progress</option>
                    <option value="qa">QA</option>
                    <option value="complete">Complete</option>
                  </select>
                </label>
                <label className="field">
                  <span>Batch label</span>
                  <input
                    onChange={(event) =>
                      setManufacturingDraft((current) => ({
                        ...current,
                        batchLabel: event.target.value,
                      }))
                    }
                    placeholder="Optional"
                    value={manufacturingDraft.batchLabel ?? ""}
                  />
                </label>
                <div className="checkbox-row modal-wide">
                  <label className="checkbox-field">
                    <input
                      checked={manufacturingDraft.mentorReviewed}
                      onChange={(event) =>
                        setManufacturingDraft((current) => ({
                          ...current,
                          mentorReviewed: event.target.checked,
                        }))
                      }
                      type="checkbox"
                    />
                    <span>Mentor reviewed</span>
                  </label>
                </div>
                <div className="modal-actions modal-wide">
                  <button
                    className="secondary-action"
                    onClick={closeManufacturingModal}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="primary-action"
                    disabled={isSavingManufacturing}
                    type="submit"
                  >
                    {isSavingManufacturing
                      ? "Saving..."
                      : manufacturingModalMode === "create"
                        ? "Add job"
                        : "Save changes"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}
