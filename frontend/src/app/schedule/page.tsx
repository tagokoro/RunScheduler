import { cookies } from "next/headers";

import { ScheduleClient } from "@/app/schedule/schedule-client";
import { listTrainingRecords } from "@/lib/api/training-records";

export default async function SchedulePage() {
  let trainingRecords = null;

  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    trainingRecords = await listTrainingRecords(cookieHeader);
  } catch {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 p-6">
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
          トレーニング記録を取得できませんでした。
        </div>
      </main>
    );
  }

  return <ScheduleClient initialTrainingRecords={trainingRecords ?? []} />;
}
