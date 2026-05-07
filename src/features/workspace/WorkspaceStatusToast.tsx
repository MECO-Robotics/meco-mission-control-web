import { createElement, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { createPausableTimeout, type PausableTimeoutController } from "./taskEditNoticeTimer";
import "./WorkspaceStatusToast.css";

const TASK_EDIT_NOTICE_TIMEOUT_MS = 4500;

export type WorkspaceToastTone = "success" | "warning" | "error" | "info" | "neutral";

interface WorkspaceToastProps {
  id?: string;
  message: string;
  onDismiss: () => void;
  title: string;
  tone: WorkspaceToastTone;
}

interface WorkspaceToastStackProps {
  items: WorkspaceToastStackItem[];
}

export interface WorkspaceToastStackItem extends WorkspaceToastProps {
  id: string;
}

function createToastIcon(tone: WorkspaceToastTone) {
  switch (tone) {
    case "success":
      return createElement(
        "svg",
        { viewBox: "0 0 20 20", "aria-hidden": "true" },
        createElement("path", { d: "M8.4 12.6 5.8 10l-1.3 1.3 3.9 3.9 7.2-7.2-1.3-1.3-5.9 5.9Z", fill: "currentColor" }),
      );
    case "warning":
      return createElement(
        "svg",
        { viewBox: "0 0 20 20", "aria-hidden": "true" },
        createElement("path", { d: "M10 4.1c.55 0 1 .45 1 1v5.2c0 .55-.45 1-1 1s-1-.45-1-1V5.1c0-.55.45-1 1-1Z", fill: "currentColor" }),
        createElement("circle", { cx: "10", cy: "14.2", r: "1.1", fill: "currentColor" }),
      );
    case "error":
      return createElement(
        "svg",
        { viewBox: "0 0 20 20", "aria-hidden": "true" },
        createElement("path", {
          d: "M6.1 6.1 13.9 13.9M13.9 6.1 6.1 13.9",
          fill: "none",
          stroke: "currentColor",
          strokeLinecap: "round",
          strokeWidth: "2.2",
        }),
      );
    case "info":
      return createElement(
        "svg",
        { viewBox: "0 0 20 20", "aria-hidden": "true" },
          createElement(
            "text",
            {
              x: "10",
              y: "14.6",
              fill: "currentColor",
              textAnchor: "middle",
              fontSize: "15.25",
              fontWeight: "700",
              fontStyle: "italic",
              fontFamily: "var(--font-ui)",
            },
            "i",
        ),
      );
    case "neutral":
      return null;
    default:
      return null;
  }
}

function createDismissIcon() {
  return createElement(
    "svg",
    { viewBox: "0 0 16 16", "aria-hidden": "true" },
    createElement("path", {
      d: "m3.6 3.6 8.8 8.8M12.4 3.6 3.6 12.4",
      fill: "none",
      stroke: "currentColor",
      strokeLinecap: "round",
      strokeWidth: "1.6",
    }),
  );
}

function WorkspaceToastCard({ message, onDismiss, title, tone }: WorkspaceToastProps) {
  const dismissTimerRef = useRef<PausableTimeoutController | null>(null);
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    const timer = createPausableTimeout(() => onDismissRef.current(), TASK_EDIT_NOTICE_TIMEOUT_MS);
    dismissTimerRef.current = timer;

    return () => {
      timer.cancel();
      if (dismissTimerRef.current === timer) {
        dismissTimerRef.current = null;
      }
    };
  }, [message]);

  const pauseDismissTimer = () => {
    dismissTimerRef.current?.pause();
  };

  const resumeDismissTimer = () => {
    dismissTimerRef.current?.resume();
  };

  const icon = createToastIcon(tone);
  const hasIcon = icon !== null;

  return createElement(
    "section",
    {
      className: `workspace-toast-card${hasIcon ? "" : " workspace-toast-card--iconless"}`,
      "data-toast-tone": tone,
      onMouseEnter: pauseDismissTimer,
      onMouseLeave: resumeDismissTimer,
    },
    createElement("div", { className: "workspace-toast-accent-bar", "aria-hidden": "true" }),
      createElement("div", { className: "workspace-toast-accent-foot", "aria-hidden": "true" }),
      hasIcon
        ? createElement(
            "div",
            { className: "workspace-toast-icon", "aria-hidden": "true" },
            icon,
          )
        : null,
      createElement(
        "div",
        { className: "workspace-toast-copy" },
        createElement("h2", { className: "workspace-toast-title" }, title),
        createElement("p", { className: "workspace-toast-message" }, message),
      ),
      createElement(
        "button",
        {
          className: "workspace-toast-dismiss",
          onClick: () => onDismissRef.current(),
          type: "button",
          "aria-label": "Dismiss toast",
        },
        createDismissIcon(),
      ),
  );
}

export function WorkspaceToast(props: WorkspaceToastProps) {
  return createElement(WorkspaceToastCard, props);
}

export function WorkspaceToastStack({ items }: WorkspaceToastStackProps) {
  const portalTarget = typeof document !== "undefined" ? document.body : null;
  const stack = createElement(
    "aside",
    { className: "workspace-toast-layer", "aria-live": "polite", role: "status" },
    createElement(
      "div",
      { className: "workspace-toast-stack" },
      items.map((item) => createElement(WorkspaceToastCard, { ...item, key: item.id })),
    ),
  );

  return portalTarget ? createPortal(stack, portalTarget) : stack;
}

export function WorkspaceInfoToast({
  message,
  title = "Edit Canceled",
  onDismiss,
}: {
  message: string;
  title?: string;
  onDismiss: () => void;
}) {
  return createElement(WorkspaceToast, { message, onDismiss, title, tone: "info" });
}

export function WorkspaceErrorPopup({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return createElement(WorkspaceToast, { message, onDismiss, title: "Error", tone: "error" });
}
