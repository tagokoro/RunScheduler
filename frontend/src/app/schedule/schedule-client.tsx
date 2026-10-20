"use client";

import Link from "next/link";
import { TrainingRecordCard } from "@/components/training-record-card";
import { TrainingRecordEditor } from "@/components/training-record-editor";
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
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 p-6">
      <section className="space-y-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            練習カレンダー
          </h1>
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
              <div className="space-y-3">
                <p>この日の練習予定はありません。</p>
                <Link href="/" className="text-blue-700 underline">
                  ホームで練習予定を作成する
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-neutral-900">日付を選ぶ</h2>

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
