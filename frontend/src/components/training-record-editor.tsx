"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateTrainingRecord } from "@/lib/api/training-records";
import { trainingToday } from "@/lib/date";
import type { TrainingRecord } from "@/types/training-records";

type Props = {
  record: TrainingRecord;
  onSaved: (record: TrainingRecord) => void;
};

export function TrainingRecordEditor({ record, onSaved }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [feedback, setFeedback] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (record.training_type === "rest" || record.date > trainingToday())
    return null;

  const save = async (completed: boolean) => {
    setPending(true);
    setError(null);
    try {
      const result = await updateTrainingRecord(record.id, {
        completed,
        actual_distance_km: distance === "" ? null : Number(distance),
        actual_duration_minutes: duration === "" ? null : Number(duration),
        feedback: feedback.trim(),
      });
      if (!result.trainingRecord) {
        setError(result.error ?? "実績を保存できませんでした。");
        return;
      }
      onSaved(result.trainingRecord);
      router.refresh();
      setOpen(false);
    } catch {
      setError("通信に失敗しました。入力内容はそのままで、再試行できます。");
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (pending) return;
        if (nextOpen) {
          setDistance(
            String(record.actual_distance_km ?? record.distance_km ?? ""),
          );
          setDuration(
            String(
              record.actual_duration_minutes ?? record.duration_minutes ?? "",
            ),
          );
          setFeedback(record.feedback ?? "");
          setError(null);
        }
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger render={<Button className="min-h-11" />}>
        {record.completed ? "実績を編集" : "実績を記録"}
      </DialogTrigger>
      <DialogContent
        showCloseButton={!pending}
        className="max-h-[90dvh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>{record.date} の実績</DialogTitle>
          <DialogDescription>
            予定の距離・時間を初期表示しています。実際に走った内容に直して保存してください。予定は変更されません。
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void save(true);
          }}
        >
          <div className="space-y-2">
            <label
              htmlFor={`distance-${record.id}`}
              className="block font-medium"
            >
              走った距離（km）
            </label>
            <input
              id={`distance-${record.id}`}
              type="number"
              min="0"
              max="999.99"
              step="0.01"
              required
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              disabled={pending}
              className="w-full rounded-lg border p-3"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor={`duration-${record.id}`}
              className="block font-medium"
            >
              走った時間（分）
            </label>
            <input
              id={`duration-${record.id}`}
              type="number"
              min="1"
              max="1440"
              step="1"
              required
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              disabled={pending}
              className="w-full rounded-lg border p-3"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor={`feedback-${record.id}`}
              className="block font-medium"
            >
              振り返り（任意）
            </label>
            <textarea
              id={`feedback-${record.id}`}
              maxLength={2000}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              disabled={pending}
              className="min-h-24 w-full rounded-lg border p-3"
              placeholder="体の調子、きつさ、次回意識したいことなど"
            />
          </div>
          {error && (
            <p role="alert" className="text-red-700">
              {error}
            </p>
          )}
          <DialogFooter>
            {record.completed && (
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => void save(false)}
              >
                完了を取り消す
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              戻る
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "保存中…" : "実績を保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
