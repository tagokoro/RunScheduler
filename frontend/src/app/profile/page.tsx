"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { Profile, ProfileResponse } from "./profile-types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function Page() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/me/profile`, {
          credentials: "include",
        });

        if (response.status === 404) {
          setError("プロフィールがまだ作成されていません。");
          return;
        }

        if (!response.ok) {
          const data: { error?: string } = await response.json();
          setError(data.error ?? "failed to fetch profile");
          return;
        }

        const data: ProfileResponse = await response.json();
        setProfile(data.profile);
      } catch {
        setError("プロフィールの取得に失敗しました。");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchProfile();
  }, []);

  if (isLoading) {
    return <main className="px-6 py-10">Loading...</main>;
  }

  if (error) {
    return (
      <main className="space-y-4 px-6 py-10">
        <p>{error}</p>
        <Link href="/profile/edit" className="text-blue-600 underline">
          プロフィールを作成する
        </Link>
      </main>
    );
  }

  if (!profile) {
    return <main className="px-6 py-10">プロフィールがありません。</main>;
  }

  return (
    <main className="space-y-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">プロフィール</h1>
        <Link href="/profile/edit" className="text-blue-600 underline">
          編集する
        </Link>
      </div>

      <dl className="grid max-w-2xl gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-gray-500">年齢</dt>
          <dd>{profile.age ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-sm text-gray-500">体重</dt>
          <dd>{profile.weight ?? "-"} kg</dd>
        </div>
        <div>
          <dt className="text-sm text-gray-500">5km ベスト</dt>
          <dd>{profile.best_5k_seconds ?? "-"} 秒</dd>
        </div>
        <div>
          <dt className="text-sm text-gray-500">ハーフ ベスト</dt>
          <dd>{profile.best_half_seconds ?? "-"} 秒</dd>
        </div>
        <div>
          <dt className="text-sm text-gray-500">フル ベスト</dt>
          <dd>{profile.best_full_seconds ?? "-"} 秒</dd>
        </div>
        <div>
          <dt className="text-sm text-gray-500">目標レース</dt>
          <dd>{profile.target_race_type}</dd>
        </div>
        <div>
          <dt className="text-sm text-gray-500">目標タイム</dt>
          <dd>{profile.target_time_seconds} 秒</dd>
        </div>
        <div>
          <dt className="text-sm text-gray-500">レース日</dt>
          <dd>{profile.race_date}</dd>
        </div>
      </dl>
    </main>
  );
}
