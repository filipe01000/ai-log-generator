"use client";

import { useMemo, useState } from "react";
import { Braces, Copy, KeyRound, Search, ShieldCheck, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { parseRawLog } from "@/lib/parser";

export type ParserLog = {
  id: string;
  timestamp: string;
  vendor: string;
  eventType: string;
  severity: string;
  raw: string;
};

const FIELD_LABELS: Record<string, string> = {
  timestamp: "Tempo",
  vendor: "Fabricante",
  eventType: "Evento",
  severity: "Severidade",
  action: "Ação",
  sourceIp: "IP origem",
  sourcePort: "Porta origem",
  destinationIp: "IP destino",
  destinationPort: "Porta destino",
  protocol: "Protocolo",
  username: "Usuário",
  hostname: "Host",
  process: "Processo",
  commandLine: "Comando",
  url: "URL",
  userAgent: "User Agent",
  hash: "Hash",
  mitreId: "MITRE"
};

export function ParserViewer({ logs }: { logs: ParserLog[] }) {
  const [selectedId, setSelectedId] = useState(logs[0]?.id || "");
  const [query, setQuery] = useState("");
  const selected = logs.find((log) => log.id === selectedId) || logs[0];

  const parsed = useMemo(() => selected ? parseRawLog(selected.raw, selected.vendor) : null, [selected]);

  async function copyParserJson() {
    if (!parsed) return;
    await navigator.clipboard.writeText(JSON.stringify(parsed, null, 2));
  }

  if (!selected || !parsed) {
    return <p className="text-sm text-muted-foreground">Nenhum log disponível para parser.</p>;
  }

  const q = query.toLowerCase().trim();
  const normalizedEntries = Object.entries(parsed.normalized).filter(([key, value]) =>
    Boolean(value) && (!q || `${FIELD_LABELS[key] || key} ${key} ${value}`.toLowerCase().includes(q))
  );
  const rawEntries = Object.entries(parsed.fields).filter(([key, value]) =>
    key !== "raw" && (!q || `${key} ${value}`.toLowerCase().includes(q))
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
        <Select value={selected.id} onChange={(event) => setSelectedId(event.target.value)}>
          {logs.map((log) => (
            <option key={log.id} value={log.id}>{new Date(log.timestamp).toLocaleString("pt-BR")} | {log.vendor} | {log.eventType} | {log.severity}</option>
          ))}
        </Select>
        <Button variant="outline" onClick={copyParserJson}><Copy className="h-4 w-4" /> Copiar parser JSON</Button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9 pr-28" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar no Parser: campo, valor, IP, usuário, ação..." />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {query && <Badge variant="outline">{normalizedEntries.length + rawEntries.length} resultado(s)</Badge>}
          {query && <button type="button" onClick={() => setQuery("")} aria-label="Limpar pesquisa" className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"><X className="h-4 w-4" /></button>}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm"><Braces className="h-4 w-4" /> Tipo de parser</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Formato</span><Badge variant="secondary">{parsed.format}</Badge></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Confiança</span><span>{Math.round(parsed.confidence * 100)}%</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Campos extraídos</span><span>{rawEntries.length}</span></div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm"><ShieldCheck className="h-4 w-4" /> Observações do parser</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {parsed.observations.map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4" /> Campos normalizados para investigação SOC</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {normalizedEntries.map(([key, value]) => (
              <div key={key} className="rounded-lg border border-border/80 bg-secondary/40 p-3">
                <div className="text-xs text-muted-foreground">{FIELD_LABELS[key] || key}</div>
                <div className="mt-1 break-words font-mono text-sm text-foreground">{value}</div>
              </div>
            ))}
            {normalizedEntries.length === 0 && <p className="text-sm text-muted-foreground">Nenhum campo normalizado corresponde à pesquisa.</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campos extraídos do raw</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[420px] overflow-auto rounded-xl border border-border/80">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/60">
                  <TableHead>Campo original</TableHead>
                  <TableHead>Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rawEntries.map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell className="font-mono text-xs text-cyan-700 dark:text-cyan-100">{key}</TableCell>
                    <TableCell className="break-all font-mono text-xs">{value}</TableCell>
                  </TableRow>
                ))}
                {rawEntries.length === 0 && (
                  <TableRow><TableCell colSpan={2} className="py-8 text-center text-sm text-muted-foreground">Nenhum campo extraído corresponde à pesquisa.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
