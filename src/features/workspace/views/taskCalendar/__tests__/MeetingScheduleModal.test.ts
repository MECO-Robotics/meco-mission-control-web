/// <reference types="jest" />

import type { BootstrapPayload } from "@/types/bootstrap";
import type { MeetingPayload } from "@/types/payloads";
import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { MeetingScheduleModal } from "@/features/workspace/views/taskCalendar/MeetingScheduleModal";

function childrenOf(node: unknown): unknown[] {
  const children = (node as { props?: { children?: unknown } } | null)?.props?.children;
  if (children === undefined || children === null) {
    return [];
  }

  return Array.isArray(children) ? children : [children];
}

function nodeText(node: unknown): string {
  if (typeof node === "string") {
    return node;
  }

  return childrenOf(node).map(nodeText).join("");
}

function findLabel(node: unknown, label: string): unknown {
  if ((node as { type?: unknown } | null)?.type === "label") {
    const hasLabelText = childrenOf(node).some((child) => nodeText(child) === label);
    if (hasLabelText) {
      return node;
    }
  }

  for (const child of childrenOf(node)) {
    const match = findLabel(child, label);
    if (match) {
      return match;
    }
  }

  return null;
}

function findInputByLabel(node: unknown, label: string) {
  const labelNode = findLabel(node, label);
  const input = childrenOf(labelNode).find((child) => (child as { type?: unknown } | null)?.type === "input");
  if (!input) {
    throw new Error(`Input not found for label ${label}`);
  }

  return input as { props: { onChange: (event: { target: { value: string } }) => void } };
}

const draft: MeetingPayload = {
  description: "",
  endDateTime: null,
  location: "",
  meetingType: "general",
  projectIds: [],
  seasonId: "season-1",
  startDateTime: "2026-05-07T18:00",
  title: "Build night",
};

describe("MeetingScheduleModal", () => {
  it("preserves an end-date-only meeting when end time is blank", () => {
    const setDraft = jest.fn();
    const element = MeetingScheduleModal({
      bootstrap: EMPTY_BOOTSTRAP as BootstrapPayload,
      draft,
      error: null,
      isOpen: true,
      isSaving: false,
      onClose: jest.fn(),
      onSubmit: jest.fn(),
      setDraft,
    });

    findInputByLabel(element, "End date").props.onChange({
      target: { value: "2026-05-09" },
    });

    const updater = setDraft.mock.calls[0][0] as (current: MeetingPayload) => MeetingPayload;

    expect(updater(draft).endDateTime).toBe("2026-05-09");
  });
});
