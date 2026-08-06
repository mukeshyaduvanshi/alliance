"use client";

import * as React from "react";
import { Bell, Menu, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  unread?: boolean;
}

interface TopbarProps {
  title?: string;
  notifications?: NotificationItem[];
  onNotificationClick?: (n: NotificationItem) => void;
  onLogout?: () => void;
  user?: { name?: string; email?: string; role?: string };
  onMenuClick?: () => void;
  className?: string;
}

export function Topbar({
  title,
  notifications = [],
  onNotificationClick,
  onLogout,
  user,
  onMenuClick,
  className,
}: TopbarProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header
      className={cn(
        "flex h-14 shrink-0 items-center gap-3 border-b px-4",
        className
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
        aria-label="Toggle menu"
      >
        <Menu />
      </Button>

      {title && (
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold">{title}</h1>
          <Separator orientation="vertical" className="h-5" />
        </div>
      )}

      <div className="relative ml-auto hidden w-full max-w-xs sm:block">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input placeholder="Search..." className="pl-9" />
      </div>

      <div className="ml-auto flex items-center gap-1 sm:ml-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          {resolvedTheme === "dark" ? <Sun /> : <Moon />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <span className="relative">
                <Bell />
                {unreadCount > 0 && (
                  <span className="bg-destructive text-destructive-foreground absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full text-[10px] font-semibold">
                    {unreadCount}
                  </span>
                )}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No notifications
              </div>
            ) : (
              notifications.slice(0, 5).map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  onClick={() => onNotificationClick?.(n)}
                  className="flex flex-col items-start gap-0.5 py-2"
                >
                  <span className="text-sm font-medium">{n.title}</span>
                  <span className="text-muted-foreground text-xs line-clamp-1">
                    {n.message}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 gap-2 px-2"
              aria-label="User menu"
            >
              <span className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-full text-xs font-semibold uppercase">
                {(user?.name ?? "U").charAt(0)}
              </span>
              <span className="hidden text-sm sm:block">
                {user?.name ?? "User"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="text-sm font-medium">{user?.name}</div>
              <div className="text-muted-foreground text-xs">
                {user?.email}
                {user?.role ? ` · ${user.role}` : ""}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onLogout}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
