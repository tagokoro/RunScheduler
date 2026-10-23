export const WEEKDAYS = [
  { id: "monday", label: "月曜日" },
  { id: "tuesday", label: "火曜日" },
  { id: "wednesday", label: "水曜日" },
  { id: "thursday", label: "木曜日" },
  { id: "friday", label: "金曜日" },
  { id: "saturday", label: "土曜日" },
  { id: "sunday", label: "日曜日" },
] as const;

export type Weekday = (typeof WEEKDAYS)[number]["id"];

export type TrainingRecordStatsGroupBy = "day" | "week" | "month";

export type TrainingRecordStat = {
  period: string;
  total_distance_km: number;
  total_duration_minutes: number;
  training_count: number;
};

export type TrainingRecordStatsResponse = {
  group_by: TrainingRecordStatsGroupBy;
  stats: TrainingRecordStat[];
};

export type UpdateTrainingRecordRequest = {
  completed?: boolean;
  actual_distance_km?: number | null;
  actual_duration_minutes?: number | null;
  feedback?: string;
};

export type TrainingRecord = {
  id: string;
  date: string;
  training_type: string;
  description: string;
  distance_km: number | null;
  duration_minutes: number | null;
  actual_distance_km: number | null;
  actual_duration_minutes: number | null;
  pace: string | null;
  completed: boolean;
  feedback: string | null;
  notes: string | null;
};
