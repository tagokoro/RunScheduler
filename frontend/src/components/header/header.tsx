"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { getCurrentUser, loginWithGoogle, logout } from "@/lib/api/session";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuContent,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { CurrentUser } from "@/types/session";

export default function Header() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    };

    void fetchCurrentUser();
  }, []);

  const handleLogout = async () => {
    setAuthError(null);
    try {
      if (await logout()) setUser(null);
      else setAuthError("ログアウトに失敗しました。");
    } catch {
      setAuthError("ログアウトに失敗しました。");
    }
  };

  const handleLogin = async () => {
    setAuthError(null);
    setIsLoggingIn(true);
    try {
      await loginWithGoogle();
    } catch {
      setAuthError("ログインを開始できませんでした。");
      setIsLoggingIn(false);
    }
  };

  return (
    <header className="h-20 w-full bg-blue-700">
      <div className="relative mx-auto flex h-full w-full items-center px-6">
        <div className="flex flex-1 justify-start">
          <NavigationMenu>
            <NavigationMenuList className="flex gap-3">
              <NavigationMenuItem></NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Link
            href="/"
            className="flex h-11 items-center gap-2 rounded-lg px-3 font-heading text-3xl font-semibold text-white"
          >
            <Image
              src="/icon.png"
              alt="RunAI logo"
              width={50}
              height={50}
              className="size-10"
              priority
            />
            <span>RunAI</span>
          </Link>
        </div>

        <div className="flex flex-1 justify-end">
          <NavigationMenu>
            <NavigationMenuList className="flex gap-6 text-white text-xl">
              <NavigationMenuItem>
                <Link href="/">Home</Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/schedule">Schedule</Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/statistics">Statistics</Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                {user?.id != null ? (
                  <>
                    <NavigationMenuTrigger>
                      <Avatar className="h-9 w-9">
                        {user?.image ? (
                          <AvatarImage
                            src={user.image}
                            alt={user.name ?? user.email ?? "User avatar"}
                          />
                        ) : (
                          <AvatarFallback>
                            {user?.name?.slice(0, 1) ??
                              user?.email?.slice(0, 1) ??
                              "R"}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="bg-blue-50">
                      <ul className="w-48 gap-3 text-lg">
                        <li>
                          <Link href="/profile">Profile</Link>
                        </li>
                        <li>
                          <button type="button" onClick={handleLogout}>
                            SignOut
                          </button>
                        </li>
                      </ul>
                    </NavigationMenuContent>
                  </>
                ) : (
                  <button
                    type="button"
                    className="hover:bg-white/15"
                    onClick={handleLogin}
                    disabled={isLoggingIn}
                  >
                    Login
                  </button>
                )}
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>
      {authError && <p role="alert">{authError}</p>}
    </header>
  );
}
