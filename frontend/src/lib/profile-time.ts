import type { TargetRaceType } from "../types/profile";
export const RACE_LABELS: Record<TargetRaceType, string> = {
  "5k": "5km",
  half: "ハーフマラソン",
  full: "フルマラソン",
};
export function formatDuration(seconds: number | null) {
  if (seconds === null) return "未登録";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = seconds % 60;
  return `${hours > 0 ? `${hours}時間` : ""}${minutes}分${remaining > 0 ? `${remaining}秒` : ""}`;
}
export function durationInput(seconds: number | null | undefined) {
  if (seconds == null) return "";
  return `${Math.floor(seconds / 3600)}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
export function durationSeconds(value: string): number | null {
  const match = /^(\d{1,2}):([0-5]\d):([0-5]\d)$/.exec(value);
  if (!match) return null;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
}
