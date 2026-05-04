import { apiFetch } from "./client";
import type {
  CreateTrainingRecordsRequest,
  TrainingRecord,
} from "@/types/training-records";

type TrainingRecordsResponse = {
  training_records: TrainingRecord[];
};

export type CreateTrainingRecordsResult = {
  error: string | null;
  trainingRecords: TrainingRecord[] | null;
};

export async function listTrainingRecords(): Promise<TrainingRecord[] | null> {
  const response = await apiFetch("/training_records", {
    credentials: "include",
  });

  if (!response.ok) {
    return null;
  }

  const data: TrainingRecordsResponse = await response.json();
  return data.training_records;
}

export async function createTrainingRecords(
  payload: CreateTrainingRecordsRequest,
): Promise<CreateTrainingRecordsResult> {
  const response = await apiFetch("/training_records", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    credentials: "include",
  });

  if (!response.ok) {
    return {
      error: "トレーニング予定の生成に失敗しました。",
      trainingRecords: null,
    };
  }

  const data: TrainingRecordsResponse = await response.json();

  return {
    error: null,
    trainingRecords: data.training_records,
  };
}
