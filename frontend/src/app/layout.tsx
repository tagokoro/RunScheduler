import type { Metadata } from "next";
import { DM_Sans, Sora } from "next/font/google";

import Header from "@/components/header/header";
import { ToasterProvider } from "@/components/ui/toaster";
import "./globals.css";
import { cn } from "@/lib/utils";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RunAI | マラソンの練習管理",
  description:
    "目標レースに向けた練習予定を作成し、走行実績と振り返りを記録するランニング練習管理アプリ。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={cn("h-full antialiased", dmSans.variable, sora.variable)}
    >
      <body className="min-h-screen flex flex-col">
        <ToasterProvider>
          <Header />
          {children}
        </ToasterProvider>
      </body>
    </html>
  );
}
