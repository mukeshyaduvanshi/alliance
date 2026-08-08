"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell, type NavItem } from "@cj/ui";
import { hasPermission } from "@cj/utils";
import { clearSession, getSession } from "@/lib/session";

import { useNotifications } from "@/features/notifications/queries";
import { developerNavItems, type NavItem as DevNavItem } from "@/lib/navigation";

function isAllowed(item: DevNavItem, session: ReturnType<typeof getSession>): boolean {
  if (!session) return false;
  if (session.user?.isSuperAdmin) return true;
  if (item.permission) {
    return hasPermission(item.permission.module, item.permission.action, session);
  }
  return true;
}

function toNavItems(items: DevNavItem[]): NavItem[] {
  const session = getSession();
  return items
    .filter((item) => isAllowed(item, session))
    .map((item) => ({
      title: item.title,
      href: item.href,
      icon: item.icon,
      items: item.items,
    }));
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = React.useState("Developer");

  const { data: notifications } = useNotifications(undefined, 1);

  React.useEffect(() => {
    const session = getSession();
    if (session?.user?.fullName) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUserName(session.user.fullName);
    }
  }, []);

  const handleLogout = () => {
    clearSession();
    router.push("/login");
  };

  return (
    <AppShell
      navItems={toNavItems(developerNavItems)}
      title="System"
      user={{ name: userName }}
      activeHref={pathname}
      onNavigate={(href) => router.push(href)}
      onLogout={handleLogout}
      notifications={(notifications?.data ?? []).slice(0, 5).map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        unread: !n.isRead,
      }))}
      onNotificationClick={() => router.push("/notifications")}
    >
      {children}
    </AppShell>
  );
}
