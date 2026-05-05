import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TrainingRecord } from "@/types/training-records";

type TrainingRecordCardProps = {
  record: TrainingRecord;
  footer?: ReactNode;
};

export function TrainingRecordCard({
  record,
  footer,
}: TrainingRecordCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{record.date}</CardTitle>
            <CardDescription>{record.training_type}</CardDescription>
          </div>
          <Badge>
            {record.completed ? "完了" : "未完了"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-neutral-700">
        <p>{record.description}</p>
        <dl className="space-y-2">
          <div className="flex justify-between gap-4 border-t border-neutral-100 pt-2">
            <dt className="text-neutral-500">距離</dt>
            <dd>
              {record.distance_km === null ? "-" : `${record.distance_km} km`}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-neutral-100 pt-2">
            <dt className="text-neutral-500">時間</dt>
            <dd>
              {record.duration_minutes === null
                ? "-"
                : `${record.duration_minutes} 分`}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-neutral-100 pt-2">
            <dt className="text-neutral-500">ペース</dt>
            <dd>{record.pace ?? "-"}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-neutral-100 pt-2">
            <dt className="text-neutral-500">メモ</dt>
            <dd className="text-right">{record.notes ?? "-"}</dd>
          </div>
        </dl>
        {footer ? <div className="flex justify-end">{footer}</div> : null}
      </CardContent>
    </Card>
  );
}
