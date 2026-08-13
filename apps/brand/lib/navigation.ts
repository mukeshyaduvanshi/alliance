import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  Receipt,
  Bell,
  BarChart3,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon?: LucideIcon;
  items?: { title: string; href: string }[];
}

export const brandNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    title: "Rates",
    href: "/products",
    icon: Package,
  },
  {
    title: "Orders",
    href: "/orders",
    icon: ShoppingCart,
    items: [
      { title: "My Orders", href: "/orders" },
      { title: "Place Order", href: "/orders/new" },
      { title: "Artwork Approval", href: "/orders/artwork" },
    ],
  },
  {
    title: "Purchase Orders",
    href: "/purchase-orders",
    icon: FileText,
  },
  {
    title: "Invoices & Documents",
    href: "/invoices",
    icon: Receipt,
  },
  { title: "Notifications", href: "/notifications", icon: Bell },
  { title: "Reports", href: "/reports", icon: BarChart3 },
  { title: "Profile", href: "/profile", icon: UserRound },
];
