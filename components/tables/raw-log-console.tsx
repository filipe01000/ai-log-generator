"use client";

import { useMemo, useState } from "react";
import { Copy, Rows3, WrapText } from "lucide-react";
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

export function RawLogConsole({ logs }: { logs: RawConsoleLog[] }) {
  const [query, setQuery] = useState("");
  const [groupMode, setGroupMode] = useState<GroupMode>("timeline");
  const [wrap, setWrap] = useState(false);

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
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filtrar dentro do raw concentrado: ip, usuário, mitre, comando..." />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={groupMode === "timeline" ? "default" : "outline"} onClick={() => setGroupMode("timeline")}>Timeline</Button>
          <Button size="sm" variant={groupMode === "vendor" ? "default" : "outline"} onClick={() => setGroupMode("vendor")}>Fabricante</Button>
          <Button size="sm" variant={groupMode === "severity" ? "default" : "outline"} onClick={() => setGroupMode("severity")}>Criticidade</Button>
          <Button size="sm" variant="outline" onClick={() => setWrap(!wrap)}><WrapText className="h-4 w-4" /> Quebra</Button>
          <Button size="sm" variant="outline" onClick={copyAll}><Copy className="h-4 w-4" /> Copiar tudo</Button>
        </div>
      </div>

      <div className="rounded-xl border border-emerald-500/20 bg-black/70 shadow-2xl shadow-emerald-950/20">
        <div className="flex items-center justify-between border-b border-emerald-500/10 px-4 py-3 text-xs text-emerald-100/80">
          <div className="flex items-center gap-2">
            <Rows3 className="h-4 w-4" />
            Raw concentrado
            <Badge variant="outline">{visibleLogs.length} linhas</Badge>
          </div>
          <span>synthetic=true educational_only=true</span>
        </div>

        <div className="max-h-[620px] overflow-auto p-0 font-mono text-xs leading-6">
          {visibleLogs.map((log, index) => (
            <div key={log.id} className="grid grid-cols-[56px_120px_1fr] border-b border-slate-800/70 hover:bg-slate-900/70">
              <div className="select-none border-r border-slate-800/70 px-3 py-2 text-right text-slate-500">{String(index + 1).padStart(4, "0")}</div>
              <div className="select-none border-r border-slate-800/70 px-3 py-2 text-slate-400">
                <div>{log.vendor}</div>
                <div className="mt-1"><Badge variant={log.severity as never}>{log.severity}</Badge></div>
              </div>
              <pre className={`${wrap ? "whitespace-pre-wrap break-words" : "whitespace-pre"} overflow-x-auto px-3 py-2 text-emerald-100`}>{log.raw}</pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
