"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell, type NavItem } from "@cj/ui";
import { hasPermission } from "@cj/utils";
import { api } from "@/lib/api";
import { clearSession, getSession, saveSession } from "@/lib/session";

import { useNotifications } from "@/features/notifications/queries";
import { managerNavItems, type NavItem as ManagerNavItem } from "@/lib/navigation";

interface MeResponse {
  id: string;
  fullName: string;
  email: string;
  roleId: string | null;
  roleName: string | null;
  isAdmin: boolean;
  permissions: { module: string; action: string }[];
  assignedBrandIds: string[];
}

function isAllowed(item: ManagerNavItem, session: ReturnType<typeof getSession>): boolean {
  if (!session) return false;
  if (session.user?.isAdmin) return true;
  if (item.permission) {
    return hasPermission(item.permission.module, item.permission.action, session);
  }
  if (item.anyOf?.length) {
    return item.anyOf.some((p) => hasPermission(p.module, p.action, session));
  }
  return true;
}

function toNavItems(items: ManagerNavItem[]): NavItem[] {
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
  const [userName, setUserName] = React.useState("KAM");
  const [navItems, setNavItems] = React.useState<NavItem[]>([]);
  const [mounted, setMounted] = React.useState(false);

  const { data: notifications } = useNotifications(undefined, 1);

  React.useEffect(() => {
    setMounted(true);
    const session = getSession();
    if (session?.user?.fullName) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUserName(session.user.fullName);
    }
    setNavItems(toNavItems(managerNavItems));

    if (session?.accessToken) {
      api
        .get<MeResponse>("/users/me")
        .then((me) => {
          if (me) {
            const updatedSession = {
              ...session,
              permissions: me.permissions ?? [],
              user: {
                ...session.user,
                fullName: me.fullName ?? session.user.fullName,
                roleName: me.roleName ?? session.user.roleName,
              },
            };
            saveSession(updatedSession);
            setUserName(updatedSession.user.fullName);
            setNavItems(toNavItems(managerNavItems));
          }
        })
        .catch(() => {
          // ignore error
        });
    }
  }, []);

  const handleLogout = () => {
    clearSession();
    router.push("/login");
  };

  return (
    <AppShell
      navItems={navItems}
      title="Manager"
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
      {mounted ? children : null}
    </AppShell>
  );
}
