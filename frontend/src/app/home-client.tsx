"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrainingRecordEditor } from "@/components/training-record-editor";

import { TrainingRecordCarousel } from "@/components/training-record-carousel";
import { TrainingRecordCard } from "@/components/training-record-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toaster";
import { deleteTrainingRecord } from "@/lib/api/training-records";
import {
  trainingToday,
  formatJapaneseDate,
  formatDateString,
  addDaysToDateString,
  parseDateString,
} from "@/lib/date";
import { RunningTrack } from "@/components/running-track";
import { trainingTypeLabel } from "@/lib/training";
import type { TrainingRecord } from "@/types/training-records";
import { WeeklyPlanDialog } from "@/components/weekly-plan-dialog";

export function HomeClient({
  initialRecords,
  hasProfile,
  scheduleConfigured,
  raceDate,
}: {
  initialRecords: TrainingRecord[];
  hasProfile: boolean;
  scheduleConfigured: boolean;
  raceDate: string | null;
}) {
  const [showAllRecords, setShowAllRecords] = useState(false);
  const today = trainingToday();
  const daysToRace = raceDate
    ? Math.round((Date.parse(raceDate) - Date.parse(today)) / 86400000)
    : null;
  const router = useRouter();
  const { showToast } = useToast();
  const [trainingRecords, setTrainingRecords] =
    useState<TrainingRecord[]>(initialRecords);
  const [selectedRecordForDelete, setSelectedRecordForDelete] =
    useState<TrainingRecord | null>(null);
  const [isDeletingRecord, setIsDeletingRecord] = useState(false);
  const todayTrainingRecord =
    trainingRecords.find((record) => record.date === trainingToday()) ?? null;

  const otherRecords = trainingRecords
    .filter((record) => record.date !== today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = otherRecords.filter((record) => record.date > today);
  const visibleRecords = showAllRecords
    ? otherRecords
    : upcoming.length
      ? upcoming
      : otherRecords.slice().reverse();

  const recentStart = formatDateString(addDaysToDateString(today, -6));
  const recentActivities = trainingRecords.filter(
    (record) =>
      record.completed &&
      record.training_type !== "rest" &&
      record.date >= recentStart &&
      record.date <= today,
  );
  const recentDistance = recentActivities.reduce(
    (total, record) =>
      total + (record.actual_distance_km ?? record.distance_km ?? 0),
    0,
  );
  const nextSevenDays = Array.from({ length: 7 }, (_, index) =>
    formatDateString(addDaysToDateString(today, index)),
  );
  const weekday = (date: string) =>
    new Intl.DateTimeFormat("ja-JP", { weekday: "short" }).format(
      parseDateString(date),
    );

  const handleSaved = (updated: TrainingRecord) => {
    setTrainingRecords((current) =>
      current.map((record) => (record.id === updated.id ? updated : record)),
    );
    showToast("実績を保存しました。統計から振り返れます。", "success");
  };

  const handleDeleteRecord = async () => {
    if (!selectedRecordForDelete) {
      return;
    }

    setIsDeletingRecord(true);

    try {
      const result = await deleteTrainingRecord(selectedRecordForDelete.id);

      if (result.error) {
        showToast(result.error);
        return;
      }

      setTrainingRecords((current) =>
        current.filter((record) => record.id !== selectedRecordForDelete.id),
      );
      setSelectedRecordForDelete(null);
      router.refresh();
      showToast("トレーニング記録を削除しました。", "success");
    } catch {
      showToast("トレーニング記録の削除に失敗しました。");
    } finally {
      setIsDeletingRecord(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:gap-9 sm:px-6 sm:py-9">
      {!hasProfile && (
        <section className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-6">
          <h2 className="text-xl font-semibold">
            まずは目標レースを登録しましょう
          </h2>
          <p>
            プロフィール登録 → 練習予定の作成 → 実績の記録の順で始められます。
          </p>
          <Link
            href="/profile/edit"
            className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-white"
          >
            目標・プロフィールを登録
          </Link>
        </section>
      )}
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-4xl">
            今日も、自分のペースで。
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {formatJapaneseDate(today)}（{weekday(today)}）
          </p>
        </div>
        <div
          id="plan-actions"
          className="flex scroll-mt-5 flex-wrap items-center gap-2"
        >
          <WeeklyPlanDialog
            configured={hasProfile && scheduleConfigured}
            raceDate={raceDate}
            onSaved={(saved, startDate, endDate) => {
              setTrainingRecords((current) =>
                [
                  ...current.filter(
                    (record) =>
                      record.date < startDate || record.date > endDate,
                  ),
                  ...saved,
                ].sort((a, b) => a.date.localeCompare(b.date)),
              );
              router.refresh();
              showToast("大会までの予定を保存しました。", "success");
            }}
          />
          <Link
            href="/schedule"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-black/10 bg-white px-4 text-sm font-medium text-ink hover:bg-white/60"
          >
            カレンダー <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
      <div className="grid items-stretch gap-5 lg:grid-cols-[1.65fr_1fr]">
        <section aria-label="今日のトレーニング" className="min-w-0">
          {todayTrainingRecord ? (
            <TrainingRecordCard
              record={todayTrainingRecord}
              emphasis="highlighted"
              footer={
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setSelectedRecordForDelete(todayTrainingRecord)
                    }
                  >
                    削除
                  </Button>
                  <TrainingRecordEditor
                    record={todayTrainingRecord}
                    onSaved={handleSaved}
                  />
                </div>
              }
            />
          ) : (
            <div className="training-feature relative flex min-h-80 flex-col justify-between overflow-hidden rounded-3xl bg-ink p-6 text-white sm:p-8">
              <RunningTrack className="absolute -right-24 -top-10 w-[440px] text-white/15" />
              <div className="relative space-y-4">
                <p className="flex items-center gap-2 text-xs font-medium tracking-[0.15em] text-citrus">
                  <span className="size-1.5 rounded-full bg-citrus" />
                  TODAY’S TRAINING
                </p>
                <h3 className="max-w-sm text-3xl font-semibold leading-relaxed tracking-tight">
                  次の一歩を、
                  <br />
                  ここから。
                </h3>
                <p className="max-w-xs text-sm leading-7 text-white/65">
                  今日のトレーニングはまだ登録されていません。走れる曜日をもとに、大会までの道のりを作りましょう。
                </p>
              </div>
              <Link
                href="/profile/edit#weekly-schedule"
                className="relative mt-5 inline-flex min-h-10 w-fit items-center gap-6 border-b border-white/30 text-sm text-white"
              >
                {scheduleConfigured
                  ? "練習スケジュールを見直す"
                  : "普段の練習スケジュールを設定"}{" "}
                <span aria-hidden="true">↗</span>
              </Link>
            </div>
          )}
        </section>
        <section
          className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-black/5 bg-citrus p-6 sm:p-8"
          aria-labelledby="race-heading"
        >
          <RunningTrack className="absolute -right-36 -top-8 w-[390px] text-ink/15" />
          <div className="relative">
            <p className="text-xs font-semibold tracking-[0.16em] text-ink/60">
              NEXT FINISH LINE
            </p>
            <h2
              id="race-heading"
              className="mt-3 text-base font-semibold text-ink"
            >
              目標レースまで
            </h2>
            {daysToRace !== null && daysToRace >= 0 ? (
              <>
                <p className="my-5 flex items-baseline gap-3 text-ink">
                  <span className="dashboard-number text-7xl font-semibold sm:text-8xl">
                    {daysToRace}
                  </span>
                  <span className="text-base">日</span>
                </p>
                <p className="text-sm text-ink/70">
                  {daysToRace === 0
                    ? "いよいよ、大会当日です。"
                    : raceDate
                      ? formatJapaneseDate(raceDate)
                      : ""}
                </p>
              </>
            ) : (
              <p className="my-6 text-xl font-semibold leading-relaxed text-ink">
                {raceDate
                  ? "次の目標を、決めよう。"
                  : "あなたの目標が、計画のスタート。"}
              </p>
            )}
          </div>
          <Link
            href={raceDate ? "/profile" : "/profile/edit"}
            className="relative mt-6 flex min-h-10 items-center justify-between border-t border-ink/15 pt-4 text-sm font-medium text-ink"
          >
            {raceDate ? "目標・プロフィールを見る" : "目標レースを設定する"}
            <span aria-hidden="true">↗</span>
          </Link>
        </section>
      </div>
      <section
        className="grid grid-cols-2 gap-4 border-y border-black/10 py-5 sm:grid-cols-[1fr_1fr_1.3fr] sm:gap-8"
        aria-label="直近7日間の記録"
      >
        <div className="border-r border-black/10 pr-4">
          <p className="text-xs text-slate-500">直近7日間の走行距離</p>
          <p className="mt-2 text-ink">
            <span className="dashboard-number text-4xl font-semibold">
              {recentDistance.toFixed(1)}
            </span>
            <span className="ml-2 text-sm text-slate-500">km</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">直近7日間の実施回数</p>
          <p className="mt-2 text-ink">
            <span className="dashboard-number text-4xl font-semibold">
              {recentActivities.length}
            </span>
            <span className="ml-2 text-sm text-slate-500">回</span>
          </p>
        </div>
        <Link
          href="/statistics"
          className="col-span-2 flex items-center justify-between gap-3 rounded-2xl bg-white/70 px-4 py-3 text-sm text-ink sm:col-span-1"
        >
          <span>
            <span className="mb-1 block font-semibold">統計を見る</span>
            <span className="text-xs text-slate-500">
              距離・時間・回数から振り返る
            </span>
          </span>
          <span aria-hidden="true">↗</span>
        </Link>
      </section>
      <section className="space-y-4" aria-labelledby="week-heading">
        <div className="flex items-center justify-between gap-3">
          <h2 id="week-heading" className="text-lg font-semibold text-ink">
            7日間の見通し
          </h2>
          <span className="text-xs text-slate-500">休む日も、計画のうち。</span>
        </div>
        <ol className="grid grid-cols-7 gap-1.5 sm:gap-3">
          {nextSevenDays.map((date) => {
            const record = trainingRecords.find((item) => item.date === date);
            const isToday = date === today;
            return (
              <li key={date} className="min-w-0">
                <Link
                  href={`/schedule?date=${date}`}
                  aria-label={`${formatJapaneseDate(date)}、${record ? trainingTypeLabel(record.training_type) : "予定なし"}`}
                  className={`week-tile flex h-full min-h-28 flex-col items-center rounded-2xl border px-1 py-3 text-center sm:min-h-32 sm:px-2 ${isToday ? "border-ink bg-ink text-white" : "border-black/5 bg-white text-ink hover:border-primary/40"}`}
                >
                  <span
                    className={`text-[10px] sm:text-xs ${isToday ? "text-white/60" : "text-slate-500"}`}
                  >
                    {isToday ? "今日" : weekday(date)}
                  </span>
                  <span className="dashboard-number my-2 text-2xl font-semibold sm:text-3xl">
                    {parseDateString(date).getDate()}
                  </span>
                  <span
                    className={`mt-auto text-[10px] leading-5 sm:text-xs ${isToday ? "text-citrus" : record?.completed ? "text-emerald-700" : "text-slate-500"}`}
                  >
                    {record?.completed
                      ? "記録済み"
                      : record?.training_type === "rest"
                        ? "休養"
                        : record?.training_type === "race"
                          ? "大会"
                          : record?.duration_minutes
                            ? `${record.duration_minutes}分`
                            : record
                              ? "練習"
                              : "—"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {showAllRecords
              ? "すべての予定・実績"
              : upcoming.length
                ? "これからの予定"
                : "最近の記録"}
          </h2>
          <p className="text-sm text-neutral-500">
            {upcoming.length
              ? "直近の予定を確認して、無理のないペースで続けましょう。"
              : "走った距離や時間、感じたことを記録しましょう。"}
          </p>
        </div>
        {upcoming.length > 0 && otherRecords.length > upcoming.length && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAllRecords((value) => !value)}
          >
            {showAllRecords ? "予定のみ表示" : "過去の記録も見る"}
          </Button>
        )}
      </div>

      {visibleRecords.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
          {trainingRecords.length
            ? "これからの予定はまだありません。大会までの計画を提案して、次の練習を決めましょう。"
            : "まだ練習予定がありません。普段の練習スケジュールを登録し、「大会までの予定を提案」から確認して保存しましょう。"}
        </div>
      ) : (
        <TrainingRecordCarousel
          key={showAllRecords ? "all" : "upcoming"}
          records={visibleRecords}
          onSaved={handleSaved}
          onDelete={setSelectedRecordForDelete}
        />
      )}

      <Dialog
        open={selectedRecordForDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeletingRecord) {
            setSelectedRecordForDelete(null);
          }
        }}
      >
        <DialogContent showCloseButton={!isDeletingRecord}>
          <DialogHeader>
            <DialogTitle>このトレーニングを削除しますか？</DialogTitle>
            <DialogDescription>
              {selectedRecordForDelete
                ? `${selectedRecordForDelete.date} の ${selectedRecordForDelete.training_type} を削除します。`
                : "削除対象を確認しています。"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" disabled={isDeletingRecord} />}
            >
              キャンセル
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDeleteRecord}
              disabled={isDeletingRecord || selectedRecordForDelete === null}
            >
              {isDeletingRecord ? "削除中..." : "削除する"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
