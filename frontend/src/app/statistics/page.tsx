import { cookies } from "next/headers";
import { LoginPrompt } from "@/components/auth/login-button";
import { StatisticsClient } from "./statistics-client";
import { listTrainingRecordStats } from "@/lib/api/training-records";
import { getCurrentUser } from "@/lib/api/session";

export default async function StatisticsPage() {
  const cookieHeader = (await cookies()).toString();
  if (!(await getCurrentUser(cookieHeader))) return <LoginPrompt />;
  const result = await listTrainingRecordStats("month", cookieHeader);
  if (!result.statsResponse)
    throw new Error(result.error ?? "統計を取得できませんでした。");
  return <StatisticsClient initialStatsResponse={result.statsResponse} />;
}
