import {
  LayoutDashboard,
  ServerCog,
  Bug,
  ListOrdered,
  Mail,
  DatabaseBackup,
  KeyRound,
  Database,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon?: LucideIcon;
  items?: { title: string; href: string }[];
}

export const developerNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Server Health", href: "/server-health", icon: ServerCog },
  { title: "Error Logs", href: "/error-logs", icon: Bug },
  { title: "Queues & Jobs", href: "/queues", icon: ListOrdered },
  {
    title: "Message Logs",
    href: "/messages",
    icon: Mail,
    items: [
      { title: "Email Logs", href: "/messages/email" },
      { title: "SMS Logs", href: "/messages/sms" },
    ],
  },
  { title: "Backups", href: "/backups", icon: DatabaseBackup },
  {
    title: "Subscriptions",
    href: "/subscriptions",
    icon: KeyRound,
    items: [
      { title: "Plans", href: "/subscriptions/plans" },
      { title: "Licenses", href: "/subscriptions/licenses" },
    ],
  },
  { title: "Cache & Storage", href: "/cache", icon: Database },
];
