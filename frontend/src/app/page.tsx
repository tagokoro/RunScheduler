"use client";

import { useEffect, useState } from "react";

type CurrentUser = {
  id: number;
  name: string | null;
  email: string | null;
  image: string | null;
};

type MeResponse = {
  user: CurrentUser;
};

const apiUrl = "http://localhost:3000"; //TODO: 本番環境URLをenvから参照する

export default function Home() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, SetIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const response = await fetch(`${apiUrl}/me`, {
        credentials: "include",
      });

      if (response.ok) {
        const data: MeResponse = await response.json();
        setUser(data.user);
      }

      SetIsLoading(false);
    };
    void fetchCurrentUser();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${apiUrl}/logout`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok && response.status !== 401) {
        throw new Error("ログアウトに失敗しました");
      }

      setUser(null);
    } catch {
      setErrorMessage("ログアウトできませんでした");
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return <h1>読み込み中</h1>;
  }

  if (!user) {
    return (
      <>
        <h1>ログイン</h1>
        <a href={`${apiUrl}/auth/google_oauth2`}>Googleでログイン</a>
      </>
    );
  }
  return (
    <>
      {errorMessage && <p>{errorMessage}</p>}

      <p>{user.name ?? user.email}でログイン中</p>

      <button type="button" onClick={handleLogout}>
        ログアウト
      </button>
    </>
  );
}
