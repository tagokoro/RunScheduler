"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-4 p-6 py-12">
      <h1 className="text-2xl font-semibold">データを読み込めませんでした</h1>
      <p role="alert">
        通信状況を確認して、もう一度お試しください。起動直後は時間がかかる場合があります。
      </p>
      <Button onClick={reset}>再試行する</Button>
    </main>
  );
}
