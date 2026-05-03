"use client";

import { useState } from "react";

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
import type { TrainingRecordsResponse, Weekday } from "@/types/training-plan";
import { WEEKDAYS } from "@/types/training-plan";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function Home() {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedWeekdays, setSelectedWeekdays] = useState<Weekday[]>([]);
  const [days, setDays] = useState<number>(0);
  const [requestMessage, setRequestMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleWeekday = (weekday: Weekday) => {
    setSelectedWeekdays((current) =>
      current.includes(weekday)
        ? current.filter((value) => value !== weekday)
        : [...current, weekday],
    );
  };

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
      const response = await fetch(`${apiBaseUrl}/training_plans`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          days,
          training_days: selectedWeekdays,
          request_message: requestMessage.trim() || undefined,
        }),
      });

      if (!response.ok) {
        showToast("トレーニング予定の生成に失敗しました。");
        return;
      }

      (await response.json()) as TrainingRecordsResponse;
      setOpen(false);
      showToast("トレーニング予定を生成しました。", "success");
    } catch {
      showToast("トレーニング予定の生成に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="p-6">
      <div className="flex justify-end">
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
                htmlFor="training-plan-days"
                className="block text-sm font-medium"
              >
                生成日数
              </label>
              <input
                id="training-plan-days"
                type="number"
                min={1}
                value={days}
                onChange={(event) => setDays(Number(event.target.value))}
                className="w-full rounded-md border px-3 py-2"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="training-plan-request"
                className="block text-sm font-medium"
              >
                要望
              </label>
              <textarea
                id="training-plan-request"
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
    </main>
  );
}
