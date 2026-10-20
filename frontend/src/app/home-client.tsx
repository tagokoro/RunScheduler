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
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toaster";
import {
  createTrainingRecords,
  deleteTrainingRecord,
} from "@/lib/api/training-records";
import { trainingToday } from "@/lib/date";
import type {
  CreateTrainingRecordsRequest,
  TrainingRecord,
  Weekday,
} from "@/types/training-records";
import { WEEKDAYS } from "@/types/training-records";

export function HomeClient({
  initialRecords,
  hasProfile,
}: {
  initialRecords: TrainingRecord[];
  hasProfile: boolean;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [trainingRecords, setTrainingRecords] =
    useState<TrainingRecord[]>(initialRecords);
  const [selectedWeekdays, setSelectedWeekdays] = useState<Weekday[]>([]);
  const [days, setDays] = useState<number>(7);
  const [requestMessage, setRequestMessage] = useState("");
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedRecordForDelete, setSelectedRecordForDelete] =
    useState<TrainingRecord | null>(null);
  const [isDeletingRecord, setIsDeletingRecord] = useState(false);
  const todayTrainingRecord =
    trainingRecords.find((record) => record.date === trainingToday()) ?? null;

  const toggleWeekday = (weekday: Weekday) => {
    setSelectedWeekdays((current) =>
      current.includes(weekday)
        ? current.filter((value) => value !== weekday)
        : [...current, weekday],
    );
  };

  const handleGenerate = async () => {
    if (selectedWeekdays.length === 0) {
      setGenerationError("曜日を1つ以上選択してください。");
      return;
    }

    if (!Number.isInteger(days) || days < 1 || days > 31) {
      setGenerationError("生成日数は1〜31日の整数で指定してください。");
      return;
    }

    setGenerationError(null);
    setIsSubmitting(true);

    try {
      const payload: CreateTrainingRecordsRequest = {
        days,
        training_days: selectedWeekdays,
        request_message: requestMessage.trim() || undefined,
      };

      const result = await createTrainingRecords(payload);

      if (result.error || !result.trainingRecords) {
        setGenerationError(
          result.error ?? "トレーニング予定の生成に失敗しました。",
        );
        return;
      }

      const generated = result.trainingRecords;
      setTrainingRecords((current) =>
        [
          ...current.filter(
            (record) => !generated.some((item) => item.id === record.id),
          ),
          ...generated,
        ].sort((a, b) => a.date.localeCompare(b.date)),
      );
      router.refresh();
      setOpen(false);
      showToast("トレーニング予定を生成しました。", "success");
    } catch {
      setGenerationError(
        "通信に失敗しました。入力内容を保持しています。再試行してください。",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <Dialog
          open={open}
          onOpenChange={(nextOpen) => {
            if (!isSubmitting) setOpen(nextOpen);
          }}
        >
          <DialogTrigger
            render={<Button disabled={!hasProfile} className="min-h-11" />}
          >
            トレーニング予定を生成
          </DialogTrigger>
          <DialogContent
            showCloseButton={!isSubmitting}
            className="max-h-[90dvh] overflow-y-auto"
          >
            <DialogHeader>
              <DialogTitle>練習予定を作成</DialogTitle>
              <DialogDescription>
                今日から指定日数分の予定を作ります。同じ日の未実施予定は置き換わります。実績がある日は保持されます。
              </DialogDescription>
            </DialogHeader>

            <fieldset disabled={isSubmitting} className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">曜日</p>
                <div className="grid grid-cols-2 gap-2">
                  {WEEKDAYS.map((weekday) => {
                    const checked = selectedWeekdays.includes(weekday.id);

                    return (
                      <label
                        key={weekday.id}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleWeekday(weekday.id)}
                        />
                        <span>{weekday.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="training-records-days"
                  className="block text-sm font-medium"
                >
                  生成日数
                </label>
                <input
                  id="training-records-days"
                  type="number"
                  min={1}
                  max={31}
                  step={1}
                  value={days}
                  onChange={(event) => setDays(Number(event.target.value))}
                  className="w-full rounded-md border px-3 py-2"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="training-records-request"
                  className="block text-sm font-medium"
                >
                  要望
                </label>
                <textarea
                  id="training-records-request"
                  maxLength={2000}
                  value={requestMessage}
                  onChange={(event) => setRequestMessage(event.target.value)}
                  className="min-h-24 w-full rounded-md border px-3 py-2"
                  placeholder="例: 平日は短め、土曜は長めで組みたい"
                />
              </div>
            </fieldset>
            {generationError && (
              <p role="alert" className="text-red-700">
                {generationError}
              </p>
            )}
            {isSubmitting && (
              <p role="status">
                予定を作成しています。1分ほどかかる場合があります。この画面でお待ちください。
              </p>
            )}
            <DialogFooter>
              <DialogClose
                render={<Button variant="outline" disabled={isSubmitting} />}
              >
                キャンセル
              </DialogClose>
              <Button onClick={handleGenerate} disabled={isSubmitting}>
                {isSubmitting ? "生成中..." : "予定を生成"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {trainingRecords.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
          まだ練習予定がありません。プロフィール登録後、「トレーニング予定を生成」から始めましょう。
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
