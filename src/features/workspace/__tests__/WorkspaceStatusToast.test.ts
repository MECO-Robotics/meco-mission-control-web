/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  WorkspaceErrorPopup,
  WorkspaceInfoToast,
  WorkspaceToast,
  WorkspaceToastStack,
} from "../WorkspaceStatusToast";
import { createPausableTimeout } from "../taskEditNoticeTimer";

describe("WorkspaceInfoToast", () => {
  it("renders the updated cancel notice title", () => {
    const markup = renderToStaticMarkup(
      React.createElement(WorkspaceInfoToast, {
        message: "Unsaved changes were discarded.",
        onDismiss: () => {},
      }),
    );

    expect(markup).toContain("Edit Canceled");
    expect(markup).toContain('data-toast-tone="info"');
  });
});

describe("WorkspaceErrorPopup", () => {
  it("renders the generic error title", () => {
    const markup = renderToStaticMarkup(
      React.createElement(WorkspaceErrorPopup, {
        message: "The workspace hit an unexpected error.",
        onDismiss: () => {},
      }),
    );

    expect(markup).toContain("Error");
    expect(markup).toContain('data-toast-tone="error"');
  });
});

describe("WorkspaceToast", () => {
  it("renders tone specific chrome", () => {
    const markup = renderToStaticMarkup(
      React.createElement(WorkspaceToast, {
        message: "Queued for review.",
        onDismiss: () => {},
        title: "Success",
        tone: "success",
      }),
    );

    expect(markup).toContain('data-toast-tone="success"');
    expect(markup).toContain("Success");
  });
});

describe("WorkspaceToastStack", () => {
  it("renders notification history through the original toast stack", () => {
    const markup = renderToStaticMarkup(
      React.createElement(WorkspaceToastStack, {
        items: [],
        historyItems: [
          {
            id: "toast-history-1",
            message: "Drivetrain wiring task updated",
            onDismiss: () => {},
            title: "Task saved",
            tone: "success",
          },
        ],
        isHistoryOpen: true,
      }),
    );

    expect(markup).toContain("workspace-toast-layer");
    expect(markup).toContain("workspace-toast-stack");
    expect(markup).toContain("Drivetrain wiring task updated");
    expect(markup).toContain('data-toast-auto-dismiss="false"');
    expect(markup).not.toContain("sidebar-notification");
  });

  it("keeps live notification events auto-dismissed by default", () => {
    const markup = renderToStaticMarkup(
      React.createElement(WorkspaceToastStack, {
        items: [
          {
            id: "toast-active-1",
            message: "Milestone saved",
            onDismiss: () => {},
            title: "Edit Saved",
            tone: "success",
          },
        ],
      }),
    );

    expect(markup).toContain("Milestone saved");
    expect(markup).toContain('data-toast-auto-dismiss="true"');
  });

  it("shows an empty queue card through the toast stack", () => {
    const markup = renderToStaticMarkup(
      React.createElement(WorkspaceToastStack, {
        items: [],
        historyItems: [],
        isHistoryOpen: true,
      }),
    );

    expect(markup).toContain("Notification queue");
    expect(markup).toContain("No queued notifications.");
    expect(markup).toContain('data-toast-auto-dismiss="false"');
    expect(markup).not.toContain('aria-label="Dismiss toast"');
  });
});

describe("createPausableTimeout", () => {
  let currentTime = 0;

  beforeEach(() => {
    jest.useFakeTimers();
    currentTime = 0;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("pauses and resumes the dismiss timer", () => {
    const onElapsed = jest.fn();
    const clock = {
      now: () => currentTime,
      setTimeout: globalThis.setTimeout,
      clearTimeout: globalThis.clearTimeout,
    };
    const timer = createPausableTimeout(onElapsed, 4500, clock);
    const advance = (milliseconds: number) => {
      currentTime += milliseconds;
      jest.advanceTimersByTime(milliseconds);
    };

    advance(1500);
    timer.pause();
    advance(4000);
    expect(onElapsed).not.toHaveBeenCalled();

    timer.resume();
    advance(2999);
    expect(onElapsed).not.toHaveBeenCalled();

    advance(1);
    expect(onElapsed).toHaveBeenCalledTimes(1);
  });

  it("cancels the dismiss timer", () => {
    const onElapsed = jest.fn();
    const clock = {
      now: () => currentTime,
      setTimeout: globalThis.setTimeout,
      clearTimeout: globalThis.clearTimeout,
    };
    const timer = createPausableTimeout(onElapsed, 4500, clock);

    timer.cancel();
    currentTime += 4500;
    jest.advanceTimersByTime(4500);

    expect(onElapsed).not.toHaveBeenCalled();
  });
});
