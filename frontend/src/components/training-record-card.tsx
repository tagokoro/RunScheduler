import type { ReactNode } from "react";

import { RunningTrack } from "@/components/running-track";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatJapaneseDate } from "@/lib/date";
import { trainingTypeLabel } from "@/lib/training";
import { cn } from "@/lib/utils";
import type { TrainingRecord } from "@/types/training-records";

type TrainingRecordCardProps = {
  record: TrainingRecord;
  footer?: ReactNode;
  emphasis?: "default" | "highlighted";
};

export function TrainingRecordCard({
  record,
  footer,
  emphasis = "default",
}: TrainingRecordCardProps) {
  const isHighlighted = emphasis === "highlighted";

  return (
    <Card
      className={cn(
        "overflow-hidden",
        isHighlighted
          ? "training-feature relative h-full rounded-3xl border-0 bg-ink text-white shadow-[0_12px_32px_-20px_#172c35]"
          : "border-t-[3px] border-t-[#d4dcc2]",
      )}
    >
      {isHighlighted && (
        <RunningTrack className="absolute -right-24 -top-16 w-[490px] text-white/10" />
      )}
      <CardHeader
        className={cn("relative", isHighlighted && "p-6 pb-4 sm:p-8 sm:pb-4")}
      >
        {isHighlighted && (
          <p className="mb-4 flex items-center gap-2 text-xs font-medium tracking-[0.15em] text-citrus">
            <span className="size-1.5 rounded-full bg-citrus" />
            TODAY’S TRAINING
          </p>
        )}
        <div className="flex items-start justify-between gap-3">
          <div>
            {isHighlighted ? (
              <>
                <CardTitle className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  {trainingTypeLabel(record.training_type)}
                </CardTitle>
                <CardDescription className="mt-2 text-white/55">
                  {formatJapaneseDate(record.date)}
                </CardDescription>
              </>
            ) : (
              <>
                <CardTitle>{formatJapaneseDate(record.date)}</CardTitle>
                <CardDescription>
                  {trainingTypeLabel(record.training_type)}
                </CardDescription>
              </>
            )}
          </div>
          <Badge
            variant={isHighlighted ? "accent" : "default"}
            className={
              isHighlighted
                ? "bg-citrus text-ink"
                : record.completed
                  ? "bg-emerald-50 text-emerald-700"
                  : undefined
            }
          >
            {record.training_type === "rest"
              ? "休養日"
              : record.completed
                ? "実施済み"
                : "予定"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent
        className={cn(
          "relative space-y-4 text-sm",
          isHighlighted
            ? "px-6 pb-6 text-white sm:px-8 sm:pb-8"
            : "text-slate-700",
        )}
      >
        <p
          className={cn(
            "whitespace-pre-wrap break-words leading-7",
            isHighlighted ? "max-w-md text-white/75" : "text-slate-700",
          )}
        >
          {record.description}
        </p>
        {record.training_type !== "rest" && (
          <dl
            className={cn(
              "grid grid-cols-3 gap-2 rounded-2xl",
              isHighlighted
                ? "border-y border-white/15 py-5"
                : "bg-slate-50 p-3",
            )}
          >
            <div>
              <dt
                className={cn(
                  "text-xs",
                  isHighlighted ? "text-white/55" : "text-slate-500",
                )}
              >
                予定の距離
              </dt>
              <dd
                className={cn(
                  "mt-2 font-semibold tabular-nums",
                  isHighlighted
                    ? "text-2xl tracking-tight text-white sm:text-3xl"
                    : "text-slate-900",
                )}
              >
                {record.distance_km === null ? "—" : `${record.distance_km} km`}
              </dd>
            </div>
            <div>
              <dt
                className={cn(
                  "text-xs",
                  isHighlighted ? "text-white/55" : "text-slate-500",
                )}
              >
                予定の時間
              </dt>
              <dd
                className={cn(
                  "mt-2 font-semibold tabular-nums",
                  isHighlighted
                    ? "text-2xl tracking-tight text-white sm:text-3xl"
                    : "text-slate-900",
                )}
              >
                {record.duration_minutes === null
                  ? "—"
                  : `${record.duration_minutes} 分`}
              </dd>
            </div>
            <div>
              <dt
                className={cn(
                  "text-xs",
                  isHighlighted ? "text-white/55" : "text-slate-500",
                )}
              >
                ペース
              </dt>
              <dd
                className={cn(
                  "mt-2 break-words font-semibold tabular-nums",
                  isHighlighted ? "text-white" : "text-slate-900",
                )}
              >
                {record.pace || "—"}
              </dd>
            </div>
          </dl>
        )}
        {record.notes && (
          <p
            className={cn(
              "whitespace-pre-wrap break-words border-l-2 pl-3 text-xs leading-6",
              isHighlighted
                ? "border-citrus/50 text-white/60"
                : "border-slate-200 text-slate-500",
            )}
          >
            {record.notes}
          </p>
        )}
        {record.completed && (
          <div
            className={cn(
              "space-y-2 rounded-xl border p-3",
              isHighlighted
                ? "border-white/10 bg-white/5 text-citrus"
                : "border-emerald-100 bg-emerald-50/60 text-emerald-900",
            )}
          >
            <p className="font-medium">
              実績: {record.actual_distance_km ?? record.distance_km ?? "-"} km
              /{" "}
              {record.actual_duration_minutes ?? record.duration_minutes ?? "-"}{" "}
              分
            </p>
            {record.actual_distance_km == null && (
              <p className="text-xs">
                実績未入力のため予定値を表示しています。「実績を編集」で修正できます。
              </p>
            )}
            {record.feedback && (
              <p className="whitespace-pre-wrap break-words">
                振り返り: {record.feedback}
              </p>
            )}
          </div>
        )}
        {footer ? (
          <div
            className={cn(
              "flex flex-wrap justify-end gap-2 border-t pt-4",
              isHighlighted ? "border-white/15" : "border-slate-100",
            )}
          >
            {footer}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
