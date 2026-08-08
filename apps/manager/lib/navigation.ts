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

export interface NavPermission {
  module: string;
  action: string;
}

export interface NavItem {
  title: string;
  href: string;
  icon?: LucideIcon;
  items?: { title: string; href: string }[];
  permission?: NavPermission;
  anyOf?: NavPermission[];
}

export const managerNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    permission: { module: "dashboard", action: "VIEW" },
  },
  {
    title: "My Brands",
    href: "/brands",
    icon: Building2,
    permission: { module: "brand", action: "VIEW" },
  },
  {
    title: "Orders",
    href: "/orders",
    icon: ShoppingCart,
    permission: { module: "order", action: "VIEW" },
    items: [
      { title: "All Orders", href: "/orders" },
      { title: "Negotiations", href: "/orders/negotiations" },
    ],
  },
  {
    title: "Approvals",
    href: "/approvals",
    icon: CheckCircle2,
    permission: { module: "workflow", action: "VIEW" },
    items: [
      { title: "Pending", href: "/approvals" },
      { title: "History", href: "/approvals/history" },
    ],
  },
  {
    title: "Vendors",
    href: "/vendors",
    icon: Truck,
    permission: { module: "vendor", action: "VIEW" },
  },
  {
    title: "SLA & Alerts",
    href: "/sla",
    icon: Activity,
    anyOf: [
      { module: "sla_rule", action: "VIEW" },
      { module: "alert", action: "VIEW" },
    ],
    items: [
      { title: "SLA Monitoring", href: "/sla" },
      { title: "Alerts", href: "/sla/alerts" },
    ],
  },
  {
    title: "Notifications",
    href: "/notifications",
    icon: Bell,
    permission: { module: "notification", action: "VIEW" },
  },
];
