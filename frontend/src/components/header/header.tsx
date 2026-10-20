"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrentUser, logout } from "@/lib/api/session";
import { LoginButton } from "@/components/auth/login-button";
import type { CurrentUser } from "@/types/session";

export default function Header() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  useEffect(() => {
    void getCurrentUser()
      .then(setUser)
      .catch(() =>
        setError(
          "ログイン状態を確認できません。ページを再読み込みしてください。",
        ),
      )
      .finally(() => setLoading(false));
    if (new URLSearchParams(window.location.search).has("auth_error")) {
      Promise.resolve().then(() =>
        setError(
          "Googleログインを完了できませんでした。もう一度ログインしてください。",
        ),
      );
    }
  }, []);
  return (
    <header className="w-full bg-blue-700 text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-2xl font-semibold"
        >
          <Image src="/icon.png" alt="" width={40} height={40} />
          RunAI
        </Link>
        <nav
          aria-label="メインナビゲーション"
          className="flex flex-wrap items-center gap-2 text-sm sm:gap-4"
        >
          <Link href="/" className="inline-flex min-h-11 items-center">
            ホーム
          </Link>
          <Link href="/schedule" className="inline-flex min-h-11 items-center">
            予定・記録
          </Link>
          <Link
            href="/statistics"
            className="inline-flex min-h-11 items-center"
          >
            振り返り
          </Link>
          {loading ? (
            <span role="status">確認中…</span>
          ) : user ? (
            <>
              <Link
                href="/profile"
                className="inline-flex min-h-11 items-center"
              >
                目標・プロフィール
              </Link>
              <button
                type="button"
                disabled={loggingOut}
                className="min-h-11 cursor-pointer disabled:opacity-60"
                onClick={async () => {
                  setLoggingOut(true);
                  try {
                    if (await logout()) {
                      window.location.replace("/");
                      return;
                    }
                    setError(
                      "ログアウトできませんでした。もう一度お試しください。",
                    );
                  } catch {
                    setError(
                      "ログアウトできませんでした。通信状況を確認してください。",
                    );
                  }
                  setLoggingOut(false);
                }}
              >
                {loggingOut ? "ログアウト中…" : "ログアウト"}
              </button>
            </>
          ) : (
            <LoginButton />
          )}
        </nav>
      </div>
      {error && (
        <p role="alert" className="bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}
    </header>
  );
}
