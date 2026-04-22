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
  createMemberRecord,
  createTask,
  exchangeGoogleCredential,
  fetchAuthConfig,
  fetchBootstrap,
  fetchCurrentUser,
  loadGoogleIdentityScript,
  loadStoredSessionToken,
  signOutFromGoogle,
  type AuthConfig,
  type GoogleCredentialResponse,
  type SessionUser,
  storeSessionToken,
  updateMemberRecord,
  updateTaskRecord,
  validateSession,
} from "./auth";
import type { BootstrapPayload, MemberPayload, TaskPayload, TaskRecord } from "./types";

const EMPTY_BOOTSTRAP: BootstrapPayload = {
  members: [],
  subsystems: [],
  tasks: [],
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

function dateDiffInDays(start: string, end: string) {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  const diff = endDate.getTime() - startDate.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function buildEmptyTaskPayload(bootstrap: BootstrapPayload): TaskPayload {
  const firstSubsystem = bootstrap.subsystems[0]?.id ?? "";
  const firstStudent =
    bootstrap.members.find((member) => member.role === "student")?.id ??
    bootstrap.members[0]?.id ??
    "";
  const firstMentor =
    bootstrap.members.find((member) => member.role === "mentor")?.id ??
    bootstrap.members[0]?.id ??
    "";

  return {
    title: "",
    summary: "",
    subsystemId: firstSubsystem,
    ownerId: firstStudent,
    mentorId: firstMentor,
    startDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date().toISOString().slice(0, 10),
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

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinList(values: string[]) {
  return values.join(", ");
}

export default function App() {
  const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [authBooting, setAuthBooting] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [bootstrap, setBootstrap] = useState<BootstrapPayload>(EMPTY_BOOTSTRAP);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataMessage, setDataMessage] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState<TaskPayload>(buildEmptyTaskPayload(EMPTY_BOOTSTRAP));
  const [taskFormBlockers, setTaskFormBlockers] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskEditDraft, setTaskEditDraft] = useState<TaskPayload | null>(null);
  const [taskEditBlockers, setTaskEditBlockers] = useState("");
  const [memberForm, setMemberForm] = useState<MemberPayload>({ name: "", role: "student" });
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [memberEditDraft, setMemberEditDraft] = useState<MemberPayload | null>(null);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [isSavingMember, setIsSavingMember] = useState(false);
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

  const selectedTask = useMemo(
    () => bootstrap.tasks.find((task) => task.id === selectedTaskId) ?? null,
    [bootstrap.tasks, selectedTaskId],
  );
  const selectedMember = useMemo(
    () => bootstrap.members.find((member) => member.id === selectedMemberId) ?? null,
    [bootstrap.members, selectedMemberId],
  );

  const timeline = useMemo(() => {
    if (!bootstrap.tasks.length) {
      return {
        startDate: "",
        days: [] as string[],
        tasks: [] as Array<TaskRecord & { offset: number; span: number }>,
      };
    }

    const sortedTasks = [...bootstrap.tasks].sort((left, right) => {
      return left.startDate.localeCompare(right.startDate);
    });
    const startDate = sortedTasks[0].startDate;
    const endDate = [...bootstrap.tasks]
      .sort((left, right) => right.dueDate.localeCompare(left.dueDate))[0]
      .dueDate;
    const totalDays = dateDiffInDays(startDate, endDate) + 1;
    const days = Array.from({ length: totalDays }, (_, index) => {
      const date = new Date(`${startDate}T00:00:00`);
      date.setDate(date.getDate() + index);
      return date.toISOString().slice(0, 10);
    });

    return {
      startDate,
      days,
      tasks: sortedTasks.map((task) => ({
        ...task,
        offset: dateDiffInDays(startDate, task.startDate),
        span: Math.max(1, dateDiffInDays(task.startDate, task.dueDate) + 1),
      })),
    };
  }, [bootstrap.tasks]);

  const enforcedAuthConfig = authConfig?.enabled ? authConfig : null;
  const googleClientId = enforcedAuthConfig?.googleClientId ?? null;
  const hostedDomain = enforcedAuthConfig?.hostedDomain ?? "";

  const resetTaskForm = (nextBootstrap: BootstrapPayload) => {
    setTaskForm(buildEmptyTaskPayload(nextBootstrap));
    setTaskFormBlockers("");
  };

  const handleUnauthorized = () => {
    signOutFromGoogle();
    startTransition(() => {
      setSessionUser(null);
    });
    setDataMessage("Your session expired. Please sign in again.");
  };

  const loadWorkspace = useCallback(async () => {
    setIsLoadingData(true);
    setDataMessage(null);

    try {
      const payload = await fetchBootstrap(handleUnauthorized);
      const nextTaskId =
        selectedTaskId && payload.tasks.some((task) => task.id === selectedTaskId)
          ? selectedTaskId
          : payload.tasks[0]?.id ?? null;
      const nextMemberId =
        selectedMemberId && payload.members.some((member) => member.id === selectedMemberId)
          ? selectedMemberId
          : payload.members[0]?.id ?? null;
      const nextTask = payload.tasks.find((task) => task.id === nextTaskId) ?? null;
      const nextMember = payload.members.find((member) => member.id === nextMemberId) ?? null;

      startTransition(() => {
        setBootstrap(payload);
        setSelectedTaskId(nextTaskId);
        setSelectedMemberId(nextMemberId);
        setTaskEditDraft(nextTask ? taskToPayload(nextTask) : null);
        setTaskEditBlockers(nextTask ? joinList(nextTask.blockers) : "");
        setMemberEditDraft(
          nextMember
            ? {
                name: nextMember.name,
                role: nextMember.role,
              }
            : null,
        );
      });
      resetTaskForm(payload);
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsLoadingData(false);
    }
  }, [selectedMemberId, selectedTaskId]);

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

    void (async () => {
      await loadWorkspace();
    })();
  }, [authBooting, authConfig?.enabled, sessionUser, loadWorkspace]);

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

  const handleCreateTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingTask(true);
    setDataMessage(null);

    try {
      await createTask(
        {
          ...taskForm,
          blockers: splitList(taskFormBlockers),
        },
        handleUnauthorized,
      );
      await loadWorkspace();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingTask(false);
    }
  };

  const selectTask = (task: TaskRecord) => {
    setSelectedTaskId(task.id);
    setTaskEditDraft(taskToPayload(task));
    setTaskEditBlockers(joinList(task.blockers));
  };

  const selectMember = (member: BootstrapPayload["members"][number]) => {
    setSelectedMemberId(member.id);
    setMemberEditDraft({
      name: member.name,
      role: member.role,
    });
  };

  const handleUpdateTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTaskId || !taskEditDraft) {
      return;
    }

    setIsSavingTask(true);
    setDataMessage(null);

    try {
      await updateTaskRecord(
        selectedTaskId,
        {
          ...taskEditDraft,
          blockers: splitList(taskEditBlockers),
        },
        handleUnauthorized,
      );
      await loadWorkspace();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingTask(false);
    }
  };

  const handleCreateMember = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingMember(true);
    setDataMessage(null);

    try {
      await createMemberRecord(memberForm, handleUnauthorized);
      setMemberForm({ name: "", role: "student" });
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
      await loadWorkspace();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingMember(false);
    }
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
            The app could not confirm the server-side sign-in rules, so access is paused
            until the API is reachable again.
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
            <span className="auth-chip">Hosted domain: {enforcedAuthConfig.hostedDomain}</span>
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
    <main className="page-shell app-shell">
      <section className="session-card">
        <div className="session-identity">
          {sessionUser?.picture ? (
            <img
              alt={sessionUser.name}
              className="session-avatar"
              referrerPolicy="no-referrer"
              src={sessionUser.picture}
            />
          ) : (
            <div className="session-avatar session-avatar-fallback">
              {(sessionUser?.name ?? "M").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <p className="session-title">
              {sessionUser ? `Signed in as ${sessionUser.name}` : "Workspace access"}
            </p>
            <p className="session-copy">
              {sessionUser?.email ??
                "Authentication is disabled on this server, so the workspace is open for local testing."}
            </p>
          </div>
        </div>
        <div className="toolbar-actions">
          <button className="secondary-action" onClick={() => void loadWorkspace()} type="button">
            Refresh data
          </button>
          {sessionUser ? (
            <button className="secondary-action session-action" onClick={handleSignOut} type="button">
              Sign out
            </button>
          ) : null}
        </div>
      </section>

      <section className="workspace-header">
        <div>
          <p className="eyebrow">PM MVP</p>
          <h1>Timeline, task editing, and roster management in one browser workspace.</h1>
          <p className="section-copy">
            This pass keeps the backend in-memory for speed, but the workflows are real:
            load the current roster, create tasks, update ownership and dates, and watch the
            schedule shift on the timeline.
          </p>
        </div>
        <div className="status-stack">
          <div className="status-card">
            <span>Active tasks</span>
            <strong>{bootstrap.tasks.length}</strong>
          </div>
          <div className="status-card">
            <span>Rostered people</span>
            <strong>{bootstrap.members.length}</strong>
          </div>
          <div className="status-card">
            <span>Loading state</span>
            <strong>{isLoadingData ? "Syncing" : "Ready"}</strong>
          </div>
        </div>
      </section>

      {dataMessage ? <p className="banner banner-error">{dataMessage}</p> : null}
      {isLoadingData ? <p className="banner">Refreshing workspace data…</p> : null}

      <section className="panel-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Timeline</p>
            <h2>Delivery plan by task window</h2>
          </div>
          <p className="section-copy">
            The MVP timeline reads straight from each task&apos;s start and due date. Adjust a
            task and the chart updates on the next refresh.
          </p>
        </div>
        {timeline.days.length ? (
          <div className="timeline-shell">
            <div
              className="timeline-grid timeline-grid-header"
              style={{ gridTemplateColumns: `220px repeat(${timeline.days.length}, minmax(38px, 1fr))` }}
            >
              <div className="timeline-label-cell">Task</div>
              {timeline.days.map((day) => (
                <div className="timeline-day-cell" key={day}>
                  {formatDate(day)}
                </div>
              ))}
            </div>
            {timeline.tasks.map((task) => (
              <div
                className="timeline-grid timeline-row"
                key={task.id}
                style={{ gridTemplateColumns: `220px repeat(${timeline.days.length}, minmax(38px, 1fr))` }}
              >
                <div className="timeline-label-cell">
                  <strong>{task.title}</strong>
                  <span>
                    {subsystemsById[task.subsystemId]?.name ?? "Unknown subsystem"} ·{" "}
                    {membersById[task.ownerId]?.name ?? "Unassigned"}
                  </span>
                </div>
                {timeline.days.map((day) => (
                  <div className="timeline-day-slot" key={`${task.id}-${day}`} />
                ))}
                <button
                  className={`timeline-bar timeline-${task.status}`}
                  onClick={() => setSelectedTaskId(task.id)}
                  style={{
                    gridColumn: `${task.offset + 2} / span ${task.span}`,
                  }}
                  type="button"
                >
                  {task.title}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="section-copy">Create your first task to populate the timeline.</p>
        )}
      </section>

      <section className="two-column-layout">
        <div className="column-stack">
          <section className="panel-card">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Tasks</p>
                <h2>Create a new task</h2>
              </div>
            </div>
            <form className="form-grid" onSubmit={handleCreateTask}>
              <label className="field wide">
                <span>Title</span>
                <input
                  onChange={(event) =>
                    setTaskForm((current) => ({ ...current, title: event.target.value }))
                  }
                  required
                  value={taskForm.title}
                />
              </label>
              <label className="field wide">
                <span>Summary</span>
                <textarea
                  onChange={(event) =>
                    setTaskForm((current) => ({ ...current, summary: event.target.value }))
                  }
                  required
                  rows={3}
                  value={taskForm.summary}
                />
              </label>
              <label className="field">
                <span>Subsystem</span>
                <select
                  onChange={(event) =>
                    setTaskForm((current) => ({ ...current, subsystemId: event.target.value }))
                  }
                  value={taskForm.subsystemId}
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
                    setTaskForm((current) => ({ ...current, ownerId: event.target.value }))
                  }
                  value={taskForm.ownerId}
                >
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
                    setTaskForm((current) => ({ ...current, mentorId: event.target.value }))
                  }
                  value={taskForm.mentorId}
                >
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
                    setTaskForm((current) => ({
                      ...current,
                      status: event.target.value as TaskPayload["status"],
                    }))
                  }
                  value={taskForm.status}
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
                    setTaskForm((current) => ({
                      ...current,
                      priority: event.target.value as TaskPayload["priority"],
                    }))
                  }
                  value={taskForm.priority}
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
                    setTaskForm((current) => ({ ...current, startDate: event.target.value }))
                  }
                  type="date"
                  value={taskForm.startDate}
                />
              </label>
              <label className="field">
                <span>Due date</span>
                <input
                  onChange={(event) =>
                    setTaskForm((current) => ({ ...current, dueDate: event.target.value }))
                  }
                  type="date"
                  value={taskForm.dueDate}
                />
              </label>
              <label className="field">
                <span>Estimated hours</span>
                <input
                  min="0"
                  onChange={(event) =>
                    setTaskForm((current) => ({
                      ...current,
                      estimatedHours: Number(event.target.value),
                    }))
                  }
                  type="number"
                  value={taskForm.estimatedHours}
                />
              </label>
              <label className="field">
                <span>Actual hours</span>
                <input
                  min="0"
                  onChange={(event) =>
                    setTaskForm((current) => ({
                      ...current,
                      actualHours: Number(event.target.value),
                    }))
                  }
                  step="0.5"
                  type="number"
                  value={taskForm.actualHours}
                />
              </label>
              <label className="field wide">
                <span>Blockers</span>
                <input
                  onChange={(event) => setTaskFormBlockers(event.target.value)}
                  placeholder="Comma-separated blockers"
                  value={taskFormBlockers}
                />
              </label>
              <label className="field checkbox-field">
                <input
                  checked={taskForm.requiresDocumentation}
                  onChange={(event) =>
                    setTaskForm((current) => ({
                      ...current,
                      requiresDocumentation: event.target.checked,
                    }))
                  }
                  type="checkbox"
                />
                <span>Requires documentation</span>
              </label>
              <label className="field checkbox-field">
                <input
                  checked={taskForm.documentationLinked}
                  onChange={(event) =>
                    setTaskForm((current) => ({
                      ...current,
                      documentationLinked: event.target.checked,
                    }))
                  }
                  type="checkbox"
                />
                <span>Documentation linked</span>
              </label>
              <div className="form-actions wide">
                <button className="primary-action button-action" disabled={isSavingTask} type="submit">
                  {isSavingTask ? "Saving…" : "Create task"}
                </button>
              </div>
            </form>
          </section>

          <section className="panel-card">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Task list</p>
                <h2>Current queue</h2>
              </div>
            </div>
            <div className="task-list">
              {bootstrap.tasks.map((task) => (
                <button
                  className={task.id === selectedTaskId ? "task-row active" : "task-row"}
                  key={task.id}
                  onClick={() => selectTask(task)}
                  type="button"
                >
                  <div>
                    <strong>{task.title}</strong>
                    <span>
                      {subsystemsById[task.subsystemId]?.name ?? "Unknown subsystem"} · Due{" "}
                      {formatDate(task.dueDate)}
                    </span>
                  </div>
                  <div className="task-row-meta">
                    <span className={`pill priority-${task.priority}`}>{task.priority}</span>
                    <span className={`pill status-${task.status}`}>{task.status}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="column-stack">
          <section className="panel-card">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Task editor</p>
                <h2>{selectedTask ? `Update ${selectedTask.title}` : "Select a task"}</h2>
              </div>
            </div>
            {taskEditDraft && selectedTask ? (
              <form className="form-grid" onSubmit={handleUpdateTask}>
                <label className="field wide">
                  <span>Title</span>
                  <input
                    onChange={(event) =>
                      setTaskEditDraft((current) =>
                        current ? { ...current, title: event.target.value } : current,
                      )
                    }
                    value={taskEditDraft.title}
                  />
                </label>
                <label className="field wide">
                  <span>Summary</span>
                  <textarea
                    onChange={(event) =>
                      setTaskEditDraft((current) =>
                        current ? { ...current, summary: event.target.value } : current,
                      )
                    }
                    rows={3}
                    value={taskEditDraft.summary}
                  />
                </label>
                <label className="field">
                  <span>Status</span>
                  <select
                    onChange={(event) =>
                      setTaskEditDraft((current) =>
                        current
                          ? {
                              ...current,
                              status: event.target.value as TaskPayload["status"],
                            }
                          : current,
                      )
                    }
                    value={taskEditDraft.status}
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
                      setTaskEditDraft((current) =>
                        current
                          ? {
                              ...current,
                              priority: event.target.value as TaskPayload["priority"],
                            }
                          : current,
                      )
                    }
                    value={taskEditDraft.priority}
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </label>
                <label className="field">
                  <span>Owner</span>
                  <select
                    onChange={(event) =>
                      setTaskEditDraft((current) =>
                        current ? { ...current, ownerId: event.target.value } : current,
                      )
                    }
                    value={taskEditDraft.ownerId}
                  >
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
                      setTaskEditDraft((current) =>
                        current ? { ...current, mentorId: event.target.value } : current,
                      )
                    }
                    value={taskEditDraft.mentorId}
                  >
                    {mentors.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Start date</span>
                  <input
                    onChange={(event) =>
                      setTaskEditDraft((current) =>
                        current ? { ...current, startDate: event.target.value } : current,
                      )
                    }
                    type="date"
                    value={taskEditDraft.startDate}
                  />
                </label>
                <label className="field">
                  <span>Due date</span>
                  <input
                    onChange={(event) =>
                      setTaskEditDraft((current) =>
                        current ? { ...current, dueDate: event.target.value } : current,
                      )
                    }
                    type="date"
                    value={taskEditDraft.dueDate}
                  />
                </label>
                <label className="field wide">
                  <span>Blockers</span>
                  <input
                    onChange={(event) => setTaskEditBlockers(event.target.value)}
                    value={taskEditBlockers}
                  />
                </label>
                <div className="form-actions wide">
                  <button className="primary-action button-action" disabled={isSavingTask} type="submit">
                    {isSavingTask ? "Saving…" : "Update task"}
                  </button>
                </div>
              </form>
            ) : (
              <p className="section-copy">Choose a task from the list to edit it.</p>
            )}
          </section>

          <section className="panel-card">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Roster</p>
                <h2>Students and mentors</h2>
              </div>
            </div>
            <div className="roster-grid">
              <div className="roster-column">
                {bootstrap.members.map((member) => (
                  <button
                  className={member.id === selectedMemberId ? "member-row active" : "member-row"}
                  key={member.id}
                  onClick={() => selectMember(member)}
                  type="button"
                >
                    <strong>{member.name}</strong>
                    <span>{member.role}</span>
                  </button>
                ))}
              </div>
              <div className="roster-column">
                <form className="form-grid compact" onSubmit={handleCreateMember}>
                  <h3>Add to roster</h3>
                  <label className="field wide">
                    <span>Name</span>
                    <input
                      onChange={(event) =>
                        setMemberForm((current) => ({ ...current, name: event.target.value }))
                      }
                      required
                      value={memberForm.name}
                    />
                  </label>
                  <label className="field wide">
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
                  <div className="form-actions wide">
                    <button className="primary-action button-action" disabled={isSavingMember} type="submit">
                      {isSavingMember ? "Saving…" : "Add person"}
                    </button>
                  </div>
                </form>
                {memberEditDraft && selectedMember ? (
                  <form className="form-grid compact" onSubmit={handleUpdateMember}>
                    <h3>Edit selected person</h3>
                    <label className="field wide">
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
                    <label className="field wide">
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
                    <div className="form-actions wide">
                      <button className="secondary-action button-action" disabled={isSavingMember} type="submit">
                        {isSavingMember ? "Saving…" : "Update person"}
                      </button>
                    </div>
                  </form>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
