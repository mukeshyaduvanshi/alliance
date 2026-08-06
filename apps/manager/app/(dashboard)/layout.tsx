"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell, type NavItem } from "@cj/ui";
import { clearSession } from "@cj/utils";

import { managerNavItems } from "@/lib/navigation";

function toNavItems(items: typeof managerNavItems): NavItem[] {
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

  const handleLogout = () => {
    clearSession();
    router.push("/login");
  };

  return (
    <AppShell
      navItems={toNavItems(managerNavItems)}
      title="Manager"
      user={{ name: "KAM" }}
      activeHref={pathname}
      onNavigate={(href) => router.push(href)}
      onLogout={handleLogout}
    >
      {children}
    </AppShell>
  );
}
