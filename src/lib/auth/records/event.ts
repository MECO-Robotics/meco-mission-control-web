import type { MeetingPayload, MilestonePayload } from "@/types/payloads";
import type { MeetingRecord, MilestoneRecord } from "@/types/recordsExecution";
import { requestItem } from "./common";

export function createMilestoneRecord(payload: MilestonePayload, onUnauthorized?: () => void) {
  return requestItem<MilestoneRecord, MilestonePayload>("/milestones", "POST", payload, onUnauthorized);
}

export function updateMilestoneRecord(
  milestoneId: string,
  payload: Partial<MilestonePayload>,
  onUnauthorized?: () => void,
) {
  return requestItem<MilestoneRecord, Partial<MilestonePayload>>(
    `/milestones/${milestoneId}`,
    "PATCH",
    payload,
    onUnauthorized,
  );
}

export function deleteMilestoneRecord(milestoneId: string, onUnauthorized?: () => void) {
  return requestItem<MilestoneRecord, never>(`/milestones/${milestoneId}`, "DELETE", undefined, onUnauthorized);
}

export function createMeetingRecord(payload: MeetingPayload, onUnauthorized?: () => void) {
  return requestItem<MeetingRecord, MeetingPayload>("/meetings", "POST", payload, onUnauthorized);
}
