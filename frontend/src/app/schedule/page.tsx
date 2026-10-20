import { cookies } from "next/headers";
import { LoginPrompt } from "@/components/auth/login-button";
import { ScheduleClient } from "./schedule-client";
import { listTrainingRecords } from "@/lib/api/training-records";
import { getCurrentUser } from "@/lib/api/session";

export default async function SchedulePage() {
  const cookieHeader = (await cookies()).toString();
  if (!(await getCurrentUser(cookieHeader))) return <LoginPrompt />;
  const records = await listTrainingRecords(cookieHeader);
  return <ScheduleClient initialTrainingRecords={records ?? []} />;
}
