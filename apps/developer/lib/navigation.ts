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
}

const SYSTEM_VIEW = { module: "system_admin", action: "VIEW" };

export const developerNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: SYSTEM_VIEW },
  { title: "Server Health", href: "/server-health", icon: ServerCog, permission: SYSTEM_VIEW },
  { title: "Error Logs", href: "/error-logs", icon: Bug, permission: SYSTEM_VIEW },
  { title: "Queues & Jobs", href: "/queues", icon: ListOrdered, permission: SYSTEM_VIEW },
  {
    title: "Message Logs",
    href: "/messages",
    icon: Mail,
    permission: SYSTEM_VIEW,
    items: [
      { title: "Email Logs", href: "/messages/email" },
      { title: "SMS Logs", href: "/messages/sms" },
    ],
  },
  { title: "Backups", href: "/backups", icon: DatabaseBackup, permission: SYSTEM_VIEW },
  {
    title: "Subscriptions",
    href: "/subscriptions",
    icon: KeyRound,
    permission: SYSTEM_VIEW,
    items: [
      { title: "Plans", href: "/subscriptions/plans" },
      { title: "Licenses", href: "/subscriptions/licenses" },
    ],
  },
  { title: "Cache & Storage", href: "/cache", icon: Database, permission: SYSTEM_VIEW },
];
