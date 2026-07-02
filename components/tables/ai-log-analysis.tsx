"use client";

import { useMemo, useState } from "react";
import { Bot, Copy, Loader2, Sparkles, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type AnalysisLog = {
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

type AnalysisResult = {
  provider: "mock" | "openai" | "ollama";
  model?: string;
  verdict: "true_positive" | "false_positive" | "needs_review" | "benign";
  severity: string;
  confidence: number;
  riskScore: number;
  summary: string;
  evidence: string[];
  parserAdjustments: string[];
  recommendedFixes: string[];
  responseSteps: string[];
  detectionLogic: string;
  normalizedEvent: Record<string, string | number | boolean | null>;
};

export function AiLogAnalysis({ logs }: { logs: AnalysisLog[] }) {
  const [selectedId, setSelectedId] = useState(logs[0]?.id || "");
  const [provider, setProvider] = useState<"mock" | "openai" | "ollama">("mock");
  const [objective, setObjective] = useState("Analise o log como SOC N1/N2. Identifique evidências, severidade, falso positivo, ajuste de parser e resposta recomendada.");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");

  const selected = useMemo(() => logs.find((log) => log.id === selectedId) || logs[0], [logs, selectedId]);

  async function analyze() {
    if (!selected) return;
    setLoading(true);
    setError("");
    setResult(null);

    const response = await fetch("/api/ai-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, objective, logs: [selected] })
    });

    const data = await response.json().catch(() => null);
    setLoading(false);

    if (!response.ok) {
      setError(data?.error || "Falha ao analisar o log.");
      return;
    }

    setResult(data.analysis);
  }

  async function copyResult() {
    if (!result) return;
    await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
  }

  if (!selected) return <p className="text-sm text-muted-foreground">Nenhum log disponível para análise.</p>;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" /> IA para análise e ajuste</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Log alvo</Label>
                <Select value={selected.id} onChange={(event) => setSelectedId(event.target.value)}>
                  {logs.map((log) => (
                    <option key={log.id} value={log.id}>{new Date(log.timestamp).toLocaleString("pt-BR")} | {log.vendor} | {log.eventType} | {log.severity}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select value={provider} onChange={(event) => setProvider(event.target.value as "mock" | "openai" | "ollama")}>
                  <option value="mock">Mock local</option>
                  <option value="openai">OpenAI API</option>
                  <option value="ollama">Ollama local</option>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Objetivo da análise</Label>
              <Textarea value={objective} onChange={(event) => setObjective(event.target.value)} rows={4} />
            </div>
            <Button onClick={analyze} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Analisar e sugerir ajustes
            </Button>
            {error && <p className="text-sm text-red-300">{error}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wand2 className="h-5 w-5" /> Log selecionado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Fabricante</span><span>{selected.vendor}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Evento</span><span>{selected.eventType}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Severidade</span><Badge variant={selected.severity as never}>{selected.severity}</Badge></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">MITRE</span><span>{selected.mitreId || "benigno"}</span></div>
            <pre className="max-h-56 overflow-auto rounded-lg bg-black/60 p-3 text-xs text-emerald-100">{selected.raw}</pre>
          </CardContent>
        </Card>
      </div>

      {result && (
        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>Resultado da análise</CardTitle>
                <Button size="sm" variant="outline" onClick={copyResult}><Copy className="h-4 w-4" /> Copiar análise</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-lg border border-border/80 bg-secondary/40 p-3"><div className="text-xs text-muted-foreground">Veredito</div><div className="mt-1 font-semibold text-foreground">{result.verdict}</div></div>
                <div className="rounded-lg border border-border/80 bg-secondary/40 p-3"><div className="text-xs text-muted-foreground">Severidade</div><div className="mt-1 font-semibold text-foreground">{result.severity}</div></div>
                <div className="rounded-lg border border-border/80 bg-secondary/40 p-3"><div className="text-xs text-muted-foreground">Confiança</div><div className="mt-1 font-semibold text-foreground">{Math.round(result.confidence * 100)}%</div></div>
                <div className="rounded-lg border border-border/80 bg-secondary/40 p-3"><div className="text-xs text-muted-foreground">Risco</div><div className="mt-1 font-semibold text-foreground">{result.riskScore}/100</div></div>
              </div>
              <p className="text-sm leading-6 text-foreground">{result.summary}</p>
              <div>
                <h4 className="mb-2 text-sm font-semibold text-foreground">Lógica de detecção sugerida</h4>
                <pre className="overflow-auto rounded-lg bg-black/60 p-3 text-xs text-cyan-700 dark:text-cyan-100">{result.detectionLogic}</pre>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Normalização</CardTitle></CardHeader>
            <CardContent>
              <pre className="max-h-80 overflow-auto rounded-lg bg-black/60 p-3 text-xs text-emerald-100">{JSON.stringify(result.normalizedEvent, null, 2)}</pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Evidências</CardTitle></CardHeader>
            <CardContent><List items={result.evidence} /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Ajustes de parser</CardTitle></CardHeader>
            <CardContent><List items={result.parserAdjustments} /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Resposta recomendada</CardTitle></CardHeader>
            <CardContent><List items={result.responseSteps} /></CardContent>
          </Card>
          <Card className="xl:col-span-3">
            <CardHeader><CardTitle>Correções recomendadas no evento</CardTitle></CardHeader>
            <CardContent><List items={result.recommendedFixes} /></CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm text-muted-foreground">
      {items.map((item) => <li key={item}>• {item}</li>)}
    </ul>
  );
}
