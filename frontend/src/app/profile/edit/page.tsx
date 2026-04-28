"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import type {
  ProfileResponse,
  TargetRaceType,
  UpdateProfilePayload,
} from "../profile-types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

type ProfileFormValues = {
  age: string;
  weight: string;
  best_5k_seconds: string;
  best_half_seconds: string;
  best_full_seconds: string;
  target_race_type: TargetRaceType;
  target_time_seconds: string;
  race_date: string;
};

type ErrorResponse = {
  error?: string;
  errors?: string[];
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

const buildProfilePayload = (
  values: ProfileFormValues,
): UpdateProfilePayload => ({
  profile: values,
});

export default function Page() {
  const router = useRouter();
  const [pageError, setPageError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    defaultValues,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/me/profile`, {
          credentials: "include",
        });

        if (response.status === 404) {
          return;
        }

        if (!response.ok) {
          const data: ErrorResponse = await response.json();
          setPageError(data.error ?? "プロフィールの取得に失敗しました。");
          return;
        }

        const data: ProfileResponse = await response.json();
        reset({
          age: data.profile.age?.toString() ?? "",
          weight: data.profile.weight?.toString() ?? "",
          best_5k_seconds: data.profile.best_5k_seconds?.toString() ?? "",
          best_half_seconds: data.profile.best_half_seconds?.toString() ?? "",
          best_full_seconds: data.profile.best_full_seconds?.toString() ?? "",
          target_race_type: data.profile.target_race_type,
          target_time_seconds: data.profile.target_time_seconds.toString(),
          race_date: data.profile.race_date,
        });
      } catch {
        setPageError("プロフィールの取得に失敗しました。");
      } finally {
        setIsFetching(false);
      }
    };

    void fetchProfile();
  }, [reset]);

  const onSubmit = handleSubmit(async (values) => {
    setPageError(null);

    const response = await fetch(`${apiBaseUrl}/me/profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(buildProfilePayload(values)),
    });

    if (response.ok) {
      router.push("/profile");
      router.refresh();
      return;
    }

    const data: ErrorResponse = await response.json();
    setPageError(
      data.errors?.join(" / ") ??
        data.error ??
        "プロフィールの更新に失敗しました。",
    );
  });

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <div className="mb-8 space-y-2">
        <h1 className="text-2xl font-semibold">プロフィール編集</h1>
        <p className="text-sm text-gray-600">
          必要な項目だけ入力して保存してください。
        </p>
      </div>

      {isFetching ? (
        <p>Loading...</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6">
          <FormField
            label="年齢"
            type="number"
            registration={register("age", {
              min: { value: 0, message: "0以上の数値を入力してください。" },
            })}
            error={errors.age?.message}
          />

          <FormField
            label="体重(kg)"
            type="number"
            step="0.1"
            registration={register("weight", {
              min: { value: 0.1, message: "0より大きい数値を入力してください。" },
            })}
            error={errors.weight?.message}
          />

          <FormField
            label="5km ベスト(秒)"
            type="number"
            registration={register("best_5k_seconds", {
              min: { value: 0, message: "0以上の数値を入力してください。" },
            })}
            error={errors.best_5k_seconds?.message}
          />

          <FormField
            label="ハーフ ベスト(秒)"
            type="number"
            registration={register("best_half_seconds", {
              min: { value: 0, message: "0以上の数値を入力してください。" },
            })}
            error={errors.best_half_seconds?.message}
          />

          <FormField
            label="フル ベスト(秒)"
            type="number"
            registration={register("best_full_seconds", {
              min: { value: 0, message: "0以上の数値を入力してください。" },
            })}
            error={errors.best_full_seconds?.message}
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium">目標レース</label>
            <select
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
            registration={register("target_time_seconds", {
              required: "目標タイムを入力してください。",
              min: { value: 0, message: "0以上の数値を入力してください。" },
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

          {pageError ? <p className="text-sm text-red-600">{pageError}</p> : null}

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
      )}
    </main>
  );
}

type FormFieldProps = {
  label: string;
  type: "number" | "date";
  error?: string;
  step?: string;
  registration: ReturnType<typeof useForm<ProfileFormValues>>["register"] extends (
    ...args: never[]
  ) => infer T
    ? T
    : never;
};

function FormField({
  label,
  type,
  error,
  step,
  registration,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      <input
        type={type}
        step={step}
        {...registration}
        className="w-full rounded border px-3 py-2"
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
