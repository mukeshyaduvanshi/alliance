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

export function Sidebar({
  items,
  activeHref,
  onNavigate,
  className,
}: SidebarProps) {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <aside
      className={cn(
        "bg-sidebar text-sidebar-foreground flex h-full flex-col border-r transition-[width] duration-200",
        collapsed ? "w-14" : "w-64",
        className
      )}
    >
      <div
        className={cn(
          "flex h-14 shrink-0 items-center gap-2 border-b px-4",
          collapsed && "justify-center px-2"
        )}
      >
        <div className="bg-primary flex size-8 shrink-0 items-center justify-center rounded-lg text-primary-foreground shadow-sm">
          <span className="text-sm font-bold">C</span>
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <p className="text-sm font-semibold">Cjalliance</p>
            <p className="text-muted-foreground text-[11px]">
              Enterprise Platform
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => {
          const isActive = activeHref === item.href;
          const hasActiveChild = item.items?.some(
            (sub) => activeHref === sub.href
          );
          return (
            <div key={item.href} className="space-y-0.5">
              <Button
                variant="ghost"
                className={cn(
                  "relative w-full justify-start gap-2.5 px-3 font-medium transition-colors",
                  (isActive || hasActiveChild) &&
                    "bg-sidebar-accent text-sidebar-accent-foreground",
                  collapsed && "justify-center px-2"
                )}
                onClick={() => onNavigate?.(item.href)}
              >
                {item.icon && (
                  <item.icon
                    className={cn(
                      "size-4 shrink-0",
                      (isActive || hasActiveChild) &&
                        "text-primary dark:text-primary"
                    )}
                  />
                )}
                {!collapsed && <span className="truncate">{item.title}</span>}
                {!collapsed && isActive && (
                  <span className="bg-primary absolute inset-y-2 left-0 w-0.5 rounded-full" />
                )}
              </Button>
              {item.items && !collapsed && (
                <div className="ml-4 space-y-0.5 border-l pl-2">
                  {item.items.map((sub) => {
                    const subActive = activeHref === sub.href;
                    return (
                      <Button
                        key={sub.href}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "w-full justify-start gap-2 px-3 font-normal",
                          subActive && "bg-sidebar-accent font-medium"
                        )}
                        onClick={() => onNavigate?.(sub.href)}
                      >
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            subActive ? "bg-primary" : "bg-muted-foreground/40"
                          )}
                        />
                        {sub.title}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
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
