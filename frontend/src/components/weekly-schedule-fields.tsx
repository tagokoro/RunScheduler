"use client";
import { useState } from "react";
import { WEEKDAYS } from "@/types/training-records";
import type { Weekday } from "@/types/training-records";
import type { WeeklyAvailability } from "@/types/weekly-plan";

const PRESETS = [0, 30, 45, 60, 90];
export function WeeklyScheduleFields({
  value,
  onChange,
}: {
  value: WeeklyAvailability;
  onChange: (value: WeeklyAvailability) => void;
}) {
  const [customDays, setCustomDays] = useState<Weekday[]>([]);
  return (
    <fieldset className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
      <legend className="px-2 text-lg font-semibold">
        普段の練習スケジュール
      </legend>
      <p className="text-sm text-neutral-600">
        曜日ごとに確保できる時間の上限を設定します。すべて使い切る必要はありません。未設定と休みは別です。
      </p>
      {WEEKDAYS.map((day) => {
        const minutes = value[day.id];
        const custom =
          customDays.includes(day.id) ||
          (minutes != null && !PRESETS.includes(minutes));
        return (
          <div
            key={day.id}
            className="grid grid-cols-[5rem_1fr] items-center gap-3"
          >
            <label htmlFor={`weekly-${day.id}`} className="font-medium">
              {day.label}
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <select
                id={`weekly-${day.id}`}
                className="min-h-11 rounded-xl border border-slate-200 bg-white px-3"
                value={
                  custom ? "custom" : minutes == null ? "" : String(minutes)
                }
                onChange={(e) => {
                  const selected = e.target.value;
                  setCustomDays((current) =>
                    selected === "custom"
                      ? [...current, day.id]
                      : current.filter((id) => id !== day.id),
                  );
                  onChange({
                    ...value,
                    [day.id]:
                      selected === "custom" || selected === ""
                        ? null
                        : Number(selected),
                  });
                }}
              >
                <option value="">未設定</option>
                <option value="0">休み</option>
                {[30, 45, 60, 90].map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes}分
                  </option>
                ))}
                <option value="custom">その他</option>
              </select>
              {custom && (
                <>
                  <input
                    aria-label={`${day.label}の利用可能時間（分）`}
                    type="number"
                    min={1}
                    max={1440}
                    step={1}
                    className="min-h-11 w-24 rounded-xl border border-slate-200 bg-white px-3"
                    value={minutes ?? ""}
                    onChange={(e) =>
                      onChange({
                        ...value,
                        [day.id]:
                          e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                  <span>分</span>
                </>
              )}
            </div>
          </div>
        );
      })}
    </fieldset>
  );
}
