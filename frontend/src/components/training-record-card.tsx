import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <Card className={cn(isHighlighted && "border-orange-200 bg-orange-50")}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            {isHighlighted ? (
              <>
                <CardTitle>{record.training_type}</CardTitle>
                <CardDescription>{record.date}</CardDescription>
              </>
            ) : (
              <>
                <CardTitle>{record.date}</CardTitle>
                <CardDescription>{record.training_type}</CardDescription>
              </>
            )}
          </div>
          <Badge variant={isHighlighted ? "accent" : "default"}>
            {record.completed ? "完了" : "未完了"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-neutral-700">
        <p>{record.description}</p>
        <dl className="space-y-2">
          <div
            className={cn(
              "flex justify-between gap-4 pt-2",
              isHighlighted
                ? "border-t border-orange-200"
                : "border-t border-neutral-100",
            )}
          >
            <dt className="text-neutral-500">距離</dt>
            <dd>
              {record.distance_km === null ? "-" : `${record.distance_km} km`}
            </dd>
          </div>
          <div
            className={cn(
              "flex justify-between gap-4 pt-2",
              isHighlighted
                ? "border-t border-orange-200"
                : "border-t border-neutral-100",
            )}
          >
            <dt className="text-neutral-500">時間</dt>
            <dd>
              {record.duration_minutes === null
                ? "-"
                : `${record.duration_minutes} 分`}
            </dd>
          </div>
          <div
            className={cn(
              "flex justify-between gap-4 pt-2",
              isHighlighted
                ? "border-t border-orange-200"
                : "border-t border-neutral-100",
            )}
          >
            <dt className="text-neutral-500">ペース</dt>
            <dd>{record.pace ?? "-"}</dd>
          </div>
          <div
            className={cn(
              "flex justify-between gap-4 pt-2",
              isHighlighted
                ? "border-t border-orange-200"
                : "border-t border-neutral-100",
            )}
          >
            <dt className="text-neutral-500">メモ</dt>
            <dd className="text-right">{record.notes ?? "-"}</dd>
          </div>
        </dl>
        {footer ? <div className="flex justify-end">{footer}</div> : null}
      </CardContent>
    </Card>
  );
}
