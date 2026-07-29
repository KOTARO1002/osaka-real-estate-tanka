import type { Metadata } from "next";
import { Outfit, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

// 見出し用フォント
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

// 本文和文フォント（筑紫ゴシックPro Dのフォールバック）
const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "案件管理 | シンプルハウス",
  description: "売買仲介の案件を一元管理する社内ツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${outfit.variable} ${notoSansJP.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-muted/30">{children}</body>
    </html>
  );
}
