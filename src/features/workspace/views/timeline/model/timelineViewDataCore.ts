import { dateDiffInDays } from "@/lib/appUtils/common";
import { formatLocalDate } from "@/lib/dateUtils";

export function buildTimelineDays(startDate: string, endDate: string) {
  const totalDays = dateDiffInDays(startDate, endDate) + 1;
  const days: string[] = [];
  const dayCursor = new Date(`${startDate}T12:00:00`);

  for (let index = 0; index < totalDays; index += 1) {
    days.push(formatLocalDate(dayCursor));
    dayCursor.setDate(dayCursor.getDate() + 1);
  }

  return days;
}
