"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BrainCircuit,
  Download,
  Gauge,
  LayoutDashboard,
  ListFilter,
  Radar,
  Settings,
  ShieldAlert,
  TerminalSquare
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/generate", label: "Gerador", icon: TerminalSquare },
  { href: "/ai-builder", label: "AI Scenario Builder", icon: BrainCircuit },
  { href: "/logs", label: "Logs Gerados", icon: ListFilter },
  { href: "/attacks", label: "Simulações", icon: ShieldAlert },
  { href: "/mitre", label: "MITRE", icon: Radar },
  { href: "/exports", label: "Exportações", icon: Download },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-border/80 bg-card/90 p-4 shadow-xl backdrop-blur lg:block">
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">AI Log Generator</p>
          <p className="text-xs text-emerald-700/80 dark:text-emerald-200/80">Synthetic SOC telemetry</p>
        </div>
      </div>

      <nav className="space-y-1">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-secondary/70 hover:text-foreground",
                active && "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/25 dark:text-emerald-200"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-sky-500/25 bg-sky-500/10 p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-sky-700 dark:text-sky-200">
          <Gauge className="h-4 w-4" /> MVP seguro
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          Dados 100% sintéticos para laboratório, treinamento, CTF e engenharia de detecção.
        </p>
      </div>
    </aside>
  );
}
