import { cookies } from "next/headers";
import { LoginPrompt } from "@/components/auth/login-button";
import { ProfileEditForm } from "./components/profile-edit-form";
import { getProfile } from "@/lib/api/profile";
import { getCurrentUser } from "@/lib/api/session";

export default async function Page() {
  const cookieHeader = (await cookies()).toString();
  if (!(await getCurrentUser(cookieHeader))) return <LoginPrompt />;
  const profile = await getProfile(cookieHeader);
  return <ProfileEditForm initialProfile={profile} />;
}
