import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { Sidebar } from "@/components/common/Sidebar";
import { Topbar } from "@/components/common/Topbar";
import { AuthProvider } from "@/components/providers/AuthProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "Unera — Định hướng học tập & Phát triển tương lai",
  description:
    "Nền tảng định hướng học tập, khám phá hoạt động sinh viên, quản lý lộ trình cá nhân và kết nối cố vấn dành riêng cho sinh viên đại học.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex bg-[#F6F8FB] text-slate-800 font-sans selection:bg-blue-600 selection:text-white">
        <AuthProvider>
          {/* Left Persistent Navigation Sidebar */}
          <Suspense
            fallback={
              <aside className="sticky top-0 z-40 flex h-screen w-[250px] shrink-0 flex-col border-r border-slate-200/80 bg-white" />
            }
          >
            <Sidebar />
          </Suspense>

          {/* Right App Main Workspace (Fluid Edge-to-Edge) */}
          <div className="flex flex-1 flex-col min-w-0 w-full">
            <Suspense
              fallback={
                <header className="sticky top-0 z-30 flex h-16 w-full items-center border-b border-slate-200/80 bg-white" />
              }
            >
              <Topbar />
            </Suspense>
            <main className="flex-1 w-full overflow-y-auto">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
