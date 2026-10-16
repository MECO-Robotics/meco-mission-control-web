import type { BootstrapPayload } from "@/types/bootstrap";

type ScheduleRecord = {
  startAt?: string;
  endAt?: string | null;
};

function normalizeScheduleTimes<T extends ScheduleRecord>(record: T) {
  return {
    ...record,
    startAt: record.startAt ?? "",
    endAt: record.endAt ?? null,
  };
}

export function normalizeBootstrapPayload(payload: BootstrapPayload): BootstrapPayload {
  return {
    ...payload,
    actions: payload.actions ?? [],
    artifacts: payload.artifacts.map((artifact) => {
      return { ...artifact, uri: artifact.uri ?? "" };
    }),
    meetings: payload.meetings.map(normalizeScheduleTimes),
    events: payload.events.map(normalizeScheduleTimes),
    milestones: payload.milestones.map(normalizeScheduleTimes),
  };
}
