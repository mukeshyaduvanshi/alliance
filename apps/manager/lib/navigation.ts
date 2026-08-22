import {
  LayoutDashboard,
  Users,
  Shield,
  Building2,
  Truck,
  Package,
  FileText,
  ShoppingCart,
  CheckCircle2,
  Palette,
  UserCheck,
  Briefcase,
  Activity,
  ScrollText,
  Bell,
  Settings,
  Globe,
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
    title: "Users",
    href: "/users",
    icon: Users,
    permission: { module: "user", action: "VIEW" },
  },
  {
    title: "Roles & Permissions",
    href: "/roles",
    icon: Shield,
    anyOf: [
      { module: "role", action: "VIEW" },
      { module: "permission", action: "VIEW" },
    ],
  },
  {
    title: "My Brands",
    href: "/brands",
    icon: Building2,
    permission: { module: "brand", action: "VIEW" },
  },
  {
    title: "Vendors",
    href: "/vendors",
    icon: Truck,
    permission: { module: "vendor", action: "VIEW" },
  },
  {
    title: "Rate Catalog",
    href: "/rates",
    icon: Package,
    permission: { module: "rate", action: "VIEW" },
  },
  {
    title: "Purchase Orders",
    href: "/purchase-orders",
    icon: FileText,
    permission: { module: "purchase_order", action: "VIEW" },
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
    title: "Artworks",
    href: "/artworks",
    icon: Palette,
    permission: { module: "creative_artwork", action: "VIEW" },
  },
  {
    title: "Vendor Assignments",
    href: "/vendors/assignments",
    icon: UserCheck,
    permission: { module: "vendor_assignment", action: "VIEW" },
  },
  {
    title: "Business Models",
    href: "/business-models",
    icon: Briefcase,
    permission: { module: "business_model", action: "VIEW" },
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
    title: "Audit Logs",
    href: "/audit-logs",
    icon: ScrollText,
    permission: { module: "audit_log", action: "VIEW" },
  },
  {
    title: "Notifications",
    href: "/notifications",
    icon: Bell,
    permission: { module: "notification", action: "VIEW" },
  },
  {
    title: "System Admin",
    href: "/system-admin",
    icon: Settings,
    permission: { module: "system_admin", action: "VIEW" },
  },
  {
    title: "Tenants",
    href: "/tenants",
    icon: Globe,
    permission: { module: "tenant", action: "VIEW" },
  },
];
