import type { TrainingRecord, Weekday } from "./training-records";

export type WeeklyAvailability = Partial<Record<Weekday, number | null>>;
export type ProposedRecord = Pick<
  TrainingRecord,
  | "date"
  | "training_type"
  | "description"
  | "distance_km"
  | "duration_minutes"
  | "pace"
  | "notes"
>;
export type WeeklyPlanProposal = {
  proposal_token: string;
  start_date: string;
  end_date: string;
  expires_at: string;
  recent_activity_count: number;
  days: {
    date: string;
    available_minutes: number;
    action: "retain" | "replace" | "create";
    record: ProposedRecord;
  }[];
};
