import { cookies } from "next/headers";

import { StatisticsClient } from "@/app/statistics/statistics-client";
import { listTrainingRecordStats } from "@/lib/api/training-records";

export default async function StatisticsPage() {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    const result = await listTrainingRecordStats("month", cookieHeader);

    if (result.error || !result.statsResponse) {
      throw new Error(result.error ?? "統計情報の取得に失敗しました。");
    }

    return <StatisticsClient initialStatsResponse={result.statsResponse} />;
  } catch {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 p-6">
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
          統計情報を取得できませんでした。
        </div>
      </main>
    );
  }
}
