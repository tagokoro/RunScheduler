"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { WeeklyScheduleFields } from "@/components/weekly-schedule-fields";
import type { WeeklyAvailability } from "@/types/weekly-plan";
import { WEEKDAYS } from "@/types/training-records";
import { useEffect, useState } from "react";
import { type UseFormRegisterReturn, useForm } from "react-hook-form";

import { durationInput, durationSeconds } from "@/lib/profile-time";
import { trainingToday } from "@/lib/date";
import { useToast } from "@/components/ui/toaster";
import { updateProfile } from "@/lib/api/profile";
import type {
  Profile,
  TargetRaceType,
  UpdateProfilePayload,
} from "@/types/profile";

type ProfileFormValues = UpdateProfilePayload & {
  target_race_type: TargetRaceType;
};

const defaultValues: ProfileFormValues = {
  age: "",
  weight: "",
  best_5k_seconds: "",
  best_half_seconds: "",
  best_full_seconds: "",
  target_race_type: "full",
  target_time_seconds: "",
  race_date: "",
};

type Props = {
  initialProfile: Profile | null;
};
export function ProfileEditForm({ initialProfile }: Props) {
  const [schedule, setSchedule] = useState<WeeklyAvailability>(
    initialProfile?.weekly_availability ?? {},
  );
  const router = useRouter();
  const unsetDays = WEEKDAYS.filter((day) => schedule[day.id] == null);
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    defaultValues,
  });

  useEffect(() => {
    reset({
      age: initialProfile?.age?.toString() ?? "",
      weight: initialProfile?.weight?.toString() ?? "",
      best_5k_seconds: durationInput(initialProfile?.best_5k_seconds),
      best_half_seconds: durationInput(initialProfile?.best_half_seconds),
      best_full_seconds: durationInput(initialProfile?.best_full_seconds),
      target_race_type: initialProfile?.target_race_type ?? "full",
      target_time_seconds: durationInput(initialProfile?.target_time_seconds),
      race_date: initialProfile?.race_date ?? "",
    });
  }, [initialProfile, reset]);

  const onSubmit = handleSubmit(async (values) => {
    if (
      !Object.values(schedule).every(
        (minutes) =>
          minutes == null ||
          (Number.isInteger(minutes) && minutes >= 0 && minutes <= 1440),
      )
    ) {
      setError("root", {
        message: "練習時間は0〜1440分の整数で指定してください。",
      });
      return;
    }
    const payload = { ...values, weekly_availability: schedule };
    for (const key of [
      "best_5k_seconds",
      "best_half_seconds",
      "best_full_seconds",
      "target_time_seconds",
    ] as const) {
      payload[key] =
        values[key] === "" ? "" : String(durationSeconds(values[key]));
    }
    const result = await updateProfile(payload);

    if (!result.error) {
      showToast("プロフィールを保存しました。", "success");
      router.push(initialProfile ? "/profile" : "/");
      router.refresh();
      return;
    }

    setError("root", { message: result.error });
  });

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 space-y-2">
        <h1 className="text-2xl font-semibold">
          {initialProfile
            ? "目標・プロフィールの編集"
            : "目標・プロフィールの登録"}
        </h1>
        <p className="text-sm text-gray-600">
          大会と目標タイムを登録します。ベストタイムは任意です。未計測なら空欄のまま進められます。
        </p>
      </div>
      <form
        onSubmit={onSubmit}
        className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-7"
        noValidate
      >
        <fieldset disabled={isSubmitting} className="space-y-6">
          <FormField
            label="年齢"
            type="number"
            placeholder="30"
            registration={register("age", {
              required: "年齢を入力してください。",
              max: { value: 120, message: "120以下の年齢を入力してください。" },
              validate: (value) =>
                Number.isInteger(Number(value)) || "整数で入力してください。",
              min: {
                value: 0,
                message: "0以上の数値を入力してください。",
              },
            })}
            error={errors.age?.message}
          />

          <FormField
            label="体重(kg)"
            type="number"
            step="0.1"
            placeholder="60.0"
            registration={register("weight", {
              required: "体重を入力してください。",
              max: { value: 999.9, message: "1000kg未満で入力してください。" },
              min: {
                value: 0.1,
                message: "0より大きい数値を入力してください。",
              },
            })}
            error={errors.weight?.message}
          />

          <FormField
            label="5km ベスト（任意・時:分:秒）"
            type="text"
            placeholder="0:25:00"
            registration={register("best_5k_seconds", {
              validate: (value) =>
                value === "" ||
                (durationSeconds(value) ?? 0) > 0 ||
                "0:25:00の形式で、0より大きいタイムを入力してください。",
            })}
            error={errors.best_5k_seconds?.message}
          />

          <FormField
            label="ハーフ ベスト（任意・時:分:秒）"
            type="text"
            placeholder="2:00:00"
            registration={register("best_half_seconds", {
              validate: (value) =>
                value === "" ||
                (durationSeconds(value) ?? 0) > 0 ||
                "0:25:00の形式で、0より大きいタイムを入力してください。",
            })}
            error={errors.best_half_seconds?.message}
          />

          <FormField
            label="フル ベスト（任意・時:分:秒）"
            type="text"
            placeholder="4:00:00"
            registration={register("best_full_seconds", {
              validate: (value) =>
                value === "" ||
                (durationSeconds(value) ?? 0) > 0 ||
                "0:25:00の形式で、0より大きいタイムを入力してください。",
            })}
            error={errors.best_full_seconds?.message}
          />

          <div className="space-y-2">
            <label
              htmlFor="target_race_type"
              className="block text-sm font-medium"
            >
              目標レース
            </label>
            <select
              id="target_race_type"
              {...register("target_race_type", {
                required: "目標レースを選択してください。",
              })}
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
            >
              <option value="5k">5km</option>
              <option value="half">ハーフ</option>
              <option value="full">フル</option>
            </select>
            {errors.target_race_type?.message ? (
              <p className="text-sm text-red-600">
                {errors.target_race_type.message}
              </p>
            ) : null}
          </div>

          <FormField
            label="目標タイム（時:分:秒）"
            type="text"
            placeholder="4:30:00"
            registration={register("target_time_seconds", {
              required: "目標タイムを入力してください。",
              validate: (value) =>
                (durationSeconds(value) ?? 0) > 0 ||
                "4:30:00の形式で、0より大きいタイムを入力してください。",
            })}
            error={errors.target_time_seconds?.message}
          />

          <FormField
            label="レース日"
            type="date"
            registration={register("race_date", {
              required: "レース日を入力してください。",
              validate: (value) =>
                value >= trainingToday() ||
                "今日以降の日付を指定してください。",
            })}
            error={errors.race_date?.message}
          />
          <div id="weekly-schedule">
            <WeeklyScheduleFields value={schedule} onChange={setSchedule} />
          </div>
        </fieldset>
        {errors.root?.message && (
          <p role="alert" className="text-red-700">
            {errors.root.message}
          </p>
        )}
        <div className="space-y-2 rounded-lg bg-primary/5 p-4 text-sm">
          <p>
            このボタンはプロフィールを保存します。練習予定は、保存後にホームの「大会までの予定を提案」から作成し、内容を確認して保存します。
          </p>
          {unsetDays.length > 0 && (
            <p role="status">
              未設定: {unsetDays.map((day) => day.label).join("・")}。
              予定を提案するには7曜日すべての設定が必要です。練習しない曜日は「休み」を選んでください。未設定のままでもプロフィールは保存できます。
            </p>
          )}
        </div>
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {isSubmitting ? "保存中..." : "プロフィールを保存"}
          </button>
          <Link
            href={initialProfile ? "/profile" : "/"}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
          >
            戻る
          </Link>
        </div>
      </form>
    </main>
  );
}

type FormFieldProps = {
  label: string;
  type: "number" | "date" | "text";
  error?: string;
  placeholder?: string;
  step?: string;
  registration: UseFormRegisterReturn;
};

function FormField({
  label,
  type,
  error,
  placeholder,
  step,
  registration,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={registration.name} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={registration.name}
        type={type}
        step={step}
        placeholder={placeholder}
        {...registration}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${registration.name}-error` : undefined}
        className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
      />
      {error ? (
        <p
          id={`${registration.name}-error`}
          role="alert"
          className="text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
