"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";

import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";

export interface NavItem {
  title: string;
  href: string;
  icon?: LucideIcon;
  items?: { title: string; href: string }[];
}

interface SidebarProps {
  items: NavItem[];
  activeHref?: string;
  onNavigate?: (href: string) => void;
  className?: string;
}

export function Sidebar({ items, activeHref, onNavigate, className }: SidebarProps) {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <aside
      className={cn(
        "bg-sidebar text-sidebar-foreground flex h-full flex-col border-r transition-[width] duration-200",
        collapsed ? "w-14" : "w-64",
        className
      )}
    >
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => (
          <div key={item.href} className="space-y-0.5">
            <Button
              variant={activeHref === item.href ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start",
                collapsed && "justify-center px-2"
              )}
              onClick={() => onNavigate?.(item.href)}
            >
              {item.icon && <item.icon className="size-4 shrink-0" />}
              {!collapsed && <span className="truncate">{item.title}</span>}
            </Button>
            {item.items && !collapsed && (
              <div className="ml-4 space-y-0.5 border-l pl-2">
                {item.items.map((sub) => (
                  <Button
                    key={sub.href}
                    variant={activeHref === sub.href ? "secondary" : "ghost"}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => onNavigate?.(sub.href)}
                  >
                    {sub.title}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
      <Separator />
      <div className="p-2">
        <Button
          variant="ghost"
          size="icon"
          className="w-full"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </Button>
      </div>
    </aside>
  );
}
