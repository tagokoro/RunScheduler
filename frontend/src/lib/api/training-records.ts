import { apiFetch } from "./client";
import type {
  CreateTrainingRecordsRequest,
  TrainingRecord,
  UpdateTrainingRecordRequest,
} from "@/types/training-records";

type TrainingRecordsResponse = {
  training_records: TrainingRecord[];
};

type TrainingRecordResponse = {
  training_record: TrainingRecord;
};

export type CreateTrainingRecordsResult = {
  error: string | null;
  trainingRecords: TrainingRecord[] | null;
};

export type UpdateTrainingRecordResult = {
  error: string | null;
  trainingRecord: TrainingRecord | null;
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

export async function updateTrainingRecord(
  trainingRecordId: string,
  payload: UpdateTrainingRecordRequest,
): Promise<UpdateTrainingRecordResult> {
  const response = await apiFetch(`/training_records/${trainingRecordId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    credentials: "include",
  });

  if (!response.ok) {
    return {
      error: "トレーニング記録の更新に失敗しました。",
      trainingRecord: null,
    };
  }

  const data: TrainingRecordResponse = await response.json();

  return {
    error: null,
    trainingRecord: data.training_record,
  };
}
