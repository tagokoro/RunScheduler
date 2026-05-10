import type { TrainingRecord } from "@/types/training-records";

const GOOGLE_CALENDAR_URL = "https://calendar.google.com/calendar/render";

const formatAllDayDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
};

const addDays = (dateString: string, days: number) => {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  date.setDate(date.getDate() + days);

  return date;
};

const formatValue = (value: number | string | null) => {
  if (value === null) {
    return "-";
  }

  return String(value);
};

export const buildGoogleCalendarUrl = (record: TrainingRecord) => {
  const startDate = addDays(record.date, 0);
  const endDate = addDays(record.date, 1);
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
    dates: `${formatAllDayDate(startDate)}/${formatAllDayDate(endDate)}`,
  });

  return `${GOOGLE_CALENDAR_URL}?${params.toString()}`;
};
