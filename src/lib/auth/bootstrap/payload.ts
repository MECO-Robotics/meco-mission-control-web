import type { BootstrapPayload } from "@/types/bootstrap";

type ScheduleRecord = {
  startAt?: string;
  endAt?: string | null;
  startDateTime?: string;
  endDateTime?: string | null;
};

function normalizeScheduleTimes<T extends ScheduleRecord>(record: T) {
  return {
    ...record,
    startAt: record.startAt ?? record.startDateTime ?? "",
    endAt: record.endAt !== undefined ? record.endAt : record.endDateTime ?? null,
  };
}

export function normalizeBootstrapPayload(payload: BootstrapPayload): BootstrapPayload {
  return {
    ...payload,
    meetings: payload.meetings.map(normalizeScheduleTimes),
    events: payload.events.map(normalizeScheduleTimes),
    milestones: payload.milestones.map(normalizeScheduleTimes),
  };
}
