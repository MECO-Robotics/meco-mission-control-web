import React, { useMemo, useState } from "react";
import { IconPerson, IconTasks } from "../../../components/shared/Icons";
import { dateDiffInDays } from "../../../lib/appUtils";
import type { BootstrapPayload, TaskRecord } from "../../../types";
import { EditableHoverIndicator } from "../shared/WorkspaceViewShared";
import { WORKSPACE_PANEL_CLASS } from "../shared/workspaceTypes";

interface TimelineViewProps {
    bootstrap: BootstrapPayload;
    activePersonFilter: string;
    setActivePersonFilter: (value: string) => void;
    membersById: Record<string, BootstrapPayload["members"][number]>;
    openEditTaskModal: (task: TaskRecord) => void;
    openCreateTaskModal: () => void;
}

const SUBSYSTEM_COLUMN_WIDTH = 104;
const TASK_LABEL_COLUMN_WIDTH = 148;

export const TimelineView: React.FC<TimelineViewProps> = ({
    bootstrap,
    activePersonFilter,
    setActivePersonFilter,
    membersById,
    openEditTaskModal,
    openCreateTaskModal,
}) => {
    const [viewInterval, setViewInterval] = useState<"all" | "week" | "month">("all");
    const [collapsedSubsystems, setCollapsedSubsystems] = useState<Record<string, boolean>>({});

    const timeline = useMemo(() => {
        if (!bootstrap.tasks.length) return { days: [], subsystemRows: [] };

        let startDate: string;
        let endDate: string;

        if (viewInterval === "all") {
            const sorted = [...bootstrap.tasks].sort((a, b) => a.startDate.localeCompare(b.startDate));
            const endSorted = [...bootstrap.tasks].sort((a, b) => b.dueDate.localeCompare(a.dueDate));
            const startObj = new Date(`${sorted[0].startDate}T00:00:00`);
            startObj.setDate(1);
            const endObj = new Date(`${endSorted[0].dueDate}T00:00:00`);
            endObj.setMonth(endObj.getMonth() + 1);
            endObj.setDate(0);
            startDate = startObj.toISOString().slice(0, 10);
            endDate = endObj.toISOString().slice(0, 10);
        } else {
            const now = new Date();
            now.setHours(12, 0, 0, 0);
            let s: Date;
            let e: Date;
            if (viewInterval === "week") {
                s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay(), 12);
                e = new Date(s);
                e.setDate(s.getDate() + 6);
            } else {
                s = new Date(now.getFullYear(), now.getMonth(), 1, 12);
                e = new Date(now.getFullYear(), now.getMonth() + 1, 0, 12);
            }
            startDate = s.toISOString().slice(0, 10);
            endDate = e.toISOString().slice(0, 10);
        }

        const totalDays = dateDiffInDays(startDate, endDate) + 1;
        const days = Array.from({ length: totalDays }, (_, i) => {
            const d = new Date(`${startDate}T00:00:00`);
            d.setDate(d.getDate() + i);
            return d.toISOString().slice(0, 10);
        });

        const subsystemRows = bootstrap.subsystems.map((sub) => {
            const subTasks = bootstrap.tasks
                .filter((t) => t.subsystemId === sub.id && t.startDate <= endDate && t.dueDate >= startDate)
                .map((t) => ({
                    ...t,
                    offset: dateDiffInDays(startDate, t.startDate < startDate ? startDate : t.startDate),
                    span: Math.max(
                        1,
                        dateDiffInDays(
                            t.startDate < startDate ? startDate : t.startDate,
                            t.dueDate > endDate ? endDate : t.dueDate,
                        ) + 1,
                    ),
                }));

            return {
                id: sub.id,
                name: sub.name,
                taskCount: subTasks.length,
                completeCount: subTasks.filter((t) => t.status === "complete").length,
                tasks: subTasks,
            };
        });

        return { days, subsystemRows };
    }, [bootstrap.subsystems, bootstrap.tasks, viewInterval]);

    const timelineGridTemplate = useMemo(() => {
        const dayWidth =
            viewInterval === "all" ? "44px" : viewInterval === "week" ? "minmax(44px, 1fr)" : "minmax(28px, 1fr)";
        return `${SUBSYSTEM_COLUMN_WIDTH}px ${TASK_LABEL_COLUMN_WIDTH}px repeat(${timeline.days.length}, ${dayWidth})`;
    }, [timeline.days.length, viewInterval]);

    const gridMinWidth = useMemo(() => {
        const minDayWidth = viewInterval === "month" ? 28 : 44;
        return SUBSYSTEM_COLUMN_WIDTH + TASK_LABEL_COLUMN_WIDTH + (timeline.days.length * minDayWidth);
    }, [timeline.days.length, viewInterval]);

    const monthGroups = useMemo(() => {
        const groups: { month: string; span: number }[] = [];
        let lastMonth = "";
        let currentSpan = 0;

        timeline.days.forEach((day) => {
            const monthName = new Date(`${day}T00:00:00`).toLocaleDateString(undefined, { month: "long" });
            if (monthName !== lastMonth) {
                if (lastMonth !== "") groups.push({ month: lastMonth, span: currentSpan });
                lastMonth = monthName;
                currentSpan = 1;
            } else {
                currentSpan++;
            }
        });

        if (lastMonth) groups.push({ month: lastMonth, span: currentSpan });
        return groups;
    }, [timeline.days]);

    const toggleSubsystem = (id: string) => {
        setCollapsedSubsystems((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const activePersonFilterLabel =
        activePersonFilter === "all"
            ? "All roster"
            : membersById[activePersonFilter]?.name ?? "Selected person";

    return (
        <section className={`panel dense-panel timeline-layout ${WORKSPACE_PANEL_CLASS}`}>
            <div className="panel-header compact-header">
                <div className="queue-section-header">
                    <h2 style={{ color: "var(--text-title)" }}>Subsystem timeline</h2>
                    <p className="section-copy filter-copy" style={{ color: "var(--text-copy)" }}>
                        {activePersonFilter === "all"
                            ? "Showing all roster-linked tasks."
                            : `Filtered to ${membersById[activePersonFilter]?.name ?? "selected person"}.`}
                    </p>
                </div>
                <div className="panel-actions filter-toolbar timeline-toolbar">
                    <div className="timeline-toolbar-filters">
                        <label
                            aria-label="Filter person"
                            className={`toolbar-filter toolbar-filter-compact timeline-roster-filter${activePersonFilter !== "all" ? " is-active" : ""}`}
                        >
                            <span aria-hidden="true" className="toolbar-filter-icon">
                                <IconPerson />
                            </span>
                            <select
                                onChange={(event) => setActivePersonFilter(event.target.value)}
                                title={activePersonFilterLabel}
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
                        <label className="toolbar-filter toolbar-filter-compact timeline-interval-filter">
                            <span className="toolbar-filter-icon"><IconTasks /></span>
                            <select
                                aria-label="Timeline interval"
                                onChange={(e) => setViewInterval(e.target.value as "all" | "week" | "month")}
                                value={viewInterval}
                            >
                                <option value="all">All time</option>
                                <option value="week">This week</option>
                                <option value="month">This month</option>
                            </select>
                        </label>
                    </div>
                    <button className="primary-action queue-toolbar-action" onClick={openCreateTaskModal} title="Add task" type="button">Add task</button>
                </div>
            </div>

            {timeline.days.length ? (
                <div className="timeline-shell" style={{ overflowX: "auto", padding: 0, background: "var(--bg-panel)", borderRadius: 0, border: "1px solid var(--border-base)" }}>
                    <div style={{ display: "grid", width: "100%", minWidth: `${gridMinWidth}px`, gridTemplateColumns: timelineGridTemplate, boxSizing: "border-box" }}>
                        <div
                            className="sticky-label"
                            style={{
                                gridRow: "1 / span 2",
                                gridColumn: "1 / span 2",
                                width: `${SUBSYSTEM_COLUMN_WIDTH + TASK_LABEL_COLUMN_WIDTH}px`,
                                minWidth: `${SUBSYSTEM_COLUMN_WIDTH + TASK_LABEL_COLUMN_WIDTH}px`,
                                maxWidth: `${SUBSYSTEM_COLUMN_WIDTH + TASK_LABEL_COLUMN_WIDTH}px`,
                                padding: "10px 12px",
                                fontWeight: "bold",
                                borderRight: "1px solid var(--border-base)",
                                borderBottom: "1px solid var(--border-base)",
                                display: "flex",
                                alignItems: "center",
                                boxSizing: "border-box",
                                position: "sticky",
                                left: 0,
                                zIndex: 15,
                                background: "var(--bg-panel)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            Subsystem / Task
                        </div>

                        {(() => {
                            let currentCol = 3;
                            return monthGroups.map((group, idx) => {
                                const start = currentCol;
                                currentCol += group.span;
                                return (
                                    <div key={`month-${idx}`} style={{ gridRow: "1", gridColumn: `${start} / span ${group.span}`, textAlign: "center", fontSize: "10px", fontWeight: "bold", padding: "6px 0", borderBottom: "1px solid var(--border-base)", borderRight: "1px solid var(--border-base)", textTransform: "uppercase", color: "var(--meco-blue)", background: "var(--bg-row-alt)", position: "sticky", top: 0, zIndex: 12, boxSizing: "border-box" }}>
                                        {group.month}
                                    </div>
                                );
                            });
                        })()}

                        {timeline.days.map((day, dIdx) => {
                            const dateObj = new Date(`${day}T00:00:00`);
                            return (
                                <div className="timeline-day" key={day} style={{ gridRow: "2", gridColumn: dIdx + 3, textAlign: "center", fontSize: "9px", padding: "6px 0", borderRight: "1px solid var(--border-base)", borderBottom: "2px solid var(--border-base)", color: "var(--text-copy)", textTransform: "uppercase", display: "flex", flexDirection: "column", justifyContent: "center", lineHeight: "1.1", minWidth: 0, overflow: "hidden", boxSizing: "border-box", position: "sticky", top: "27px", zIndex: 12, background: "var(--bg-panel)" }}>
                                    <span style={{ whiteSpace: "nowrap", fontSize: "8px" }}>{dateObj.toLocaleDateString(undefined, { weekday: "short" })}</span>
                                    <strong style={{ fontSize: "11px", color: "var(--text-title)" }}>{dateObj.toLocaleDateString(undefined, { day: "numeric" })}</strong>
                                </div>
                            );
                        })}
                    </div>

                    {timeline.subsystemRows.map((subsystem, sIdx) => {
                        const collapsed = collapsedSubsystems[subsystem.id] ?? false;
                        const taskCount = Math.max(1, subsystem.tasks.length);
                        const groupBg = sIdx % 2 === 0 ? "var(--bg-panel)" : "var(--bg-row-alt)";

                        return (
                            <div className="subsystem-group" key={subsystem.id} style={{ display: "grid", width: "100%", minWidth: `${gridMinWidth}px`, gridTemplateColumns: timelineGridTemplate, background: groupBg, borderBottom: "1px solid var(--border-base)" }}>
                                <div
                                    style={{
                                        gridRow: collapsed ? "1" : `1 / span ${taskCount}`,
                                        gridColumn: collapsed ? "1 / span 2" : "1",
                                        position: "sticky",
                                        left: 0,
                                        zIndex: 8,
                                        background: groupBg,
                                        borderRight: "1px solid var(--border-base)",
                                        display: "flex",
                                        flexDirection: "row",
                                        justifyContent: "flex-start",
                                        alignItems: collapsed ? "center" : "flex-start",
                                        minHeight: "44px",
                                        padding: collapsed ? "0 12px" : "10px 10px",
                                        overflow: "hidden",
                                        boxSizing: "border-box",
                                    }}
                                >
                                    <button
                                        className="subsystem-toggle"
                                        onClick={() => toggleSubsystem(subsystem.id)}
                                        type="button"
                                        style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", fontSize: "12px", color: "var(--text-copy)", marginRight: "6px", flexShrink: 0 }}
                                    >
                                        {collapsed ? "\u25B6" : "\u25BC"}
                                    </button>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontWeight: "bold", fontSize: "0.85rem", color: "var(--text-title)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{subsystem.name}</div>
                                        <div style={{ fontSize: "0.65rem", fontWeight: "normal", color: "var(--text-copy)" }}>{subsystem.completeCount}/{subsystem.taskCount}</div>
                                    </div>
                                </div>

                                {!collapsed ? (
                                    <div
                                        style={{
                                            gridRow: `1 / span ${taskCount}`,
                                            gridColumn: "2",
                                            position: "sticky",
                                            left: `${SUBSYSTEM_COLUMN_WIDTH}px`,
                                            zIndex: 7,
                                            background: groupBg,
                                            borderRight: "1px solid var(--border-base)",
                                            boxSizing: "border-box",
                                        }}
                                    />
                                ) : null}

                                {collapsed
                                    ? timeline.days.map((day, dIdx) => (
                                        <div key={day} style={{ gridRow: "1", gridColumn: dIdx + 3, borderRight: "1px solid var(--border-base)", minHeight: "44px" }} />
                                    ))
                                    : null}

                                {collapsed && subsystem.tasks.map((task) => (
                                    <button
                                        key={task.id}
                                        className={`timeline-bar timeline-${task.status} editable-hover-target`}
                                        onClick={() => openEditTaskModal(task)}
                                        style={{
                                            gridRow: "1",
                                            gridColumn: `${task.offset + 3} / span ${task.span}`,
                                            height: "8px",
                                            margin: "0 2px",
                                            zIndex: 5,
                                            borderRadius: "2px",
                                            border: "none",
                                            cursor: "pointer",
                                            alignSelf: "center",
                                            minWidth: 0,
                                            padding: 0,
                                            opacity: 0.7,
                                        }}
                                        title={`${task.title} (${task.status})`}
                                        type="button"
                                    >
                                        <EditableHoverIndicator className="editable-hover-indicator-compact" />
                                    </button>
                                ))}

                                {!collapsed && subsystem.tasks.map((task, tIdx) => (
                                    <React.Fragment key={task.id}>
                                        <button
                                            className="task-label"
                                            onClick={() => openEditTaskModal(task)}
                                            style={{
                                                gridRow: tIdx + 1,
                                                gridColumn: "2",
                                                minHeight: "44px",
                                                padding: "0 12px",
                                                fontSize: "0.8rem",
                                                border: "none",
                                                borderRight: "1px solid var(--border-base)",
                                                boxSizing: "border-box",
                                                display: "flex",
                                                flexDirection: "column",
                                                justifyContent: "center",
                                                alignItems: "flex-start",
                                                position: "sticky",
                                                left: `${SUBSYSTEM_COLUMN_WIDTH}px`,
                                                zIndex: 7,
                                                background: groupBg,
                                                overflow: "hidden",
                                                borderTop: tIdx === 0 ? "none" : "1px solid var(--border-base)",
                                                borderRadius: 0,
                                                textAlign: "left",
                                                cursor: "pointer",
                                            }}
                                            type="button"
                                        >
                                            <strong style={{ display: "block", color: "var(--text-title)", lineHeight: "1.2" }}>{task.title}</strong>
                                            <span style={{ fontSize: "0.7rem", color: "var(--text-copy)" }}>{(task.ownerId ? membersById[task.ownerId]?.name : null) ?? "Unassigned"}</span>
                                        </button>
                                        {timeline.days.map((day, dIdx) => (
                                            <div key={day} style={{ gridRow: tIdx + 1, gridColumn: dIdx + 3, borderRight: "1px solid var(--border-base)", borderTop: tIdx === 0 ? "none" : "1px solid var(--border-base)", minHeight: "44px" }} />
                                        ))}
                                        <button
                                            className={`timeline-bar timeline-${task.status} editable-hover-target`}
                                            onClick={() => openEditTaskModal(task)}
                                            style={{
                                                gridRow: tIdx + 1,
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
                                                alignSelf: "center",
                                                minWidth: 0,
                                            }}
                                            title={`Edit ${task.title}`}
                                            type="button"
                                        >
                                            {task.title}
                                            <EditableHoverIndicator className="editable-hover-indicator-compact" />
                                        </button>
                                    </React.Fragment>
                                ))}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="section-copy">Create a task to populate the subsystem timeline.</p>
            )}
        </section>
    );
};
