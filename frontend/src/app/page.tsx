"use client";

import { useEffect, useState } from "react";

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
  listTrainingRecords,
  updateTrainingRecord,
} from "@/lib/api/training-records";
import { formatDateString } from "@/lib/date";
import type {
  CreateTrainingRecordsRequest,
  TrainingRecord,
  Weekday,
} from "@/types/training-records";
import { WEEKDAYS } from "@/types/training-records";

export default function Home() {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [trainingRecords, setTrainingRecords] = useState<
    TrainingRecord[] | null
  >([]);
  const [selectedWeekdays, setSelectedWeekdays] = useState<Weekday[]>([]);
  const [days, setDays] = useState<number>(0);
  const [requestMessage, setRequestMessage] = useState("");
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingToday, setIsUpdatingToday] = useState(false);
  const [selectedRecordForDelete, setSelectedRecordForDelete] =
    useState<TrainingRecord | null>(null);
  const [isDeletingRecord, setIsDeletingRecord] = useState(false);
  const todayTrainingRecord =
    trainingRecords?.find(
      (record) => record.date === formatDateString(new Date()),
    ) ?? null;

  const toggleWeekday = (weekday: Weekday) => {
    setSelectedWeekdays((current) =>
      current.includes(weekday)
        ? current.filter((value) => value !== weekday)
        : [...current, weekday],
    );
  };

  useEffect(() => {
    const fetchTrainingRecords = async () => {
      try {
        const trainingRecords = await listTrainingRecords();
        setTrainingRecords(trainingRecords);
      } catch {
        setTrainingRecords(null);
      } finally {
        setIsLoadingRecords(false);
      }
    };

    void fetchTrainingRecords();
  }, []);

  const handleGenerate = async () => {
    if (selectedWeekdays.length === 0) {
      showToast("曜日を1つ以上選択してください。");
      return;
    }

    if (days <= 0) {
      showToast("生成日数は1日以上を指定してください。");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: CreateTrainingRecordsRequest = {
        days,
        training_days: selectedWeekdays,
        request_message: requestMessage.trim() || undefined,
      };

      const result = await createTrainingRecords(payload);

      if (result.error || !result.trainingRecords) {
        showToast(result.error ?? "トレーニング予定の生成に失敗しました。");
        return;
      }

      setTrainingRecords(result.trainingRecords);
      setOpen(false);
      showToast("トレーニング予定を生成しました。", "success");
    } catch {
      showToast("トレーニング予定の生成に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteToday = async () => {
    if (!todayTrainingRecord || todayTrainingRecord.completed) {
      return;
    }

    setIsUpdatingToday(true);

    try {
      const result = await updateTrainingRecord(todayTrainingRecord.id, {
        completed: true,
      });

      if (result.error || !result.trainingRecord) {
        showToast(result.error ?? "トレーニング記録の更新に失敗しました。");
        return;
      }

      const updatedTrainingRecord = result.trainingRecord;
      setTrainingRecords(
        (current) =>
          current?.map((record) =>
            record.id === updatedTrainingRecord.id
              ? updatedTrainingRecord
              : record,
          ) ?? null,
      );
      showToast("今日もお疲れ様でした。", "success");
    } catch {
      showToast("トレーニング記録の更新に失敗しました。");
    } finally {
      setIsUpdatingToday(false);
    }
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

      setTrainingRecords(
        (current) =>
          current?.filter(
            (record) => record.id !== selectedRecordForDelete.id,
          ) ?? null,
      );
      setSelectedRecordForDelete(null);
      showToast("トレーニング記録を削除しました。", "success");
    } catch {
      showToast("トレーニング記録の削除に失敗しました。");
    } finally {
      setIsDeletingRecord(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 p-6">
      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">
            今日のトレーニング
          </h2>
          <p className="text-sm text-neutral-500">
            今日取り組むメニューをすぐ確認できます。
          </p>
        </div>

        {isLoadingRecords ? null : trainingRecords === null ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-sm text-neutral-500">
            今日のトレーニングを取得できませんでした。
          </div>
        ) : todayTrainingRecord ? (
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
                <Button
                  onClick={handleCompleteToday}
                  disabled={isUpdatingToday || todayTrainingRecord.completed}
                >
                  {todayTrainingRecord.completed
                    ? "完了済み"
                    : isUpdatingToday
                      ? "更新中..."
                      : "完了"}
                </Button>
              </div>
            }
          />
        ) : (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-sm text-neutral-500">
            今日のトレーニングはまだ登録されていません。
          </div>
        )}
      </section>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            Training Records
          </h1>
          <p className="text-sm text-neutral-500">
            取得したトレーニング記録を一覧で確認できます。
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            トレーニング予定を生成
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>トレーニング曜日を選択</DialogTitle>
              <DialogDescription>
                トレーニングする曜日を選択してください。
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <p className="text-sm font-medium">曜日</p>
              <div className="grid grid-cols-2 gap-2">
                {WEEKDAYS.map((weekday) => {
                  const checked = selectedWeekdays.includes(weekday.id);

                  return (
                    <label key={weekday.id} className="flex items-center gap-2">
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
                value={requestMessage}
                onChange={(event) => setRequestMessage(event.target.value)}
                className="min-h-24 w-full rounded-md border px-3 py-2"
                placeholder="例: 平日は短め、土曜は長めで組みたい"
              />
            </div>

            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                キャンセル
              </DialogClose>
              <Button onClick={handleGenerate} disabled={isSubmitting}>
                {isSubmitting ? "生成中..." : "予定を生成"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoadingRecords ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
          トレーニング記録を読み込んでいます...
        </div>
      ) : trainingRecords === null ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
          トレーニング記録の取得に失敗しました。
        </div>
      ) : trainingRecords.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
          まだトレーニング記録がありません。
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {trainingRecords.map((record) => (
            <TrainingRecordCard
              key={record.id}
              record={record}
              footer={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRecordForDelete(record)}
                >
                  削除
                </Button>
              }
            />
          ))}
        </div>
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
