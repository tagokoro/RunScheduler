"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import type {
  CreateTrainingRecordsRequest,
  TrainingRecord,
  TrainingRecordsResponse,
  Weekday,
} from "@/types/training-records";
import { WEEKDAYS } from "@/types/training-records";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function Home() {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([]);
  const [selectedWeekdays, setSelectedWeekdays] = useState<Weekday[]>([]);
  const [days, setDays] = useState<number>(0);
  const [requestMessage, setRequestMessage] = useState("");
  const [hasRecordsError, setHasRecordsError] = useState(false);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        setHasRecordsError(false);
        const response = await fetch(`${apiBaseUrl}/training_records`, {
          credentials: "include",
        });

        if (!response.ok) {
          setHasRecordsError(true);
          return;
        }

        const data = (await response.json()) as TrainingRecordsResponse;
        setTrainingRecords(data.training_records);
      } catch {
        setHasRecordsError(true);
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

      const response = await fetch(`${apiBaseUrl}/training_records`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        showToast("トレーニング予定の生成に失敗しました。");
        return;
      }

      const data = (await response.json()) as TrainingRecordsResponse;
      setTrainingRecords(data.training_records);
      setOpen(false);
      showToast("トレーニング予定を生成しました。", "success");
    } catch {
      showToast("トレーニング予定の生成に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 p-6">
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
      ) : hasRecordsError ? (
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
            <Card key={record.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{record.date}</CardTitle>
                    <CardDescription>
                      {record.training_type}
                    </CardDescription>
                  </div>
                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600">
                    {record.completed ? "完了" : "未完了"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-neutral-700">
                <p>{record.description}</p>
                <dl className="space-y-2">
                  <div className="flex justify-between gap-4 border-t border-neutral-100 pt-2">
                    <dt className="text-neutral-500">距離</dt>
                    <dd>{record.distance_km === null ? "-" : `${record.distance_km} km`}</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-neutral-100 pt-2">
                    <dt className="text-neutral-500">時間</dt>
                    <dd>
                      {record.duration_minutes === null
                        ? "-"
                        : `${record.duration_minutes} 分`}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-neutral-100 pt-2">
                    <dt className="text-neutral-500">ペース</dt>
                    <dd>{record.pace ?? "-"}</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-neutral-100 pt-2">
                    <dt className="text-neutral-500">メモ</dt>
                    <dd className="text-right">{record.notes ?? "-"}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
