"use client";

import Link from "next/link";
import { TrainingRecordCard } from "@/components/training-record-card";
import { TrainingRecordEditor } from "@/components/training-record-editor";
import { useMemo, useState } from "react";

import { ScheduleCalendar } from "@/components/schedule/schedule-calendar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatDateString,
  trainingToday,
  formatJapaneseDate,
  parseDateString,
} from "@/lib/date";
import { buildGoogleCalendarUrl } from "@/lib/google-calendar";
import { cn } from "@/lib/utils";
import type { TrainingRecord } from "@/types/training-records";

type ScheduleClientProps = {
  initialTrainingRecords: TrainingRecord[];
};

export function ScheduleClient({
  initialTrainingRecords,
}: ScheduleClientProps) {
  const [records, setRecords] = useState(initialTrainingRecords);
  const today = useMemo(() => parseDateString(trainingToday()), []);
  const todayDateString = useMemo(() => formatDateString(today), [today]);
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(todayDateString);

  const recordsByDate = useMemo(
    () => new Map(records.map((record) => [record.date, record] as const)),
    [records],
  );

  const selectedRecord = recordsByDate.get(selectedDate) ?? null;
  const selectedDateValue = useMemo(
    () => parseDateString(selectedDate),
    [selectedDate],
  );

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-widest text-blue-700">
          予定・記録
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          練習カレンダー
        </h1>
        <p className="text-sm leading-7 text-slate-500">
          計画を見渡して、一日ずつ記録を積み重ねましょう。
        </p>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[1.3fr_1fr]">
        <section aria-label="日付を選ぶ">
          <Card>
            <CardContent className="p-3 sm:p-5">
              <ScheduleCalendar
                month={visibleMonth}
                selectedDate={selectedDateValue}
                todayDateString={todayDateString}
                recordsByDate={recordsByDate}
                onMonthChange={setVisibleMonth}
                onSelectDate={(date) => setSelectedDate(formatDateString(date))}
              />
              <p className="mt-4 border-t border-slate-100 pt-4 text-xs leading-6 text-slate-500">
                日付を選ぶとメニューを確認できます。練習後は「実績を記録」から振り返りを残しましょう。
              </p>
            </CardContent>
          </Card>
        </section>
        <aside
          className="space-y-3 lg:sticky lg:top-6"
          aria-label="選択した日の練習"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <h2 className="text-base font-semibold text-slate-900">
              {formatJapaneseDate(selectedDate)}
            </h2>
            {selectedDate === todayDateString && (
              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                今日
              </span>
            )}
          </div>
          {selectedRecord ? (
            <>
              <TrainingRecordCard
                record={selectedRecord}
                footer={
                  <TrainingRecordEditor
                    key={selectedRecord.id}
                    record={selectedRecord}
                    onSaved={(updated) =>
                      setRecords((current) =>
                        current.map((record) =>
                          record.id === updated.id ? updated : record,
                        ),
                      )
                    }
                  />
                }
              />
              <a
                href={buildGoogleCalendarUrl(selectedRecord)}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "w-full text-slate-600",
                )}
              >
                Google カレンダーに追加 <span aria-hidden="true">↗</span>
              </a>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>この日はまだ予定がありません</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-7 text-slate-500">
                <p>
                  普段の練習スケジュールをもとに、大会までの計画を作成できます。
                </p>
                <Link
                  href="/"
                  className="inline-flex min-h-10 items-center font-medium text-blue-700 hover:underline"
                >
                  ホームで練習予定を作成する →
                </Link>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </main>
  );
}
