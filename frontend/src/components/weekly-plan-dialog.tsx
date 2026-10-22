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
import { formatJapaneseDate, trainingToday } from "@/lib/date";
import { trainingTypeLabel } from "@/lib/training";
import type { WeeklyPlanProposal } from "@/types/weekly-plan";
import type { TrainingRecord } from "@/types/training-records";

export function WeeklyPlanDialog({
  configured,
  raceDate,
  onSaved,
}: {
  configured: boolean;
  raceDate: string | null;
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
  const generation = useRef<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null);
  const start = trainingToday();
  const end = proposal?.end_date ?? raceDate;
  const propose = async (restart = false) => {
    if (busy.current) return;
    busy.current = true;
    setPending("propose");
    setError(null);
    if (restart) setProposal(null);
    const controller = new AbortController();
    generation.current = controller;
    try {
      let next = !restart && proposal?.complete === false ? proposal : null;
      do {
        next = await proposeWeeklyPlan(next?.proposal_token, controller.signal);
        if (controller.signal.aborted) return;
        setProposal(next);
      } while (!next.complete);
    } catch (error) {
      if (controller.signal.aborted) return;
      setError(
        error instanceof Error ? error.message : "提案を取得できませんでした。",
      );
    } finally {
      generation.current = null;
      busy.current = false;
      setPending(null);
    }
  };
  const save = async () => {
    if (!proposal?.complete || busy.current) return;
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
        大会までの予定を提案
      </DialogTrigger>
      <DialogContent
        className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl"
        showCloseButton={!pending}
      >
        <DialogHeader>
          <DialogTitle>
            {proposal?.complete ? "提案を確認して保存" : "大会までの予定を提案"}
          </DialogTitle>
          <DialogDescription>
            {formatJapaneseDate(proposal?.start_date ?? start)} 〜{" "}
            {end ? formatJapaneseDate(end) : "大会日（未設定）"}
            <br />
            普段の練習スケジュールと直近28日間の実績を参考にします。時間は上限です。保存するまでは既存予定を変更しません。
          </DialogDescription>
        </DialogHeader>
        {!configured && (
          <div className="space-y-3 rounded-lg bg-blue-50 p-4 text-sm">
            <p>
              提案を作成するには、目標・プロフィールと7曜日すべての練習時間の設定が必要です。練習しない曜日は「休み」を選んでください。
            </p>
            <Link
              href="/profile/edit#weekly-schedule"
              className="text-blue-700 underline"
            >
              普段の練習スケジュールを設定する
            </Link>
          </div>
        )}
        <p className="text-sm text-neutral-600">
          曜日設定を毎週繰り返し、大会前日までの練習と大会当日の予定を提案します。大会当日は普段の練習時間の上限の対象外です。大会日は今日から366日以内に設定してください。
        </p>
        {proposal && (
          <div className="space-y-3">
            <p className="text-sm text-neutral-600">
              参照した完了実績: {proposal.recent_activity_count}
              件。生成済み: {proposal.days.length}
              日分。提案の有効期限は生成開始から1時間です。既存の未実施予定は下記の内容へ置き換わります。
            </p>
            {Array.from(
              { length: Math.ceil(proposal.days.length / 7) },
              (_, index) => proposal.days.slice(index * 7, index * 7 + 7),
            ).map((week, index) => (
              <details
                key={week[0].date}
                open={index === 0}
                className="rounded-xl border p-3"
              >
                <summary className="cursor-pointer font-medium">
                  {formatJapaneseDate(week[0].date)} 〜{" "}
                  {formatJapaneseDate(week[week.length - 1].date)}（
                  {week.length}日間）
                </summary>
                <div className="mt-3 space-y-3">
                  {week.map((day) => (
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
                        {day.available_minutes == null
                          ? "大会当日（練習時間の上限対象外）"
                          : day.available_minutes === 0
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
                        <p className="text-sm text-neutral-600">
                          {day.record.notes}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              </details>
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
              ? "大会までの予定を28日分ずつ提案しています。期間に応じて数分かかる場合があります。"
              : "予定を保存しています…"}
          </p>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            disabled={pending === "save"}
            onClick={() => {
              generation.current?.abort();
              setOpen(false);
              setProposal(null);
              setError(null);
            }}
          >
            キャンセル
          </Button>
          {configured && (
            <Button
              variant={proposal ? "outline" : "default"}
              disabled={pending !== null}
              onClick={() => void propose()}
            >
              {proposal
                ? proposal.complete
                  ? "再提案する"
                  : "続きから再試行"
                : "提案を作成"}
            </Button>
          )}
          {proposal && !proposal.complete && (
            <Button
              variant="outline"
              disabled={pending !== null}
              onClick={() => void propose(true)}
            >
              最初から再提案
            </Button>
          )}
          {proposal?.complete && (
            <Button disabled={pending !== null} onClick={() => void save()}>
              この内容で保存
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
