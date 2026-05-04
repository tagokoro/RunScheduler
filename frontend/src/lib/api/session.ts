import { apiFetch } from "./client";
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

export function getGoogleLoginUrl(): string {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  return `${apiBaseUrl}/auth/google_oauth2`;
}
