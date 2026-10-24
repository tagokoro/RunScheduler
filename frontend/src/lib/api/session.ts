import { apiFetch, apiUrl, getCsrfToken } from "./client";
import type { CurrentUser } from "@/types/session";

type MeResponse = {
  user: CurrentUser;
};

export async function getCurrentUser(
  cookieHeader?: string,
): Promise<CurrentUser | null> {
  const response = await apiFetch("/me", { cookieHeader });

  if (response.status === 401) return null;
  if (!response.ok) throw new Error("ログイン状態を確認できませんでした。");

  const data: MeResponse = await response.json();
  return data.user;
}

export async function logout(): Promise<boolean> {
  const response = await apiFetch("/logout", {
    method: "DELETE",
  });

  return response.ok;
}

export async function loginWithGoogle(): Promise<void> {
  const token = await getCsrfToken();
  const form = document.createElement("form");
  form.method = "POST";
  form.action = apiUrl("/auth/google_oauth2");
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "authenticity_token";
  input.value = token;
  form.append(input);
  document.body.append(form);
  form.submit();
}
