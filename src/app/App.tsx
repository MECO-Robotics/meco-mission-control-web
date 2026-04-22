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
import { GoogleSignInScreen, AuthStatusScreen } from "../components/auth/AuthScreens";
import { AppSidebar } from "../components/layout/AppSidebar";
import { AppTopbar } from "../components/layout/AppTopbar";
import {
  IconManufacturing, IconPurchases, IconRoster, IconTasks
} from "../components/shared/Icons";
import { WorkspaceContent } from "../components/workspace/WorkspaceContent";
import {
  ManufacturingEditorModal,
  PurchaseEditorModal,
  TaskEditorModal,
} from "../components/workspace/WorkspaceModals";
import {
  buildEmptyManufacturingPayload, buildEmptyPurchasePayload, buildEmptyTaskPayload, joinList, manufacturingToPayload, purchaseToPayload, splitList, taskToPayload, toErrorMessage
} from "../lib/appUtils";
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
  isLocalGoogleAuthHost,
  isUsingLocalGoogleClientIdOverride,
  loadGoogleIdentityScript,
  loadStoredSessionToken,
  resolveGoogleClientId,
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
} from "../lib/auth";
import type {
  BootstrapPayload,
  ManufacturingItemPayload,
  ManufacturingItemRecord,
  MemberPayload,
  PurchaseItemPayload,
  PurchaseItemRecord,
  TaskPayload,
  TaskRecord,
} from "../types";

type ViewTab = "timeline" | "queue" | "purchases" | "cnc" | "prints" | "roster" | "materials";
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

function renderItemMeta(
  item: PurchaseItemRecord | ManufacturingItemRecord,
  membersById: Record<string, BootstrapPayload["members"][number]>,
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>,
) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      <strong style={{ color: "var(--text-title)" }}>{item.title}</strong>
      <small style={{ color: "var(--text-copy)" }}>
        {(item.subsystemId ? subsystemsById[item.subsystemId]?.name : null) ?? "Unknown subsystem"} /{" "}
        {(item.requestedById ? membersById[item.requestedById]?.name : null) ?? "Unassigned"}
      </small>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>("timeline");
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("meco-theme") === "dark";
  });

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem("meco-theme", next ? "dark" : "light");
      return next;
    });
  };

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
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  const students = useMemo(
    () => bootstrap.members.filter((member) => member.role === "student"),
    [bootstrap.members],
  );
  const mentors = useMemo(
    () => bootstrap.members.filter((member) => member.role === "mentor"),
    [bootstrap.members],
  );
  const rosterMentors = useMemo(
    () =>
      bootstrap.members.filter(
        (member) => member.role === "mentor" || member.role === "admin",
      ),
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
  const googleClientId = resolveGoogleClientId(authConfig);
  const hostedDomain = enforcedAuthConfig?.hostedDomain ?? "";
  const isLocalGoogleOverrideActive = isUsingLocalGoogleClientIdOverride();
  const isLocalGoogleDevHost = isLocalGoogleAuthHost();
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
    {
      value: "materials" as ViewTab,
      label: "Materials",
      icon: <IconManufacturing />,
      count: Array.from(new Set(bootstrap.manufacturingItems.map(i => i.material))).length,
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
          hd: hostedDomain || undefined,
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
      <GoogleSignInScreen
        authMessage={authMessage}
        googleButtonRef={googleButtonRef}
        isLocalGoogleDevHost={isLocalGoogleDevHost}
        isLocalGoogleOverrideActive={isLocalGoogleOverrideActive}
        isSigningIn={isSigningIn}
        signInConfig={enforcedAuthConfig}
      />
    );
  }

  return (
    <main
      className={`page-shell with-sidebar ${isDarkMode ? "dark-mode" : ""}`}
      style={{
        background: isDarkMode ? "#0f172a" : "#ffffff",
        paddingTop: "64px",
        "--bg-panel": isDarkMode ? "#1e293b" : "#ffffff",
        "--border-base": isDarkMode ? "#334155" : "#e5e7eb",
        "--text-title": isDarkMode ? "#f8fafc" : "#000000",
        "--text-copy": isDarkMode ? "#e2e8f0" : "#64748b",
        "--meco-blue": isDarkMode ? "#3b82f6" : "#16478e",
        "--meco-soft-blue": isDarkMode ? "#1e3a8a" : "#eff6ff",
        "--bg-row-alt": isDarkMode ? "#0f172a" : "#f8fafc",
        "--official-black": isDarkMode ? "#f8fafc" : "#000000",
        colorScheme: isDarkMode ? "dark" : "light",
      } as React.CSSProperties}
    >
      <AppTopbar
        activePersonFilter={activePersonFilter}
        bootstrap={bootstrap}
        handleSignOut={handleSignOut}
        isLoadingData={isLoadingData}
        loadWorkspace={loadWorkspace}
        sessionUser={sessionUser}
        setActivePersonFilter={setActivePersonFilter}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />

      <AppSidebar
        activeTab={activeTab}
        items={navigationItems}
        onSelectTab={(tab) => setActiveTab(tab as ViewTab)}
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
        openCreatePurchaseModal={openCreatePurchaseModal}
        openCreateTaskModal={openCreateTaskModal}
        openEditManufacturingModal={openEditManufacturingModal}
        openEditPurchaseModal={openEditPurchaseModal}
        openEditTaskModal={openEditTaskModal}
        printItems={printItems}
        purchaseSummary={purchaseSummary}
        renderItemMeta={renderItemMeta}
        rosterMentors={rosterMentors}
        selectMember={selectMember}
        selectedMemberId={selectedMemberId}
        setIsAddPersonOpen={setIsAddPersonOpen}
        setIsEditPersonOpen={setIsEditPersonOpen}
        setMemberEditDraft={setMemberEditDraft}
        setMemberForm={setMemberForm}
        students={students}
        subsystemsById={subsystemsById}
      />

      {taskModalMode ? (
        <TaskEditorModal
          activeTask={activeTask}
          bootstrap={bootstrap}
          closeTaskModal={closeTaskModal}
          handleTaskSubmit={handleTaskSubmit}
          isSavingTask={isSavingTask}
          mentors={mentors}
          setTaskDraft={setTaskDraft}
          setTaskDraftBlockers={setTaskDraftBlockers}
          students={students}
          taskDraft={taskDraft}
          taskDraftBlockers={taskDraftBlockers}
          taskModalMode={taskModalMode}
        />
      ) : null}

      {purchaseModalMode ? (
        <PurchaseEditorModal
          bootstrap={bootstrap}
          closePurchaseModal={closePurchaseModal}
          handlePurchaseSubmit={handlePurchaseSubmit}
          isSavingPurchase={isSavingPurchase}
          purchaseDraft={purchaseDraft}
          purchaseFinalCost={purchaseFinalCost}
          purchaseModalMode={purchaseModalMode}
          setPurchaseDraft={setPurchaseDraft}
          setPurchaseFinalCost={setPurchaseFinalCost}
        />
      ) : null}

      {manufacturingModalMode ? (
        <ManufacturingEditorModal
          bootstrap={bootstrap}
          closeManufacturingModal={closeManufacturingModal}
          handleManufacturingSubmit={handleManufacturingSubmit}
          isSavingManufacturing={isSavingManufacturing}
          manufacturingDraft={manufacturingDraft}
          manufacturingModalMode={manufacturingModalMode}
          setManufacturingDraft={setManufacturingDraft}
        />
      ) : null}
    </main>
  );
}
