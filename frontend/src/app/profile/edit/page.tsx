import { cookies } from "next/headers";
import { ProfileEditForm } from "./components/profile-edit-form";
import { getProfile } from "@/lib/api/profile";

export default async function Page() {
  const cookieHeader = (await cookies()).toString();
  const profile = await getProfile(cookieHeader);

  return <ProfileEditForm initialProfile={profile} />;
}
