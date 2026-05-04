import type {
  Profile,
  UpdateProfilePayload,
  UpdateProfileResponse,
} from "@/types/profile";
import { apiFetch } from "./client";

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
): Promise<UpdateProfileResponse> {
  const response = await apiFetch("/me/profile", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    credentials: "include",
  });

  if (!response.ok) {
    return { error: "プロフィールの更新に失敗しました。" };
  }

  return { error: null };
}
