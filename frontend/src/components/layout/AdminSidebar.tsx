
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/icons/Logo";
import {
  LayoutDashboard,
  Users,
  Activity,
  AlertTriangle,
  BarChart3,
  Settings,
  LogOut,
  ListChecks,
  Home,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "User Management", icon: Users },
  { href: "/admin/live-monitoring", label: "Live Monitoring", icon: Activity },
  { href: "/admin/alerts", label: "Alerts", icon: AlertTriangle },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/rules", label: "Fraud Rules", icon: ListChecks },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { state, isMobile } = useSidebar();
  const { logout } = useAuth();

  const isTooltipVisible = state === "collapsed" && !isMobile;

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left">
      {/* Header */}
      <SidebarHeader className="items-center justify-between p-3">
        <Link href="/admin/dashboard" className="flex items-center gap-2 overflow-hidden">
          <Logo size={7} />
          <span className="font-headline text-lg font-semibold group-data-[collapsible=icon]:hidden">
            Guardian Eye
          </span>
        </Link>
      </SidebarHeader>

      {/* Menu Items */}
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={item.href}>
                    <SidebarMenuButton
                      isActive={
                        pathname === item.href ||
                        (item.href !== "/admin/dashboard" && pathname.startsWith(item.href))
                      }
                      aria-label={item.label}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </TooltipTrigger>
                {isTooltipVisible && (
                  <TooltipContent side="right" align="center">
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      {/* Footer Actions */}
      <SidebarFooter className="p-2 mt-auto border-t border-sidebar-border">
        <SidebarMenu>
          {/* Back to Store */}
          <SidebarMenuItem>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/">
                  <SidebarMenuButton aria-label="Back to Store">
                    <Home />
                    <span>Back to Store</span>
                  </SidebarMenuButton>
                </Link>
              </TooltipTrigger>
              {isTooltipVisible && (
                <TooltipContent side="right" align="center">
                  Back to Store
                </TooltipContent>
              )}
            </Tooltip>
          </SidebarMenuItem>

          {/* Settings */}
          <SidebarMenuItem>
            <Tooltip>
              <TooltipTrigger asChild>
                 <Link href="/settings">
                  <SidebarMenuButton aria-label="Settings">
                    <Settings />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </Link>
              </TooltipTrigger>
              {isTooltipVisible && (
                <TooltipContent side="right" align="center">
                  Settings
                </TooltipContent>
              )}
            </Tooltip>
          </SidebarMenuItem>

          {/* Logout */}
          <SidebarMenuItem>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton
                  onClick={logout}
                  aria-label="Logout"
                >
                  <LogOut />
                  <span>Logout</span>
                </SidebarMenuButton>
              </TooltipTrigger>
              {isTooltipVisible && (
                <TooltipContent side="right" align="center">
                  Logout
                </TooltipContent>
              )}
            </Tooltip>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
