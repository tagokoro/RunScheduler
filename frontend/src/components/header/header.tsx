"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { getCurrentUser, logout } from "@/lib/api/session";
import { LoginButton } from "@/components/auth/login-button";
import type { CurrentUser } from "@/types/session";

export default function Header() {
  const pathname = usePathname();
  const navClass = (href: string) =>
    cn(
      "inline-flex min-h-10 items-center rounded-lg px-2 text-sm font-medium transition-colors sm:px-3 hover:bg-black/5",
      (href === "/" ? pathname === href : pathname.startsWith(href))
        ? "bg-ink text-white hover:bg-ink-soft"
        : "text-slate-600",
    );
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
    <header className="relative w-full border-b border-black/5 bg-background">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight text-ink"
        >
          <Image src="/icon.png" alt="" width={32} height={32} />
          RunAI
        </Link>
        <nav
          aria-label="メインナビゲーション"
          className="flex w-full flex-wrap items-center gap-1 text-sm sm:w-auto"
        >
          <Link
            href="/"
            aria-current={pathname === "/" ? "page" : undefined}
            className={navClass("/")}
          >
            ホーム
          </Link>
          <Link
            href="/schedule"
            aria-current={pathname === "/schedule" ? "page" : undefined}
            className={navClass("/schedule")}
          >
            予定・記録
          </Link>
          <Link
            href="/statistics"
            aria-current={
              pathname.startsWith("/statistics") ? "page" : undefined
            }
            className={navClass("/statistics")}
          >
            統計
          </Link>
          {loading ? (
            <span role="status">確認中…</span>
          ) : user ? (
            <>
              <Link
                href="/profile"
                aria-label="目標・プロフィール"
                aria-current={
                  pathname.startsWith("/profile") ? "page" : undefined
                }
                className={navClass("/profile")}
              >
                <span className="sm:hidden">目標設定</span>
                <span className="hidden sm:inline">目標・プロフィール</span>
              </Link>
              <button
                type="button"
                disabled={loggingOut}
                className="absolute right-4 top-3 min-h-10 cursor-pointer rounded-lg px-3 text-xs sm:static text-slate-500 hover:bg-black/5 hover:text-slate-900 disabled:opacity-60"
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
