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

export type CreateTrainingRecordsRequest = {
  days: number;
  training_days: Weekday[];
  request_message?: string;
};

export type TrainingRecord = {
  id: string;
  date: string;
  training_type: string;
  description: string;
  distance_km: number | null;
  duration_minutes: number | null;
  pace: string | null;
  completed: boolean;
  feedback: string | null;
  notes: string | null;
};

export type TrainingRecordsResponse = {
  training_records: TrainingRecord[];
};
