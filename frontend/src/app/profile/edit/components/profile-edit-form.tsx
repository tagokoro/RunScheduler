"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { type UseFormRegisterReturn, useForm } from "react-hook-form";

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
  target_race_type: "half",
  target_time_seconds: "",
  race_date: "",
};

type Props = {
  initialProfile: Profile | null;
};
export function ProfileEditForm({ initialProfile }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    defaultValues,
  });

  useEffect(() => {
    reset({
      age: initialProfile?.age?.toString() ?? "",
      weight: initialProfile?.weight?.toString() ?? "",
      best_5k_seconds: initialProfile?.best_5k_seconds?.toString() ?? "",
      best_half_seconds: initialProfile?.best_half_seconds?.toString() ?? "",
      best_full_seconds: initialProfile?.best_full_seconds?.toString() ?? "",
      target_race_type: initialProfile?.target_race_type ?? "half",
      target_time_seconds:
        initialProfile?.target_time_seconds?.toString() ?? "",
      race_date: initialProfile?.race_date ?? "",
    });
  }, [initialProfile, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const result = await updateProfile(values);

    if (!result.error) {
      showToast("プロフィールを保存しました。", "success");
      router.push("/profile");
      return;
    }

    showToast(result.error);
  });

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <div className="mb-6 space-y-2">
        <h1 className="text-2xl font-semibold">プロフィール編集</h1>
        <p className="text-sm text-gray-600">
          必要な項目を入力して保存してください。
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-6">
        <FormField
          label="年齢"
          type="number"
          placeholder="30"
          registration={register("age", {
            required: "年齢を入力してください。",
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
            min: {
              value: 0.1,
              message: "0より大きい数値を入力してください。",
            },
          })}
          error={errors.weight?.message}
        />

        <FormField
          label="5km ベスト(秒)"
          type="number"
          placeholder="1500"
          registration={register("best_5k_seconds", {
            min: {
              value: 0,
              message: "0以上の数値を入力してください。",
            },
          })}
          error={errors.best_5k_seconds?.message}
        />

        <FormField
          label="ハーフ ベスト(秒)"
          type="number"
          placeholder="7200"
          registration={register("best_half_seconds", {
            min: {
              value: 0,
              message: "0以上の数値を入力してください。",
            },
          })}
          error={errors.best_half_seconds?.message}
        />

        <FormField
          label="フル ベスト(秒)"
          type="number"
          placeholder="14400"
          registration={register("best_full_seconds", {
            min: {
              value: 0,
              message: "0以上の数値を入力してください。",
            },
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
            className="w-full rounded border px-3 py-2"
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
          label="目標タイム(秒)"
          type="number"
          placeholder="7200"
          registration={register("target_time_seconds", {
            required: "目標タイムを入力してください。",
            min: {
              value: 0,
              message: "0以上の数値を入力してください。",
            },
          })}
          error={errors.target_time_seconds?.message}
        />

        <FormField
          label="レース日"
          type="date"
          registration={register("race_date", {
            required: "レース日を入力してください。",
          })}
          error={errors.race_date?.message}
        />

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
          >
            {isSubmitting ? "保存中..." : "保存"}
          </button>
          <Link href="/profile" className="rounded border px-4 py-2">
            戻る
          </Link>
        </div>
      </form>
    </main>
  );
}

type FormFieldProps = {
  label: string;
  type: "number" | "date";
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
        className="w-full rounded border px-3 py-2"
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
