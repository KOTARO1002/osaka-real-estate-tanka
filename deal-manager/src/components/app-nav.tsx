"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Menu,
  X,
  LogOut,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/(app)/actions";
import type { StaffRow } from "@/lib/supabase/types";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/deals", label: "案件", icon: FolderKanban },
  { href: "/staff", label: "スタッフ管理", icon: Users, adminOnly: true },
];

function NavLinks({
  staff,
  onNavigate,
}: {
  staff: StaffRow;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter(
    (item) => !item.adminOnly || staff.role === "admin"
  );

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2 px-2">
      <div
        className="flex h-8 w-8 items-center justify-center rounded-md text-base font-bold text-white"
        style={{ backgroundColor: "#58A1AA" }}
      >
        S
      </div>
      <div className="leading-tight">
        <p className="font-heading text-sm font-semibold">案件管理</p>
        <p className="text-[10px] text-muted-foreground">シンプルハウス</p>
      </div>
    </div>
  );
}

function UserFooter({ staff }: { staff: StaffRow }) {
  return (
    <div className="mt-auto border-t pt-3">
      <div className="px-2 pb-2">
        <p className="truncate text-sm font-medium">{staff.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {staff.role === "admin" ? "管理者" : "メンバー"} ・ {staff.email}
        </p>
      </div>
      <form action={signOut}>
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
        >
          <LogOut className="h-4 w-4" />
          ログアウト
        </Button>
      </form>
    </div>
  );
}

export function AppNav({ staff }: { staff: StaffRow }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* デスクトップ: 左サイドバー */}
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-background p-3 md:flex">
        <div className="mb-6 mt-2">
          <Brand />
        </div>
        <NavLinks staff={staff} />
        <UserFooter staff={staff} />
      </aside>

      {/* モバイル: 上部バー + ドロワー */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background px-4 py-2 md:hidden">
        <Brand />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          aria-label="メニューを開く"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-64 flex-col bg-background p-3 shadow-xl">
            <div className="mb-6 mt-2 flex items-center justify-between">
              <Brand />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
                aria-label="メニューを閉じる"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <NavLinks staff={staff} onNavigate={() => setMobileOpen(false)} />
            <UserFooter staff={staff} />
          </div>
        </div>
      )}
    </>
  );
}
