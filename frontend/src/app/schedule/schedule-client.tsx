"use client";

import { useMemo, useState } from "react";

import { ScheduleCalendar } from "@/components/schedule/schedule-calendar";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateString, formatJapaneseDate, parseDateString } from "@/lib/date";
import { buildGoogleCalendarUrl } from "@/lib/google-calendar";
import { cn } from "@/lib/utils";
import type { TrainingRecord } from "@/types/training-records";

type ScheduleClientProps = {
  initialTrainingRecords: TrainingRecord[];
};

export function ScheduleClient({
  initialTrainingRecords,
}: ScheduleClientProps) {
  const today = useMemo(() => new Date(), []);
  const todayDateString = useMemo(() => formatDateString(today), [today]);
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(todayDateString);

  const recordsByDate = useMemo(
    () =>
      new Map(
        initialTrainingRecords.map((record) => [record.date, record] as const),
      ),
    [initialTrainingRecords],
  );

  const selectedRecord = recordsByDate.get(selectedDate) ?? null;
  const selectedDateValue = useMemo(
    () => parseDateString(selectedDate),
    [selectedDate],
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 p-6">
      <section className="space-y-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Schedule</h1>
          <p className="text-sm text-neutral-500">
            日付を選んで、その日のトレーニング内容を確認できます。
          </p>
        </div>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardDescription>
              {selectedDate === todayDateString ? "今日" : "選択中の日付"}
            </CardDescription>
            <CardTitle>{formatJapaneseDate(selectedDate)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-neutral-700">
            {selectedRecord ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-neutral-900">
                      {selectedRecord.training_type}
                    </p>
                    <p>{selectedRecord.description}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs text-orange-700">
                    {selectedRecord.completed ? "完了" : "未完了"}
                  </span>
                </div>
                <dl className="space-y-2">
                  <div className="flex justify-between gap-4 border-t border-orange-200 pt-2">
                    <dt className="text-neutral-500">距離</dt>
                    <dd>
                      {selectedRecord.distance_km === null
                        ? "-"
                        : `${selectedRecord.distance_km} km`}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-orange-200 pt-2">
                    <dt className="text-neutral-500">時間</dt>
                    <dd>
                      {selectedRecord.duration_minutes === null
                        ? "-"
                        : `${selectedRecord.duration_minutes} 分`}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-orange-200 pt-2">
                    <dt className="text-neutral-500">ペース</dt>
                    <dd>{selectedRecord.pace ?? "-"}</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-orange-200 pt-2">
                    <dt className="text-neutral-500">メモ</dt>
                    <dd>{selectedRecord.notes ?? "-"}</dd>
                  </div>
                </dl>
                <div className="flex justify-end border-t border-orange-200 pt-3">
                  <a
                    href={buildGoogleCalendarUrl(selectedRecord)}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "border-orange-200 bg-white text-orange-700 hover:bg-orange-100",
                    )}
                  >
                    Google カレンダーに追加
                  </a>
                </div>
              </>
            ) : (
              <p>この日のトレーニング予定はありません。</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-neutral-900">Calendar</h2>

        <Card>
          <CardContent className="p-2">
            <ScheduleCalendar
              month={visibleMonth}
              selectedDate={selectedDateValue}
              todayDateString={todayDateString}
              recordsByDate={recordsByDate}
              onMonthChange={setVisibleMonth}
              onSelectDate={(date) => setSelectedDate(formatDateString(date))}
            />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
