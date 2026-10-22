"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { proposeWeeklyPlan, saveWeeklyPlan } from "@/lib/api/weekly-plan";
import {
  formatJapaneseDate,
  trainingToday,
  addDaysToDateString,
  formatDateString,
} from "@/lib/date";
import { trainingTypeLabel } from "@/lib/training";
import type { WeeklyPlanProposal } from "@/types/weekly-plan";
import type { TrainingRecord } from "@/types/training-records";

export function WeeklyPlanDialog({
  configured,
  onSaved,
}: {
  configured: boolean;
  onSaved: (
    records: TrainingRecord[],
    startDate: string,
    endDate: string,
  ) => void;
}) {
  const [open, setOpen] = useState(false);
  const [proposal, setProposal] = useState<WeeklyPlanProposal | null>(null);
  const [pending, setPending] = useState<"propose" | "save" | null>(null);
  const busy = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const start = trainingToday();
  const end = formatDateString(addDaysToDateString(start, 6));
  const propose = async () => {
    if (busy.current) return;
    busy.current = true;
    setPending("propose");
    setError(null);
    try {
      setProposal(await proposeWeeklyPlan());
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "提案を取得できませんでした。",
      );
    } finally {
      busy.current = false;
      setPending(null);
    }
  };
  const save = async () => {
    if (!proposal || busy.current) return;
    busy.current = true;
    setPending("save");
    setError(null);
    try {
      onSaved(
        await saveWeeklyPlan(proposal.proposal_token),
        proposal.start_date,
        proposal.end_date,
      );
      setOpen(false);
      setProposal(null);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "保存できませんでした。再試行してください。",
      );
    } finally {
      busy.current = false;
      setPending(null);
    }
  };
  if (!configured)
    return (
      <Link
        href="/profile/edit#weekly-schedule"
        className="text-blue-700 underline"
      >
        普段の練習スケジュールを登録
      </Link>
    );
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (busy.current) return;
        setOpen(nextOpen);
        setProposal(null);
        setError(null);
      }}
    >
      <DialogTrigger render={<Button size="sm" />}>
        1週間の予定を提案
      </DialogTrigger>
      <DialogContent
        className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl"
        showCloseButton={!pending}
      >
        <DialogHeader>
          <DialogTitle>
            {proposal ? "提案を確認して保存" : "1週間の予定を提案"}
          </DialogTitle>
          <DialogDescription>
            {formatJapaneseDate(proposal?.start_date ?? start)} 〜{" "}
            {formatJapaneseDate(proposal?.end_date ?? end)}（7日間）
            <br />
            普段の練習スケジュールと直近28日間の実績を参考にします。時間は上限です。保存するまでは既存予定を変更しません。
          </DialogDescription>
        </DialogHeader>
        {proposal && (
          <div className="space-y-3">
            <p className="text-sm text-neutral-600">
              参照した完了実績: {proposal.recent_activity_count}
              件。提案の有効期限は1時間です。既存の未実施予定は下記の内容へ置き換わります。
            </p>
            {proposal.days.map((day) => (
              <article
                key={day.date}
                className="space-y-2 rounded-xl border p-3"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <h3 className="font-semibold">
                    {formatJapaneseDate(day.date)}
                  </h3>
                  <span className="text-sm">
                    {day.action === "retain"
                      ? "実績あり・保持"
                      : day.action === "replace"
                        ? "既存予定を置換"
                        : "新規"}
                  </span>
                </div>
                <p className="text-sm text-neutral-600">
                  利用可能:{" "}
                  {day.available_minutes === 0
                    ? "休み"
                    : `${day.available_minutes}分まで`}
                  {day.action === "retain"
                    ? "（既存記録は時間設定にかかわらず保持）"
                    : ""}
                </p>
                <p>
                  {trainingTypeLabel(day.record.training_type)} /{" "}
                  {day.record.duration_minutes ?? 0}分
                </p>
                <p className="text-sm">{day.record.description}</p>
                {day.record.distance_km != null && (
                  <p className="text-sm">
                    {day.record.distance_km} km {day.record.pace}
                  </p>
                )}
                {day.record.notes && (
                  <p className="text-sm text-neutral-600">{day.record.notes}</p>
                )}
              </article>
            ))}
          </div>
        )}
        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        {pending && (
          <p role="status">
            {pending === "propose"
              ? "予定を提案しています。1分ほどかかる場合があります。"
              : "予定を保存しています…"}
          </p>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            disabled={pending !== null}
            onClick={() => {
              setOpen(false);
              setProposal(null);
              setError(null);
            }}
          >
            キャンセル
          </Button>
          <Button
            variant={proposal ? "outline" : "default"}
            disabled={pending !== null}
            onClick={() => void propose()}
          >
            {proposal ? "再提案する" : "提案を作成"}
          </Button>
          {proposal && (
            <Button disabled={pending !== null} onClick={() => void save()}>
              この内容で保存
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
