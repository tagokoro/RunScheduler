"use client";

import { useState } from "react";
import { RunningTrack } from "@/components/running-track";
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
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <section className="grid overflow-hidden rounded-[2rem] bg-ink lg:grid-cols-[1.5fr_1fr]">
        <div className="training-feature relative p-7 text-white sm:p-12">
          <p className="mb-7 flex items-center gap-2 text-xs font-semibold tracking-[0.17em] text-citrus">
            <span className="h-px w-5 bg-citrus" />
            MAKE EVERY RUN YOURS
          </p>
          <h1 className="text-3xl font-semibold leading-relaxed tracking-tight sm:text-5xl sm:leading-snug">
            大会までの練習を、
            <br />
            毎日の記録へ。
          </h1>
          <p className="mt-6 max-w-md text-sm leading-8 text-white/65">
            練習できる曜日・時間と大会日を登録すると、大会までの練習予定を提案します。走った距離・時間はカレンダーから記録できます。
          </p>
          <div className="mt-8">
            <LoginButton />
          </div>
        </div>
        <div className="relative flex min-h-56 items-end overflow-hidden bg-citrus p-7 sm:p-10">
          <RunningTrack className="absolute -right-16 -top-10 w-[420px] text-ink/25 lg:-right-24 lg:top-0 lg:w-[500px]" />
          <div className="relative">
            <p className="mb-3 text-xs font-semibold tracking-[0.15em] text-ink/60">
              YOUR PACE. YOUR RACE.
            </p>
            <p className="text-2xl font-semibold leading-relaxed text-ink">
              走れる日を、計画に。
              <br />
              走った日を、自信に。
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
