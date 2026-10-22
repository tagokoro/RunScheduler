"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrainingRecordEditor } from "@/components/training-record-editor";

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
import { trainingToday, formatJapaneseDate } from "@/lib/date";
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
      ? upcoming.slice(0, 7)
      : otherRecords.slice(-3).reverse();

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
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8">
      {!hasProfile && (
        <section className="space-y-3 rounded-xl border border-blue-200 bg-blue-50 p-6">
          <h2 className="text-xl font-semibold">
            まずは目標レースを登録しましょう
          </h2>
          <p>
            プロフィール登録 → 練習予定の作成 → 実績の記録の順で始められます。
          </p>
          <Link
            href="/profile/edit"
            className="inline-flex min-h-11 items-center rounded-full bg-blue-700 px-5 text-white"
          >
            目標・プロフィールを登録
          </Link>
        </section>
      )}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
        <div
          className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full border-[32px] border-blue-50"
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-widest text-blue-700">
              {formatJapaneseDate(today)}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              目標に向かって、
              <br className="sm:hidden" />
              一日ずつ。
            </h1>
            <p className="max-w-lg text-sm leading-7 text-slate-500">
              走れる日を計画に。走った日を、自信に。
              <br />
              今日の練習と、大会までの道のりを確認しましょう。
            </p>
          </div>
          {daysToRace !== null && daysToRace >= 0 && (
            <div className="flex w-full items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 sm:block sm:w-auto">
              <div>
                <p className="text-xs font-medium text-blue-700">
                  {daysToRace === 0 ? "今日は大会当日" : "目標レースまで"}
                </p>
                <p className="mt-1 text-4xl font-semibold tabular-nums tracking-tight text-slate-900">
                  {daysToRace}
                  <span className="ml-1 text-sm font-normal text-slate-500">
                    日
                  </span>
                </p>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {raceDate ? formatJapaneseDate(raceDate) : ""}
              </p>
            </div>
          )}
        </div>
        <div className="relative mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
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
            className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            カレンダーを見る <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">
            今日のトレーニング
          </h2>
          <p className="text-sm text-neutral-500">
            今日取り組むメニューをすぐ確認できます。
          </p>
        </div>

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
          <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-sm text-neutral-500">
            今日のトレーニングはまだ登録されていません。
          </div>
        )}
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
        {(otherRecords.length > visibleRecords.length || showAllRecords) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAllRecords((value) => !value)}
          >
            {showAllRecords
              ? "直近のみ表示"
              : `すべて見る（${otherRecords.length}件）`}
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
        <div className="grid items-start gap-4 md:grid-cols-2">
          {visibleRecords.map((record) => (
            <TrainingRecordCard
              key={record.id}
              record={record}
              footer={
                <div className="flex flex-wrap gap-2">
                  <TrainingRecordEditor record={record} onSaved={handleSaved} />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedRecordForDelete(record)}
                  >
                    削除
                  </Button>
                </div>
              }
            />
          ))}
        </div>
      )}

      <Link href="/statistics" className="text-blue-700 underline">
        練習の実績を振り返る
      </Link>
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
