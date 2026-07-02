"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, Braces, ListFilter, RefreshCcw, Search, TerminalSquare, Trash2 } from "lucide-react";
import { MANUFACTURERS, SEVERITIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { LogsTable } from "@/components/tables/logs-table";
import { RawLogConsole } from "@/components/tables/raw-log-console";
import { ParserViewer } from "@/components/tables/parser-viewer";
import { AiLogAnalysis } from "@/components/tables/ai-log-analysis";

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

type ViewMode = "table" | "raw" | "parser" | "ai";

const emptyFilters = { vendor: "", severity: "", ip: "", username: "", mitreId: "", q: "" };

export function GeneratedLogsClient() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("raw");
  const [filters, setFilters] = useState(emptyFilters);

  const hasActiveFilters = useMemo(() => Object.values(filters).some(Boolean), [filters]);

  async function load() {
    setLoading(true);
    setMessage(null);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => value && params.set(key, value));
    params.set("take", "300");
    const response = await fetch(`/api/logs?${params.toString()}`);
    const data = await response.json();
    setLogs(data.logs || []);
    setLoading(false);
  }

  async function deleteLogs(scope: "all" | "filtered") {
    const text = scope === "all"
      ? "Tem certeza que deseja apagar TODOS os logs sintéticos salvos no SQLite? Essa ação não desfaz."
      : "Tem certeza que deseja apagar os logs que batem com os filtros atuais?";

    if (!window.confirm(text)) return;

    setDeleting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/logs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, filters })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Falha ao excluir logs");
      setMessage(`${data.deleted} logs sintéticos excluídos.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro inesperado ao excluir logs");
    } finally {
      setDeleting(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const activeClass = (mode: ViewMode) => viewMode === mode ? "default" : "outline";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consulta, parser e análise dos logs gerados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <div className="space-y-2">
            <Label>Fabricante</Label>
            <Select value={filters.vendor} onChange={(e) => setFilters({ ...filters, vendor: e.target.value })}>
              <option value="">Todos</option>
              {MANUFACTURERS.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Severidade</Label>
            <Select value={filters.severity} onChange={(e) => setFilters({ ...filters, severity: e.target.value })}>
              <option value="">Todas</option>
              {SEVERITIES.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>IP</Label>
            <Input value={filters.ip} onChange={(e) => setFilters({ ...filters, ip: e.target.value })} placeholder="10.10.20.5" />
          </div>
          <div className="space-y-2">
            <Label>Usuário</Label>
            <Input value={filters.username} onChange={(e) => setFilters({ ...filters, username: e.target.value })} placeholder="jsantos" />
          </div>
          <div className="space-y-2">
            <Label>MITRE</Label>
            <Input value={filters.mitreId} onChange={(e) => setFilters({ ...filters, mitreId: e.target.value })} placeholder="T1110" />
          </div>
          <div className="space-y-2">
            <Label>Busca textual</Label>
            <Input value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} placeholder="powershell" />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={load} disabled={loading}>
              {loading ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Filtrar
            </Button>
            <Button variant="outline" onClick={() => setFilters(emptyFilters)}>
              Limpar filtros
            </Button>
            <Button variant="outline" disabled={!hasActiveFilters || deleting} onClick={() => deleteLogs("filtered")}>
              <Trash2 className="h-4 w-4" /> Excluir filtrados
            </Button>
            <Button variant="destructive" disabled={deleting || logs.length === 0} onClick={() => deleteLogs("all")}>
              <Trash2 className="h-4 w-4" /> Limpar todos
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 rounded-xl border border-border/80 bg-secondary/40 p-1">
            <Button size="sm" variant={activeClass("raw")} onClick={() => setViewMode("raw")}><TerminalSquare className="h-4 w-4" /> Raw concentrado</Button>
            <Button size="sm" variant={activeClass("parser")} onClick={() => setViewMode("parser")}><Braces className="h-4 w-4" /> Parser</Button>
            <Button size="sm" variant={activeClass("ai")} onClick={() => setViewMode("ai")}><Bot className="h-4 w-4" /> IA</Button>
            <Button size="sm" variant={activeClass("table")} onClick={() => setViewMode("table")}><ListFilter className="h-4 w-4" /> Tabela</Button>
          </div>
        </div>

        {message && <p className="rounded-lg border border-border bg-secondary/60 p-3 text-sm text-foreground">{message}</p>}

        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum log encontrado para os filtros atuais.</p>
        ) : (
          <>
            {viewMode === "raw" && <RawLogConsole logs={logs} />}
            {viewMode === "parser" && <ParserViewer logs={logs} />}
            {viewMode === "ai" && <AiLogAnalysis logs={logs} />}
            {viewMode === "table" && <LogsTable logs={logs} />}
          </>
        )}
      </CardContent>
    </Card>
  );
}
