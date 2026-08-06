import {
  LayoutDashboard,
  ShoppingCart,
  BadgeDollarSign,
  Star,
  Bell,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon?: LucideIcon;
  items?: { title: string; href: string }[];
}

export const vendorNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    title: "Orders",
    href: "/orders",
    icon: ShoppingCart,
    items: [
      { title: "Assigned Orders", href: "/orders" },
      { title: "Negotiations", href: "/orders/negotiations" },
    ],
  },
  { title: "Rate Card", href: "/rates", icon: BadgeDollarSign },
  { title: "Payments", href: "/payments", icon: BadgeDollarSign },
  { title: "Performance", href: "/performance", icon: Star },
  { title: "Notifications", href: "/notifications", icon: Bell },
];
