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
    <main className="mx-auto w-full max-w-3xl space-y-5 p-6 py-12">
      <h1 className="text-3xl font-semibold">
        大会までの練習を、毎日の記録へ。
      </h1>
      <p className="text-neutral-600">
        目標レースと走れる曜日に合わせて予定を作り、走った距離・時間・感想を残しましょう。
      </p>
      <ol className="grid gap-3 sm:grid-cols-3">
        <li className="rounded-xl border p-4">1. 目標を登録</li>
        <li className="rounded-xl border p-4">2. 練習予定を作成</li>
        <li className="rounded-xl border p-4">3. 実績を記録して振り返る</li>
      </ol>
      <LoginButton />
    </main>
  );
}
