"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell, type NavItem } from "@cj/ui";
import { clearSession } from "@/lib/session";

import { vendorNavItems } from "@/lib/navigation";
import { useVendorProfile } from "@/features/queries";

function toNavItems(items: typeof vendorNavItems): NavItem[] {
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
  const { data: profile } = useVendorProfile();

  const handleLogout = () => {
    clearSession();
    router.push("/login");
  };

  return (
    <AppShell
      navItems={toNavItems(vendorNavItems)}
      title="Vendor"
      user={{ name: profile?.vendorName ?? "Vendor User" }}
      activeHref={pathname}
      onNavigate={(href) => router.push(href)}
      onLogout={handleLogout}
    >
      {children}
    </AppShell>
  );
}
