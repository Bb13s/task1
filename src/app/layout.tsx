import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { initDb, seedData, initUserTables } from "@/lib/db";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "NoteHub - GitHub风格笔记",
  description: "一个GitHub风格的笔记管理应用",
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
