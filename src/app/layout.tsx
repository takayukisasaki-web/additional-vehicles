import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "増車届 図面作成ツール",
  description: "事業用トラックの増車届に必要な駐車場配置図面を自動生成するツール",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 text-gray-900 min-h-screen">{children}</body>
    </html>
  );
}
