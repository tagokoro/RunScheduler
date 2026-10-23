"use client";

import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { TrainingRecordCard } from "@/components/training-record-card";
import { TrainingRecordEditor } from "@/components/training-record-editor";
import { getCarouselPage } from "@/lib/carousel";
import type { TrainingRecord } from "@/types/training-records";

const WIDE_LAYOUT = "(min-width: 768px)";
function subscribeToLayout(onChange: () => void) {
  const query = window.matchMedia(WIDE_LAYOUT);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
const isWideLayout = () => window.matchMedia(WIDE_LAYOUT).matches;
const serverLayout = () => false;

export function TrainingRecordCarousel({
  records,
  onSaved,
  onDelete,
}: {
  records: TrainingRecord[];
  onSaved: (record: TrainingRecord) => void;
  onDelete: (record: TrainingRecord) => void;
}) {
  const wide = useSyncExternalStore(
    subscribeToLayout,
    isWideLayout,
    serverLayout,
  );
  const [requestedStart, setRequestedStart] = useState(0);
  const pageSize = wide ? 2 : 1;
  const page = getCarouselPage(records.length, requestedStart, pageSize);
  if (records.length === 0) return null;

  return (
    <section
      aria-label="予定カード"
      aria-roledescription="カルーセル"
      className="space-y-3"
    >
      <div className="flex items-center justify-end gap-3">
        <p
          role="status"
          aria-atomic="true"
          className="text-xs tabular-nums text-slate-500"
        >
          {page.start + 1}
          {page.end > page.start + 1 ? `–${page.end}` : ""} / {records.length}件
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="前の予定"
            aria-controls="training-card-page"
            disabled={!page.hasPrevious}
            onClick={() => setRequestedStart(page.start - pageSize)}
          >
            <span aria-hidden="true">←</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="次の予定"
            aria-controls="training-card-page"
            disabled={!page.hasNext}
            onClick={() => setRequestedStart(page.start + pageSize)}
          >
            <span aria-hidden="true">→</span>
          </Button>
        </div>
      </div>
      <div
        id="training-card-page"
        className="grid items-start gap-4 md:grid-cols-2"
      >
        {records.slice(page.start, page.end).map((record) => (
          <TrainingRecordCard
            key={record.id}
            record={record}
            footer={
              <div className="flex flex-wrap gap-2">
                <TrainingRecordEditor record={record} onSaved={onSaved} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(record)}
                >
                  削除
                </Button>
              </div>
            }
          />
        ))}
      </div>
    </section>
  );
}
