"use client";

import { useEffect, useState } from "react";
import { Bot, Braces, ListFilter, RefreshCcw, Search, TerminalSquare } from "lucide-react";
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

export function GeneratedLogsClient() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("raw");
  const [filters, setFilters] = useState({ vendor: "", severity: "", ip: "", username: "", mitreId: "", q: "" });

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => value && params.set(key, value));
    params.set("take", "300");
    const response = await fetch(`/api/logs?${params.toString()}`);
    const data = await response.json();
    setLogs(data.logs || []);
    setLoading(false);
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
            <Button variant="outline" onClick={() => setFilters({ vendor: "", severity: "", ip: "", username: "", mitreId: "", q: "" })}>
              Limpar
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 rounded-xl border border-border/80 bg-secondary/40 p-1">
            <Button size="sm" variant={activeClass("raw")} onClick={() => setViewMode("raw")}><TerminalSquare className="h-4 w-4" /> Raw concentrado</Button>
            <Button size="sm" variant={activeClass("parser")} onClick={() => setViewMode("parser")}><Braces className="h-4 w-4" /> Parser</Button>
            <Button size="sm" variant={activeClass("ai")} onClick={() => setViewMode("ai")}><Bot className="h-4 w-4" /> IA</Button>
            <Button size="sm" variant={activeClass("table")} onClick={() => setViewMode("table")}><ListFilter className="h-4 w-4" /> Tabela</Button>
          </div>
        </div>

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
