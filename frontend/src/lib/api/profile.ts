import type { Profile, UpdateProfilePayload } from "@/types/profile";
import { apiFetch, apiErrorMessage } from "./client";

type UpdateProfileResult = {
  error: string | null;
};

export async function getProfile(
  cookieHeader?: string,
): Promise<Profile | null> {
  const response = await apiFetch("/me/profile", {
    cookieHeader,
  });

  if (response.status === 404) return null;
  if (!response.ok)
    throw new Error(
      await apiErrorMessage(response, "プロフィールを取得できませんでした。"),
    );

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
    return {
      error: await apiErrorMessage(
        response,
        "入力内容を確認して、もう一度保存してください。",
      ),
    };
  } catch {
    return { error: "プロフィールの更新に失敗しました。" };
  }

  return { error: "プロフィールの更新に失敗しました。" };
}
