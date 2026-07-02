import { ShieldCheck } from "lucide-react";
import { EDUCATIONAL_NOTICE } from "@/lib/security";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-card/80 px-4 py-3 shadow-sm backdrop-blur sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-300">SOC Synthetic Lab</p>
          <h1 className="text-xl font-semibold text-foreground">AI Log Generator</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-100">
            <ShieldCheck className="h-4 w-4" />
            <span>{EDUCATIONAL_NOTICE}</span>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
