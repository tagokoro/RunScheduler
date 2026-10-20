import { apiFetch, getCsrfToken } from "./client";
import type { CurrentUser } from "@/types/session";

type MeResponse = {
  user: CurrentUser;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const response = await apiFetch("/me", {
    credentials: "include",
  });

  if (!response.ok) {
    return null;
  }

  const data: MeResponse = await response.json();
  return data.user;
}

export async function logout(): Promise<boolean> {
  const response = await apiFetch("/logout", {
    method: "DELETE",
    credentials: "include",
  });

  return response.ok;
}

export async function loginWithGoogle(): Promise<void> {
  const token = await getCsrfToken();
  const form = document.createElement("form");
  form.method = "POST";
  form.action = `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/google_oauth2`;
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "authenticity_token";
  input.value = token;
  form.append(input);
  document.body.append(form);
  form.submit();
}
