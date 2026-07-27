import type { Metadata } from "next";
import "./globals.css";
import { initDb, seedData, initUserTables } from "@/lib/db";

export const metadata: Metadata = {
  title: "NoteHub - 知识库",
  description: "个人知识管理与笔记系统",
  icons: { icon: "/favicon.svg" },
};

try {
  initDb();
} catch (e) {
  console.error('initDb error:', e);
}

try {
  seedData();
} catch (e) {
  console.error('seedData error:', e);
}

try {
  initUserTables();
} catch (e) {
  console.error('initUserTables error:', e);
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
