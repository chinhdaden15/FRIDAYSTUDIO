import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FRIDAY STUIDO",
  description: "Công cụ phân tích xác suất xổ số tham khảo bằng dữ liệu thống kê.",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#0f1115",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { ToastProvider } from "@/components/ToastProvider";
import { MusicProvider } from "@/components/MusicProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ToastProvider>
          <MusicProvider>
            <div className="fixed top-0 left-0 right-0 bg-warning/10 border-b border-warning/20 text-warning/90 text-[11px] text-center py-1.5 px-4 z-50 flex items-center justify-center font-medium">
              ⚠️ Kết quả chỉ mang tính phân tích tham khảo, không đảm bảo trúng thưởng.
            </div>
            <main className="flex-1 pb-20 pt-8 max-w-md mx-auto w-full relative">
              {children}
            </main>
            <BottomNav />
          </MusicProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
