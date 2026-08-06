import {
  LayoutDashboard,
  Building2,
  ShoppingCart,
  CheckCircle2,
  Truck,
  Activity,
  Bell,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon?: LucideIcon;
  items?: { title: string; href: string }[];
}

export const managerNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "My Brands", href: "/brands", icon: Building2 },
  {
    title: "Orders",
    href: "/orders",
    icon: ShoppingCart,
    items: [
      { title: "All Orders", href: "/orders" },
      { title: "Negotiations", href: "/orders/negotiations" },
    ],
  },
  {
    title: "Approvals",
    href: "/approvals",
    icon: CheckCircle2,
    items: [
      { title: "Pending", href: "/approvals" },
      { title: "History", href: "/approvals/history" },
    ],
  },
  { title: "Vendors", href: "/vendors", icon: Truck },
  {
    title: "SLA & Alerts",
    href: "/sla",
    icon: Activity,
    items: [
      { title: "SLA Monitoring", href: "/sla" },
      { title: "Alerts", href: "/sla/alerts" },
    ],
  },
  { title: "Notifications", href: "/notifications", icon: Bell },
];
