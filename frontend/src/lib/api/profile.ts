import type { Profile, UpdateProfilePayload } from "@/types/profile";
import { apiFetch } from "./client";

type UpdateProfileResult = {
  error: string | null;
};

export async function getProfile(
  cookieHeader?: string,
): Promise<Profile | null> {
  const response = await apiFetch("/me/profile", {
    cookieHeader,
  });

  if (!response.ok) {
    return null;
  }

  const data: Profile = await response.json();
  return data;
}

export async function updateProfile(
  payload: UpdateProfilePayload,
): Promise<UpdateProfileResult> {
  try {
    const response = await apiFetch("/me/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) return { error: null };
  } catch {
    return { error: "プロフィールの更新に失敗しました。" };
  }

  return { error: "プロフィールの更新に失敗しました。" };
}
