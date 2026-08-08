"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell, type NavItem } from "@cj/ui";
import { clearSession, getSession } from "@/lib/session";

import { useNotifications } from "@/features/notifications/queries";
import { adminNavItems } from "@/lib/navigation";

function toNavItems(items: typeof adminNavItems): NavItem[] {
  return items.map((item) => ({
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
  const [userName, setUserName] = React.useState("Super Admin");

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
      navItems={toNavItems(adminNavItems)}
      title="Admin"
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
