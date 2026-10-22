import type { ReactNode } from "react";

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
    <Card className={cn(isHighlighted && "border-blue-200 bg-blue-50/40")}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            {isHighlighted ? (
              <>
                <CardTitle>{trainingTypeLabel(record.training_type)}</CardTitle>
                <CardDescription>{record.date}</CardDescription>
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
              record.completed ? "bg-emerald-50 text-emerald-700" : undefined
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
      <CardContent className="space-y-3 text-sm text-neutral-700">
        <p className="whitespace-pre-wrap break-words leading-7 text-slate-700">
          {record.description}
        </p>
        {record.training_type !== "rest" && (
          <dl className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3">
            <div>
              <dt className="text-xs text-slate-500">予定の距離</dt>
              <dd className="mt-1 font-semibold tabular-nums text-slate-900">
                {record.distance_km === null ? "—" : `${record.distance_km} km`}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">予定の時間</dt>
              <dd className="mt-1 font-semibold tabular-nums text-slate-900">
                {record.duration_minutes === null
                  ? "—"
                  : `${record.duration_minutes} 分`}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">ペース</dt>
              <dd className="mt-1 break-words font-semibold tabular-nums text-slate-900">
                {record.pace || "—"}
              </dd>
            </div>
          </dl>
        )}
        {record.notes && (
          <p className="whitespace-pre-wrap break-words border-l-2 border-slate-200 pl-3 text-xs leading-6 text-slate-500">
            {record.notes}
          </p>
        )}
        {record.completed && (
          <div className="space-y-2 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-emerald-900">
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
          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
            {footer}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
