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
import { trainingToday } from "@/lib/date";
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
  const router = useRouter();
  const { showToast } = useToast();
  const [trainingRecords, setTrainingRecords] =
    useState<TrainingRecord[]>(initialRecords);
  const [selectedRecordForDelete, setSelectedRecordForDelete] =
    useState<TrainingRecord | null>(null);
  const [isDeletingRecord, setIsDeletingRecord] = useState(false);
  const todayTrainingRecord =
    trainingRecords.find((record) => record.date === trainingToday()) ?? null;

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
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 p-6">
      {!hasProfile && (
        <section className="space-y-3 rounded-xl border border-blue-200 bg-blue-50 p-6">
          <h1 className="text-2xl font-semibold">
            まずは目標レースを登録しましょう
          </h1>
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
          <h1 className="text-2xl font-semibold text-neutral-900">
            練習予定と実績
          </h1>
          <p className="text-sm text-neutral-500">
            練習後は「実績を記録」から距離・時間・振り返りを残せます。
          </p>
        </div>
        <WeeklyPlanDialog
          configured={hasProfile && scheduleConfigured}
          raceDate={raceDate}
          onSaved={(saved, startDate, endDate) => {
            setTrainingRecords((current) =>
              [
                ...current.filter(
                  (record) => record.date < startDate || record.date > endDate,
                ),
                ...saved,
              ].sort((a, b) => a.date.localeCompare(b.date)),
            );
            router.refresh();
            showToast("大会までの予定を保存しました。", "success");
          }}
        />
      </div>

      {trainingRecords.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
          まだ練習予定がありません。普段の練習スケジュールを登録し、「大会までの予定を提案」から確認して保存しましょう。
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {trainingRecords.map((record) => (
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
