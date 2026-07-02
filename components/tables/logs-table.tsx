"use client";

import { useMemo, useState } from "react";
import { Check, Copy, FileJson, Terminal } from "lucide-react";
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

export function LogsTable({ logs }: { logs: LogRow[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [mode, setMode] = useState<"raw" | "json">("raw");
  const [copied, setCopied] = useState(false);

  const selected = useMemo(() => logs.find((log) => log.id === expanded), [logs, expanded]);

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
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
              {logs.map((log) => (
                <TableRow key={log.id}>
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
                    <Button size="sm" variant="outline" onClick={() => setExpanded(expanded === log.id ? null : log.id)}>
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {selected && (
        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button size="sm" variant={mode === "raw" ? "default" : "secondary"} onClick={() => setMode("raw")}>
                <Terminal className="h-4 w-4" /> Raw
              </Button>
              <Button size="sm" variant={mode === "json" ? "default" : "secondary"} onClick={() => setMode("json")}>
                <FileJson className="h-4 w-4" /> JSON
              </Button>
            </div>
            <Button size="sm" variant="outline" onClick={() => copy(mode === "raw" ? selected.raw : JSON.stringify(safeJsonParse(selected.jsonPayload, {}), null, 2))}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Copiar
            </Button>
          </div>
          <pre className="max-h-96 min-w-0 overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-border bg-background/80 p-4 font-mono text-xs leading-6 text-foreground">
            {mode === "raw" ? selected.raw : JSON.stringify(safeJsonParse(selected.jsonPayload, {}), null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
