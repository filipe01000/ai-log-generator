"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Rows3, WrapText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type RawConsoleLog = {
  id: string;
  timestamp: string;
  vendor: string;
  eventType: string;
  severity: string;
  raw: string;
};

type GroupMode = "timeline" | "vendor" | "severity";

function severityRank(severity: string) {
  return { critical: 5, high: 4, medium: 3, low: 2, informational: 1 }[severity] || 0;
}

function severityClass(severity: string) {
  return {
    critical: "border-red-500/30 bg-red-500/10",
    high: "border-orange-500/30 bg-orange-500/10",
    medium: "border-yellow-500/30 bg-yellow-500/10",
    low: "border-emerald-500/30 bg-emerald-500/10",
    informational: "border-sky-500/30 bg-sky-500/10"
  }[severity] || "border-border bg-secondary/20";
}

export function RawLogConsole({ logs }: { logs: RawConsoleLog[] }) {
  const [query, setQuery] = useState("");
  const [groupMode, setGroupMode] = useState<GroupMode>("timeline");
  const [wrap, setWrap] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const visibleLogs = useMemo(() => {
    const q = query.toLowerCase().trim();
    const filtered = q
      ? logs.filter((log) => `${log.vendor} ${log.eventType} ${log.severity} ${log.raw}`.toLowerCase().includes(q))
      : logs;

    if (groupMode === "severity") {
      return [...filtered].sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
    }

    if (groupMode === "vendor") {
      return [...filtered].sort((a, b) => a.vendor.localeCompare(b.vendor) || +new Date(b.timestamp) - +new Date(a.timestamp));
    }

    return [...filtered].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
  }, [logs, query, groupMode]);

  const rawBlock = visibleLogs.map((log) => log.raw).join("\n");

  async function copyAll() {
    await navigator.clipboard.writeText(rawBlock);
    setCopiedId("all");
    window.setTimeout(() => setCopiedId(null), 1200);
  }

  async function copyOne(id: string, raw: string) {
    await navigator.clipboard.writeText(raw);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 1200);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filtrar dentro do raw concentrado: ip, usuário, mitre, comando..." />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={groupMode === "timeline" ? "default" : "outline"} onClick={() => setGroupMode("timeline")}>Timeline</Button>
          <Button size="sm" variant={groupMode === "vendor" ? "default" : "outline"} onClick={() => setGroupMode("vendor")}>Fabricante</Button>
          <Button size="sm" variant={groupMode === "severity" ? "default" : "outline"} onClick={() => setGroupMode("severity")}>Criticidade</Button>
          <Button size="sm" variant={wrap ? "default" : "outline"} onClick={() => setWrap(!wrap)}><WrapText className="h-4 w-4" /> Quebra</Button>
          <Button size="sm" variant="outline" onClick={copyAll}>{copiedId === "all" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Copiar tudo</Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-secondary/45 px-4 py-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Rows3 className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">Raw concentrado</span>
            <Badge variant="outline">{visibleLogs.length} linhas</Badge>
          </div>
          <span>synthetic=true educational_only=true</span>
        </div>

        <div className="max-h-[620px] overflow-y-auto p-3 font-mono text-xs leading-6">
          <div className="space-y-3">
            {visibleLogs.map((log, index) => (
              <article key={log.id} className={`min-w-0 rounded-lg border ${severityClass(log.severity)} p-0 shadow-sm`}>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                    <span className="select-none text-[11px] tabular-nums">#{String(index + 1).padStart(4, "0")}</span>
                    <span className="font-semibold text-foreground">{log.vendor}</span>
                    <Badge variant={log.severity as never}>{log.severity}</Badge>
                    <span className="text-[11px]">{new Date(log.timestamp).toLocaleString("pt-BR")}</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => copyOne(log.id, log.raw)}>
                    {copiedId === log.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    Copiar
                  </Button>
                </div>
                <pre className={`${wrap ? "whitespace-pre-wrap break-words" : "overflow-x-auto whitespace-pre"} min-w-0 rounded-b-lg bg-background/70 px-3 py-3 text-foreground`}>
                  {log.raw}
                </pre>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
