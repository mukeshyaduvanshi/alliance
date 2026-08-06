"use client";

import * as React from "react";

import { cn } from "../../lib/utils";
import { Sidebar, type NavItem } from "./sidebar";
import { Topbar, type NotificationItem } from "./topbar";

interface AppShellProps {
  navItems: NavItem[];
  title?: string;
  notifications?: NotificationItem[];
  user?: { name?: string; email?: string; role?: string };
  onNotificationClick?: (n: NotificationItem) => void;
  onLogout?: () => void;
  activeHref?: string;
  onNavigate?: (href: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function AppShell({
  navItems,
  title,
  notifications,
  user,
  onNotificationClick,
  onLogout,
  activeHref,
  onNavigate,
  children,
  className,
}: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        items={navItems}
        activeHref={activeHref}
        onNavigate={onNavigate}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          title={title}
          notifications={notifications}
          user={user}
          onNotificationClick={onNotificationClick}
          onLogout={onLogout}
        />
        <main className={cn("flex-1 overflow-y-auto p-6", className)}>
          {children}
        </main>
      </div>
    </div>
  );
}
