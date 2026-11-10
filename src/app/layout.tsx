import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/common/Sidebar";
import { Topbar } from "@/components/common/Topbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Unera — Định hướng học tập & Phát triển tương lai",
  description:
    "Nền tảng định hướng học tập, khám phá cơ hội, quản lý lộ trình cá nhân và theo dõi hạn chót dành riêng cho sinh viên đại học.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex bg-[#F6F8FB] text-slate-800 selection:bg-blue-600 selection:text-white">
        {/* Left Persistent Navigation Sidebar */}
        <Sidebar />

        {/* Right App Main Workspace */}
        <div className="flex flex-1 flex-col min-w-0">
          <Topbar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
