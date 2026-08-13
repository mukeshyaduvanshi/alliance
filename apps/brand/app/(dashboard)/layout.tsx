"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell, type NavItem } from "@cj/ui";
import { clearSession } from "@/lib/session";

import { brandNavItems } from "@/lib/navigation";
import { useBrandProfile } from "@/features/queries";

function toNavItems(items: typeof brandNavItems): NavItem[] {
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
  const { data: profile } = useBrandProfile();

  const handleLogout = () => {
    clearSession();
    router.push("/login");
  };

  const isApproved = profile?.approvalStatus === "APPROVED";

  return (
    <AppShell
      navItems={toNavItems(brandNavItems)}
      title="Brand"
      user={{ name: profile?.brandName ?? "Brand User" }}
      activeHref={pathname}
      onNavigate={(href) => router.push(href)}
      onLogout={handleLogout}
    >
      <div className="relative">
        <div className={isApproved ? "" : "pointer-events-none select-none blur-sm"}>
          {children}
        </div>
        {!isApproved && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="rounded-xl border bg-white/90 px-8 py-6 text-center shadow-lg dark:bg-zinc-900/90">
              <p className="text-lg font-semibold">Your account is pending approval</p>
              <p className="text-muted-foreground mt-1 text-sm">
                An admin will approve your account shortly. You will be able to
                access the dashboard once approved.
              </p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
