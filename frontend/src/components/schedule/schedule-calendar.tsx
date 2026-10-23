"use client";

import { ja } from "date-fns/locale";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeftIcon, ArrowRightIcon } from "@hugeicons/core-free-icons";
import {
  DayButton as DayPickerDayButton,
  DayPicker,
  getDefaultClassNames,
  type DayButtonProps,
} from "react-day-picker";

import { Button } from "@/components/ui/button";
import {
  formatDateString,
  parseDateString,
  formatJapaneseDate,
} from "@/lib/date";
import { trainingTypeLabel } from "@/lib/training";
import { cn } from "@/lib/utils";
import type { TrainingRecord } from "@/types/training-records";

type ScheduleCalendarProps = {
  month: Date;
  selectedDate: Date;
  todayDateString: string;
  recordsByDate: Map<string, TrainingRecord>;
  onMonthChange: (month: Date) => void;
  onSelectDate: (date: Date) => void;
};

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

const getMonthTitle = (date: Date) =>
  `${date.getFullYear()}年 ${date.getMonth() + 1}月`;

export function ScheduleCalendar({
  month,
  selectedDate,
  todayDateString,
  recordsByDate,
  onMonthChange,
  onSelectDate,
}: ScheduleCalendarProps) {
  const defaultClassNames = getDefaultClassNames();

  const ScheduleDayButton = (props: DayButtonProps) => {
    const record = recordsByDate.get(formatDateString(props.day.date)) ?? null;

    return (
      <DayPickerDayButton
        {...props}
        className={cn(
          "flex h-16 w-full cursor-pointer flex-col items-start justify-start gap-1.5 rounded-xl border border-slate-100 bg-slate-50/60 p-1.5 text-left transition-colors hover:border-primary/20 hover:bg-primary/5 sm:h-24 sm:p-2",
          props.modifiers.selected &&
            "border-primary/50 bg-[#fff1e8] ring-1 ring-primary/30",
          !props.modifiers.selected &&
            formatDateString(props.day.date) === todayDateString &&
            "border-primary/20",
        )}
      >
        <div className="flex w-full items-center justify-between">
          <span className="text-sm font-medium">
            {props.day.date.getDate()}
          </span>
          {record && (
            <span
              aria-hidden="true"
              className={cn(
                "size-1.5 shrink-0 rounded-full sm:hidden",
                record.completed
                  ? "bg-emerald-500"
                  : record.training_type === "rest"
                    ? "bg-slate-300"
                    : "bg-primary",
              )}
            />
          )}
          {record ? (
            <span
              className={cn(
                "hidden text-xs sm:inline",
                record.completed ? "text-emerald-700" : "text-neutral-500",
              )}
            >
              {record.completed ? "完了" : "予定"}
            </span>
          ) : null}
        </div>
        <span className="line-clamp-2 break-words text-[10px] leading-4 text-slate-600 sm:text-xs">
          {record && (
            <>
              <span className="hidden sm:inline">
                {trainingTypeLabel(record.training_type)}
              </span>
              <span className="sm:hidden">
                {record.training_type === "rest"
                  ? "休養"
                  : record.training_type === "race"
                    ? "大会"
                    : record.duration_minutes
                      ? `${record.duration_minutes}分`
                      : "練習"}
              </span>
            </>
          )}
        </span>
      </DayPickerDayButton>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const today = parseDateString(todayDateString);
            onMonthChange(new Date(today.getFullYear(), today.getMonth(), 1));
            onSelectDate(today);
          }}
        >
          今日
        </Button>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="前の月"
            onClick={() =>
              onMonthChange(
                new Date(month.getFullYear(), month.getMonth() - 1, 1),
              )
            }
          >
            <HugeiconsIcon
              icon={ArrowLeftIcon}
              strokeWidth={2}
              className="size-4"
            />
          </Button>
          <p className="min-w-28 text-center text-sm font-semibold text-slate-900">
            {getMonthTitle(month)}
          </p>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="次の月"
            onClick={() =>
              onMonthChange(
                new Date(month.getFullYear(), month.getMonth() + 1, 1),
              )
            }
          >
            <HugeiconsIcon
              icon={ArrowRightIcon}
              strokeWidth={2}
              className="size-4"
            />
          </Button>
        </div>
      </div>

      <DayPicker
        locale={ja}
        labels={{
          labelDayButton: (date, modifiers) => {
            const record = recordsByDate.get(formatDateString(date));
            return [
              formatJapaneseDate(formatDateString(date)),
              modifiers.today ? "今日" : "",
              modifiers.selected ? "選択中" : "",
              record
                ? `${trainingTypeLabel(record.training_type)}、${record.completed ? "完了" : "予定"}`
                : "",
            ]
              .filter(Boolean)
              .join("、");
          },
        }}
        mode="single"
        month={month}
        selected={selectedDate}
        onMonthChange={onMonthChange}
        onSelect={(date) => {
          if (!date) {
            return;
          }

          onSelectDate(date);
        }}
        hideNavigation
        formatters={{
          formatWeekdayName: (date) => WEEKDAY_LABELS[date.getDay()] ?? "",
        }}
        className="w-full"
        classNames={{
          root: cn("w-full", defaultClassNames.root),
          months: cn("w-full", defaultClassNames.months),
          month: cn("w-full", defaultClassNames.month),
          month_caption: "hidden",
          month_grid: cn(
            "w-full border-collapse",
            defaultClassNames.month_grid,
          ),
          weekdays: cn("grid grid-cols-7", defaultClassNames.weekdays),
          weekday: cn(
            "py-2 text-center text-xs font-medium text-slate-400",
            defaultClassNames.weekday,
          ),
          week: cn(
            "mt-2 grid grid-cols-7 gap-1 sm:gap-2",
            defaultClassNames.week,
          ),
          day: cn("w-full", defaultClassNames.day),
          hidden: cn("invisible", defaultClassNames.hidden),
          outside: cn("text-neutral-300 opacity-50", defaultClassNames.outside),
        }}
        components={{
          DayButton: ScheduleDayButton,
        }}
      />
    </div>
  );
}
