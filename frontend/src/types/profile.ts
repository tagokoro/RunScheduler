export type TargetRaceType = "5k" | "half" | "full";

export type Profile = {
  age: number;
  weight: number;
  best_5k_seconds: number | null;
  best_half_seconds: number | null;
  best_full_seconds: number | null;
  target_race_type: TargetRaceType;
  target_time_seconds: number;
  race_date: string;
};

export type UpdateProfilePayload = {
  age: string;
  weight: string;
  best_5k_seconds: string;
  best_half_seconds: string;
  best_full_seconds: string;
  target_race_type: TargetRaceType;
  target_time_seconds: string;
  race_date: string;
};
