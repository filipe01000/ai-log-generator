"use client";

import { Fragment, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronUp, Copy, FileJson, Terminal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { safeJsonParse } from "@/lib/utils";

type LogRow = {
  id: string;
  timestamp: string;
  vendor: string;
  eventType: string;
  severity: string;
  sourceIp?: string | null;
  destinationIp?: string | null;
  username?: string | null;
  hostname?: string | null;
  mitreId?: string | null;
  raw: string;
  jsonPayload: string;
  riskScore?: number;
  confidence?: number;
};

type ViewMode = "raw" | "json";

export function LogsTable({ logs }: { logs: LogRow[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [modeByLog, setModeByLog] = useState<Record<string, ViewMode>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const selected = useMemo(() => logs.find((log) => log.id === expanded), [logs, expanded]);

  function getMode(logId: string): ViewMode {
    return modeByLog[logId] || "raw";
  }

  function setMode(logId: string, mode: ViewMode) {
    setModeByLog((current) => ({ ...current, [logId]: mode }));
  }

  async function copy(logId: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopiedId(logId);
    window.setTimeout(() => setCopiedId(null), 1200);
  }

  function renderDetails(log: LogRow) {
    const mode = getMode(log.id);
    const json = safeJsonParse(log.jsonPayload, {});
    const content = mode === "raw" ? log.raw : JSON.stringify(json, null, 2);

    return (
      <TableRow className="bg-secondary/20 hover:bg-secondary/20">
        <TableCell colSpan={9} className="p-0">
          <div className="border-t border-border/80 bg-card p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{log.vendor}</Badge>
                <Badge variant={log.severity as never}>{log.severity}</Badge>
                {log.mitreId ? <Badge variant="outline">{log.mitreId}</Badge> : <Badge variant="secondary">benigno</Badge>}
                <span className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString("pt-BR")}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant={mode === "raw" ? "default" : "secondary"} onClick={() => setMode(log.id, "raw")}>
                  <Terminal className="h-4 w-4" /> Raw
                </Button>
                <Button type="button" size="sm" variant={mode === "json" ? "default" : "secondary"} onClick={() => setMode(log.id, "json")}>
                  <FileJson className="h-4 w-4" /> JSON
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => copy(log.id, content)}>
                  {copiedId === log.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Copiar
                </Button>
              </div>
            </div>

            <pre className="max-h-96 min-w-0 overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-border bg-background/90 p-4 font-mono text-xs leading-6 text-foreground">
              {content}
            </pre>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-border/80">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/60">
                <TableHead>Tempo</TableHead>
                <TableHead>Fabricante</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Severidade</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>MITRE</TableHead>
                <TableHead>Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => {
                const isOpen = selected?.id === log.id;
                return (
                  <Fragment key={log.id}>
                    <TableRow className={isOpen ? "bg-secondary/30" : undefined}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="font-medium text-foreground">{log.vendor}</TableCell>
                      <TableCell>{log.eventType}</TableCell>
                      <TableCell>
                        <Badge variant={log.severity as never}>{log.severity}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{log.sourceIp || "n/a"}</TableCell>
                      <TableCell className="font-mono text-xs">{log.destinationIp || "n/a"}</TableCell>
                      <TableCell>{log.username || "n/a"}</TableCell>
                      <TableCell>{log.mitreId ? <Badge variant="outline">{log.mitreId}</Badge> : <span className="text-muted-foreground">benigno</span>}</TableCell>
                      <TableCell>
                        <Button type="button" size="sm" variant={isOpen ? "secondary" : "outline"} onClick={() => setExpanded(isOpen ? null : log.id)}>
                          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          {isOpen ? "Ocultar" : "Ver"}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {isOpen && renderDetails(log)}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
