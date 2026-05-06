"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeftIcon, ArrowRightIcon } from "@hugeicons/core-free-icons";
import {
  DayButton as DayPickerDayButton,
  DayPicker,
  getDefaultClassNames,
  type DayButtonProps,
} from "react-day-picker";

import { Button } from "@/components/ui/button";
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

const getDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

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
    const record = recordsByDate.get(getDateString(props.day.date)) ?? null;

    return (
      <DayPickerDayButton
        {...props}
        className={cn(
          "flex min-h-20 w-full flex-col items-start justify-start gap-2 rounded-lg border border-neutral-200 p-2 text-left",
          props.modifiers.selected && "border-orange-400 bg-orange-50",
          !props.modifiers.selected &&
            getDateString(props.day.date) === todayDateString &&
            "border-orange-200",
        )}
      >
        <div className="flex w-full items-center justify-between">
          <span className="text-sm font-medium">
            {props.day.date.getDate()}
          </span>
          {record ? (
            <span
              className={cn(
                "text-xs",
                record.completed ? "text-orange-700" : "text-neutral-500",
              )}
            >
              {record.completed ? "完了" : "予定"}
            </span>
          ) : null}
        </div>
        <span className="text-xs text-neutral-600">
          {record?.training_type ?? ""}
        </span>
      </DayPickerDayButton>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
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
        <p className="min-w-28 text-center text-sm font-medium">
          {getMonthTitle(month)}
        </p>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
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

      <DayPicker
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
            "text-center text-sm text-neutral-500",
            defaultClassNames.weekday,
          ),
          week: cn("mt-2 grid grid-cols-7 gap-2", defaultClassNames.week),
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
