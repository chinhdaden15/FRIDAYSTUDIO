"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LineChart, Database, History, Settings } from "lucide-react";
import clsx from "clsx";

const navItems = [
  { name: "Tổng quan", path: "/", icon: Home },
  { name: "Phân tích", path: "/analysis", icon: LineChart },
  { name: "Nguồn", path: "/data-source", icon: Database },
  { name: "Lịch sử", path: "/history", icon: History },
  { name: "Cài đặt", path: "/settings", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-[#161920]/90 backdrop-blur-md border-t border-card-border flex justify-around items-center z-50 safe-area-bottom pb-env">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.path;

        return (
          <Link
            key={item.path}
            href={item.path}
            className={clsx(
              "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
              isActive ? "text-primary" : "text-gray-400 hover:text-gray-200"
            )}
          >
            <Icon size={20} className={isActive ? "fill-primary/20" : ""} />
            <span className="text-[10px] font-medium">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
