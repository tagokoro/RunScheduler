import { WEEKDAYS } from "@/types/training-records";
import Link from "next/link";
import { LoginPrompt } from "@/components/auth/login-button";
import { getCurrentUser } from "@/lib/api/session";
import { formatDuration, RACE_LABELS } from "@/lib/profile-time";
import { cookies } from "next/headers";
import { getProfile } from "@/lib/api/profile";

export default async function Page() {
  const cookieHeader = (await cookies()).toString();
  if (!(await getCurrentUser(cookieHeader))) return <LoginPrompt />;
  const profile = await getProfile(cookieHeader);
  if (!profile)
    return (
      <main className="mx-auto max-w-3xl space-y-4 p-6 py-10">
        <h1 className="text-2xl font-semibold">練習の目標を登録しましょう</h1>
        <p>レースと目標タイムを登録すると、予定を作成できます。</p>
        <Link href="/profile/edit" className="text-blue-700 underline">
          プロフィールを登録する
        </Link>
      </main>
    );

  return (
    <main className="space-y-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">プロフィール</h1>
        <Link href="/profile/edit" className="text-blue-600 underline">
          編集する
        </Link>
      </div>

      <Link href="/" className="inline-block text-blue-700 underline">
        練習予定の作成・記録へ進む
      </Link>
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
          <dd>{formatDuration(profile.best_5k_seconds)}</dd>
        </div>
        <div>
          <dt className="text-sm text-gray-500">ハーフ ベスト</dt>
          <dd>{formatDuration(profile.best_half_seconds)}</dd>
        </div>
        <div>
          <dt className="text-sm text-gray-500">フル ベスト</dt>
          <dd>{formatDuration(profile.best_full_seconds)}</dd>
        </div>
        <div>
          <dt className="text-sm text-gray-500">目標レース</dt>
          <dd>{RACE_LABELS[profile.target_race_type]}</dd>
        </div>
        <div>
          <dt className="text-sm text-gray-500">目標タイム</dt>
          <dd>{formatDuration(profile.target_time_seconds)}</dd>
        </div>
        <div>
          <dt className="text-sm text-gray-500">レース日</dt>
          <dd>{profile.race_date}</dd>
        </div>
      </dl>
      <section className="max-w-2xl space-y-3">
        <h2 className="text-xl font-semibold">普段の練習スケジュール</h2>
        <p className="text-sm text-neutral-600">
          時間は利用可能な上限です。必ず消化する練習量ではありません。
        </p>
        <dl className="grid grid-cols-2 gap-2">
          {WEEKDAYS.map((day) => {
            const minutes = profile.weekly_availability?.[day.id];
            return (
              <div key={day.id} className="rounded-lg border p-3">
                <dt>{day.label}</dt>
                <dd>
                  {minutes == null
                    ? "未設定"
                    : minutes === 0
                      ? "休み"
                      : `${minutes}分まで`}
                </dd>
              </div>
            );
          })}
        </dl>
        {WEEKDAYS.some(
          (day) => profile.weekly_availability?.[day.id] == null,
        ) && <p>7曜日すべてを設定すると、1週間の予定を提案できます。</p>}
      </section>
    </main>
  );
}
