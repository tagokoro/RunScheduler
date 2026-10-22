import { apiFetch, apiErrorMessage } from "./client";
import type {
  TrainingRecord,
  TrainingRecordStatsGroupBy,
  TrainingRecordStatsResponse,
  UpdateTrainingRecordRequest,
} from "@/types/training-records";

type TrainingRecordsResponse = {
  training_records: TrainingRecord[];
};

type TrainingRecordResponse = {
  training_record: TrainingRecord;
};

export type UpdateTrainingRecordResult = {
  error: string | null;
  trainingRecord: TrainingRecord | null;
};

export type DeleteTrainingRecordResult = {
  error: string | null;
};

export type ListTrainingRecordStatsResult = {
  error: string | null;
  statsResponse: TrainingRecordStatsResponse | null;
};
export async function listTrainingRecords(
  cookieHeader?: string,
): Promise<TrainingRecord[] | null> {
  const response = await apiFetch("/training_records", {
    cookieHeader,
  });

  if (!response.ok) {
    throw new Error(
      await apiErrorMessage(response, "練習予定を取得できませんでした。"),
    );
  }

  const data: TrainingRecordsResponse = await response.json();
  return data.training_records;
}

export async function listTrainingRecordStats(
  groupBy: TrainingRecordStatsGroupBy,
  cookieHeader?: string,
): Promise<ListTrainingRecordStatsResult> {
  const response = await apiFetch(
    `/training_records/stats?group_by=${groupBy}`,
    {
      cookieHeader,
    },
  );

  if (!response.ok) {
    return {
      error: await apiErrorMessage(response, "統計情報の取得に失敗しました。"),
      statsResponse: null,
    };
  }

  const data: TrainingRecordStatsResponse = await response.json();

  return {
    error: null,
    statsResponse: data,
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
  });

  if (!response.ok) {
    return {
      error: await apiErrorMessage(
        response,
        "実績を保存できませんでした。日付・距離・時間を確認してください。",
      ),
      trainingRecord: null,
    };
  }

  const data: TrainingRecordResponse = await response.json();

  return {
    error: null,
    trainingRecord: data.training_record,
  };
}

export async function deleteTrainingRecord(
  trainingRecordId: string,
): Promise<DeleteTrainingRecordResult> {
  const response = await apiFetch(`/training_records/${trainingRecordId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    return {
      error: "トレーニング記録の削除に失敗しました。",
    };
  }

  return {
    error: null,
  };
}
