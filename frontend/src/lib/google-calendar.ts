import type { TrainingRecord } from "@/types/training-records";
import { addDaysToDateString, formatCalendarDateString } from "@/lib/date";

const GOOGLE_CALENDAR_URL = "https://calendar.google.com/calendar/render";

const formatValue = (value: number | string | null) => {
  if (value === null) {
    return "-";
  }

  return String(value);
};

export const buildGoogleCalendarUrl = (record: TrainingRecord) => {
  const startDate = addDaysToDateString(record.date, 0);
  const endDate = addDaysToDateString(record.date, 1);
  const title = `トレーニング: ${record.training_type}`;
  const details = [
    record.description,
    "",
    `距離: ${formatValue(record.distance_km)}${record.distance_km === null ? "" : " km"}`,
    `時間: ${formatValue(record.duration_minutes)}${record.duration_minutes === null ? "" : " 分"}`,
    `ペース: ${formatValue(record.pace)}`,
    `メモ: ${formatValue(record.notes)}`,
  ].join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    details,
    dates: `${formatCalendarDateString(startDate)}/${formatCalendarDateString(endDate)}`,
  });

  return `${GOOGLE_CALENDAR_URL}?${params.toString()}`;
};
