"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback } from "react";
import {
  Brain,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  DollarSign,
  FileText,
  GitBranch,
  Handshake,
  LayoutDashboard,
  Megaphone,
  PhoneCall,
  Plug,
  Receipt,
  Settings,
  Swords,
  Table2,
  Tag,
  Target,
  UserPlus,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePrefetch } from "@/lib/queries";
import { usePeriodFilter } from "@/providers/PeriodFilterProvider";
import { useLocalStorage } from "@/lib/use-local-storage";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  prefetchKey?: string;
}

const MAIN_NAV: NavItem[] = [
  { label: "Overview", href: "/overview", icon: LayoutDashboard, prefetchKey: "overview" },
  { label: "Tráfego", href: "/marketing", icon: Megaphone, prefetchKey: "marketing" },
  { label: "SDRs", href: "/sdrs", icon: PhoneCall, prefetchKey: "sdr" },
  { label: "Closers", href: "/closers", icon: Handshake, prefetchKey: "closer" },
  { label: "Squads", href: "/squads", icon: Swords },
  { label: "Financeiro", href: "/financeiro", icon: DollarSign },
  { label: "AI Diagnosis", href: "/ai", icon: Brain },
  { label: "Evidências", href: "/evidence", icon: Table2 },
];

const ADMIN_NAV: NavItem[] = [
  { label: "Setup", href: "/admin/setup", icon: Settings },
  { label: "Billing", href: "/admin/billing", icon: CreditCard },
  { label: "Integrações", href: "/admin/integrations", icon: Plug },
  { label: "Funil", href: "/admin/funnel-mapping", icon: GitBranch },
  { label: "Tags", href: "/admin/tags-aliases", icon: Tag },
  { label: "Ticket", href: "/admin/ticket", icon: Receipt },
  { label: "Colaboradores", href: "/admin/collaborators", icon: Users },
  { label: "Metas", href: "/admin/goals", icon: Target },
  { label: "Logs", href: "/admin/logs", icon: FileText },
];

function NavLink({
  item,
  active,
  collapsed,
  onHover,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onHover?: () => void;
}) {
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      prefetch={true}
      onMouseEnter={onHover}
      className={cn(
        "flex items-center rounded-md text-sm font-medium transition-colors",
        collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && (
        <span className="truncate">{item.label}</span>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

export function SidebarNav() {
  const pathname = usePathname();
  const { prefetchPeople, prefetchCampaigns } = usePrefetch();
  const { period } = usePeriodFilter();
  const [collapsed, setCollapsed] = useLocalStorage("sidebar-collapsed", false);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  const handleHover = useCallback(
    (key?: string) => {
      if (!key) return;
      if (key === "sdr" || key === "closer") prefetchPeople(key, period);
      if (key === "marketing") prefetchCampaigns(period);
    },
    [prefetchPeople, prefetchCampaigns, period],
  );

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "flex h-screen shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-in-out",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <div className={cn(
          "flex h-14 items-center",
          collapsed ? "justify-between px-2" : "justify-between px-4",
        )}>
          <span className={cn(
            "font-bold tracking-tight text-white transition-all duration-200",
            collapsed ? "text-sm" : "text-lg",
          )}>
            {collapsed ? "DB" : "Dashblue"}
          </span>
          <button
            onClick={() => setCollapsed((prev) => !prev)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <ChevronsLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        <ScrollArea className={cn("flex-1", collapsed ? "px-2" : "px-3")}>
          <nav className="flex flex-col gap-1 py-2">
            {MAIN_NAV.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActive(item.href)}
                collapsed={collapsed}
                onHover={() => handleHover(item.prefetchKey)}
              />
            ))}

            <Separator className="my-3 bg-sidebar-border" />

            {!collapsed && (
              <span className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                Admin
              </span>
            )}

            {ADMIN_NAV.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActive(item.href)}
                collapsed={collapsed}
              />
            ))}
          </nav>
        </ScrollArea>

      </aside>
    </TooltipProvider>
  );
}
