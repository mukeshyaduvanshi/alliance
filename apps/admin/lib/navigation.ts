import {
  LayoutDashboard,
  Users,
  Shield,
  Workflow,
  Building2,
  Truck,
  Package,
  FileText,
  ShoppingCart,
  Activity,
  ScrollText,
  Bell,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon?: LucideIcon;
  items?: { title: string; href: string }[];
}

export const adminNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Users", href: "/users", icon: Users },
  {
    title: "Roles & Permissions",
    href: "/roles",
    icon: Shield,
    items: [
      { title: "Roles", href: "/roles" },
      { title: "Permissions", href: "/roles/permissions" },
    ],
  },
  {
    title: "Workflows",
    href: "/workflows",
    icon: Workflow,
    items: [
      { title: "Rules", href: "/workflows/rules" },
      { title: "Instances", href: "/workflows/instances" },
    ],
  },
  {
    title: "Brands",
    href: "/brands",
    icon: Building2,
    items: [
      { title: "All Brands", href: "/brands" },
      { title: "Approvals", href: "/brands/approvals" },
    ],
  },
  {
    title: "Vendors",
    href: "/vendors",
    icon: Truck,
    items: [
      { title: "All Vendors", href: "/vendors" },
      { title: "Approvals", href: "/vendors/approvals" },
    ],
  },
  {
    title: "Catalog & Pricing",
    href: "/catalog",
    icon: Package,
    items: [
      { title: "Rate Catalog", href: "/catalog/rates" },
    ],
  },
  { title: "Purchase Orders", href: "/purchase-orders", icon: FileText },
  { title: "Orders", href: "/orders", icon: ShoppingCart },
  {
    title: "Monitoring",
    href: "/monitoring",
    icon: Activity,
    items: [
      { title: "SLA Rules", href: "/monitoring/sla-rules" },
      { title: "Alerts", href: "/monitoring/alerts" },
    ],
  },
  { title: "Audit Logs", href: "/audit-logs", icon: ScrollText },
  { title: "Notifications", href: "/notifications", icon: Bell },
];
