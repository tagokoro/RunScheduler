import { apiFetch, apiErrorMessage } from "./client";
import type { WeeklyPlanProposal } from "@/types/weekly-plan";
import type { TrainingRecord } from "@/types/training-records";

export async function proposeWeeklyPlan(): Promise<WeeklyPlanProposal> {
  const response = await apiFetch("/weekly_plans/propose", {
    method: "POST",
  }).catch(() => {
    throw new Error(
      "通信に失敗しました。提案は保存されていません。もう一度お試しください。",
    );
  });
  if (!response.ok)
    throw new Error(
      await apiErrorMessage(
        response,
        "提案を取得できませんでした。もう一度お試しください。",
      ),
    );
  return response.json();
}
export async function saveWeeklyPlan(token: string): Promise<TrainingRecord[]> {
  const response = await apiFetch("/weekly_plans/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ proposal_token: token }),
  }).catch(() => {
    throw new Error(
      "保存結果を確認できませんでした。同じ提案でもう一度保存してください。再送しても二重適用されません。",
    );
  });
  if (!response.ok)
    throw new Error(
      await apiErrorMessage(
        response,
        "予定を保存できませんでした。再試行してください。",
      ),
    );
  const data: { training_records: TrainingRecord[] } = await response.json();
  return data.training_records;
}
