"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuContent,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const apiUrl = "http://localhost:3000";

type CurrentUser = {
  id: number;
  name: string | null;
  email: string | null;
  image: string | null;
};

type MeResponse = {
  user: CurrentUser;
};

export default function Header() {
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const response = await fetch(`${apiUrl}/me`, {
        credentials: "include",
      });

      if (!response.ok) {
        return;
      }

      const data: MeResponse = await response.json();
      setUser(data.user);
    };

    void fetchCurrentUser();
  }, []);

  const handlLogout = async() => {
    const response = await fetch(`${apiUrl}/logout`,{
      method: "DELETE",
      credentials: "include"
    });

    if(response.ok) setUser(null);
  }

  return (
    <header className="h-20 w-full bg-blue-700">
      <div className="relative mx-auto flex h-full max-w-6xl items-center px-6">
        <div className="flex flex-1 justify-start">
          <NavigationMenu>
            <NavigationMenuList className="flex gap-3">
              <NavigationMenuItem>
              </NavigationMenuItem>
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
            <NavigationMenuList className="flex gap-6 text-white text-lg">
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
                <Link href="/plans">Plan</Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                {user?.id != null ?
                  <>
                    <NavigationMenuTrigger>
                      <Avatar className="h-10 w-10">
                        {user?.image ? (
                          <AvatarImage
                            src={user.image}
                            alt={user.name ?? user.email ?? "User avatar"}
                          />
                        ) : (
                          <AvatarFallback>
                            {user?.name?.slice(0, 1) ?? user?.email?.slice(0, 1) ?? "R"}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="bg-blue-50">
                      <ul className="w-48 gap-3 text-lg">
                        <li>設定</li>
                        <li><button type="button" onClick={handlLogout}>SignOut</button></li>
                      </ul>
                    </NavigationMenuContent>
                  </>
                :
                <button className="hover:bg-white/15">
                  <Link href={`${apiUrl}/auth/google_oauth2`}>
                     Login
                  </Link>
                </button>
                }
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>
    </header>
  );
}
