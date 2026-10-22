import { cookies } from "next/headers";
import { LoginPrompt } from "@/components/auth/login-button";
import { getCurrentUser } from "@/lib/api/session";
import { getProfile } from "@/lib/api/profile";
import { listTrainingRecords } from "@/lib/api/training-records";
import { WEEKDAYS } from "@/types/training-records";
import { HomeClient } from "./home-client";

export default async function Home() {
  const cookieHeader = (await cookies()).toString();
  const user = await getCurrentUser(cookieHeader);
  if (!user) return <LoginPrompt />;
  const [profile, records] = await Promise.all([
    getProfile(cookieHeader),
    listTrainingRecords(cookieHeader),
  ]);
  return (
    <HomeClient
      initialRecords={records ?? []}
      hasProfile={profile !== null}
      scheduleConfigured={WEEKDAYS.every(
        (day) => profile?.weekly_availability?.[day.id] != null,
      )}
    />
  );
}
