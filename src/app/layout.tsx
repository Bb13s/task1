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
  title: "华中科技大学物理学院辩论队",
  description: "辩以明物，论以穷理",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
