"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback } from "react";
import {
  Brain,
  Crosshair,
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
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { usePrefetch } from "@/lib/queries";
import { usePeriodFilter } from "@/providers/PeriodFilterProvider";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  prefetchKey?: string;
}

const MAIN_NAV: NavItem[] = [
  { label: "Overview", href: "/overview", icon: LayoutDashboard, prefetchKey: "overview" },
  { label: "Marketing", href: "/marketing", icon: Megaphone, prefetchKey: "marketing" },
  { label: "SDRs", href: "/sdrs", icon: PhoneCall, prefetchKey: "sdr" },
  { label: "Closers", href: "/closers", icon: Handshake, prefetchKey: "closer" },
  { label: "Squads", href: "/squads", icon: Swords },
  { label: "Financeiro", href: "/financeiro", icon: DollarSign },
  { label: "AI Diagnosis", href: "/ai", icon: Brain },
  { label: "Evidências", href: "/evidence", icon: Table2 },
];

const ADMIN_NAV: NavItem[] = [
  { label: "Setup", href: "/admin/setup", icon: Settings },
  { label: "Integrações", href: "/admin/integrations", icon: Plug },
  { label: "Funil", href: "/admin/funnel-mapping", icon: GitBranch },
  { label: "Tags", href: "/admin/tags-aliases", icon: Tag },
  { label: "Ticket", href: "/admin/ticket", icon: Receipt },
  { label: "Colaboradores", href: "/admin/collaborators", icon: Users },
  { label: "Metas", href: "/admin/goals", icon: Target },
  { label: "Metas Individuais", href: "/admin/individual-goals", icon: Crosshair },
  { label: "Logs", href: "/admin/logs", icon: FileText },
];

function NavLink({
  item,
  active,
  onHover,
}: {
  item: NavItem;
  active: boolean;
  onHover?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      prefetch={true}
      onMouseEnter={onHover}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  );
}

export function SidebarNav() {
  const pathname = usePathname();
  const { prefetchPeople, prefetchCampaigns } = usePrefetch();
  const { period } = usePeriodFilter();

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
    <aside className="flex h-screen w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center px-4">
        <span className="text-lg font-bold tracking-tight text-white">
          Dashblue
        </span>
      </div>

      <ScrollArea className="flex-1 px-3">
        <nav className="flex flex-col gap-1 py-2">
          {MAIN_NAV.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(item.href)}
              onHover={() => handleHover(item.prefetchKey)}
            />
          ))}

          <Separator className="my-3 bg-sidebar-border" />

          <span className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
            Admin
          </span>

          {ADMIN_NAV.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} />
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}
