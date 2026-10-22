"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { loginWithGoogle } from "@/lib/api/session";

export function LoginButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      <Button
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          try {
            await loginWithGoogle();
          } catch {
            setError(
              "ログインを開始できませんでした。もう一度お試しください。",
            );
            setPending(false);
          }
        }}
      >
        {pending ? "ログインを開始しています…" : "Googleでログイン"}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function LoginPrompt() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-12">
        <p className="mb-5 text-xs font-semibold tracking-widest text-blue-700">
          マラソンに向けた練習管理
        </p>
        <h1 className="max-w-2xl text-3xl font-semibold leading-relaxed tracking-tight text-slate-900 sm:text-4xl">
          大会までの練習を、
          <br />
          毎日の記録へ。
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-8 text-slate-500">
          目標レースと走れる曜日に合わせて予定を作り、走った距離・時間・感想を残しましょう。
        </p>
        <div className="mt-7">
          <LoginButton />
        </div>
        <ol className="mt-10 grid gap-4 border-t border-slate-100 pt-7 sm:grid-cols-3">
          {[
            ["01", "目標を登録", "大会と、普段走れる曜日・時間を設定。"],
            ["02", "練習予定を作成", "大会までの提案を確認して、計画へ。"],
            [
              "03",
              "実績を記録して振り返る",
              "距離・時間・感想を、自分の記録に。",
            ],
          ].map(([step, title, description]) => (
            <li key={step} className="rounded-2xl bg-slate-50 p-5">
              <span className="text-xs font-semibold tabular-nums text-blue-600">
                {step}
              </span>
              <h2 className="mt-3 text-sm font-semibold text-slate-900">
                {title}
              </h2>
              <p className="mt-2 text-xs leading-6 text-slate-500">
                {description}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
