"use client";

import { useState } from "react";
import { Activity, Braces, Check, Clipboard, Code2, Database, FileCode2, FileText, FlaskConical, Gauge, Loader2, Network, Play, Radar, RotateCcw, Server, ShieldCheck, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RawLogConsole } from "@/components/tables/raw-log-console";

type View = "overview" | "dataset" | "detection" | "parser" | "report";

type LabLog = { id: string; timestamp: string; vendor: string; eventType: string; severity: string; raw: string };

type LabDataset = {
  runId: string;
  name: string;
  scenario: { summary: string; attackPath: string[]; mitre: string[] };
  cmdb: Array<{ hostname: string; ip: string; role: string; os: string; criticality: string; owner: string; exposure: string; collector: string; status: string }>;
  baselines: Array<{ entity: string; metric: string; expected: string; observed: string; deviation: string }>;
  telemetry: { inputEvents: number; visibleEvents: number; unavailableEvents: number; droppedEvents: number; duplicatedEvents: number; corruptedEvents: number; clockSkewSeconds: number; health: string };
  coverage: { required: Array<{ source: string; component: string; reason: string; available: boolean }>; percentage: number; missing: string[] };
  detectionPack: Record<string, string>;
  normalization: { ocsf: unknown[]; opentelemetry: unknown[] };
  atomic: { technique: string; name: string; testPlan: string; expectedTelemetry: string[]; validationGoal: string };
  parserChallenge: { raw: string; fields: string[]; targets: string[] };
  logs: LabLog[];
};

type ValidationResult = {
  metrics: { truePositives: number; falsePositives: number; falseNegatives: number; trueNegatives: number; precision: number; recall: number; f1: number; detectionLatencySeconds: number | null };
  rule: { threshold: number; timespanMinutes: number };
  artifacts: Record<string, string>;
  tuning: string;
  incidentReport: { title: string; classification: string; severity: string; destinationHosts: string; user: string; mitre: string; summary: string; confirmedEvidence: string[]; hypotheses: string[]; missingData: string[]; inference: string; action: string; confidence: string };
};

const SOURCES = ["Windows Security", "Sysmon", "FortiGate", "Trend Vision One", "Linux Auditd"] as const;
const NAV: Array<{ id: View; label: string; icon: typeof Activity }> = [
  { id: "overview", label: "Ambiente", icon: Server },
  { id: "dataset", label: "Dataset", icon: Database },
  { id: "detection", label: "Detection-as-Code", icon: Code2 },
  { id: "parser", label: "Parser Challenge", icon: Braces },
  { id: "report", label: "Relatório e Atomic", icon: FileText }
];

function CodeBlock({ title, content }: { title: string; content: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }
  return (
    <Card>
      <CardHeader className="pb-2"><div className="flex items-center justify-between gap-2"><CardTitle className="text-sm">{title}</CardTitle><Button size="sm" variant="outline" onClick={copy}>{copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />} Copiar</Button></div></CardHeader>
      <CardContent><pre className="max-h-[360px] overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-background p-3 font-mono text-xs leading-5 text-foreground">{content}</pre></CardContent>
    </Card>
  );
}

export function DetectionEngineeringLab() {
  const [difficulty, setDifficulty] = useState("intermediate");
  const [noiseLevel, setNoiseLevel] = useState(45);
  const [dropRate, setDropRate] = useState(5);
  const [duplicateRate, setDuplicateRate] = useState(3);
  const [clockSkewSeconds, setClockSkewSeconds] = useState(30);
  const [parserCorruptionRate, setParserCorruptionRate] = useState(3);
  const [availableSources, setAvailableSources] = useState<string[]>([...SOURCES]);
  const [dataset, setDataset] = useState<LabDataset | null>(null);
  const [view, setView] = useState<View>("overview");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(10);
  const [timespanMinutes, setTimespanMinutes] = useState(15);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [parserScore, setParserScore] = useState<{ score: number; correct: number; total: number; expected: Record<string, string> } | null>(null);

  function toggleSource(source: string) {
    setAvailableSources((current) => current.includes(source) ? current.filter((item) => item !== source) : [...current, source]);
  }

  async function startLab() {
    setLoading(true);
    setMessage(null);
    setValidation(null);
    setParserScore(null);
    setMappings({});
    try {
      const response = await fetch("/api/detection-lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty, noiseLevel, dropRate, duplicateRate, clockSkewSeconds, parserCorruptionRate, availableSources })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Falha ao iniciar Detection Lab");
      setDataset(data);
      setView("overview");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function validateRule() {
    if (!dataset) return;
    setValidating(true);
    setMessage(null);
    try {
      const response = await fetch("/api/detection-lab", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: dataset.runId, threshold, timespanMinutes })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Falha ao validar regra");
      setValidation(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro inesperado");
    } finally {
      setValidating(false);
    }
  }

  async function submitParser() {
    if (!dataset) return;
    const response = await fetch("/api/detection-lab", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ runId: dataset.runId, mappings }) });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error || "Falha ao avaliar parser");
    setParserScore(data);
  }

  if (!dataset) {
    return (
      <div className="space-y-6">
        <Card className="border-emerald-500/25 bg-emerald-500/5">
          <CardHeader><CardTitle className="flex items-center gap-2"><FlaskConical className="h-5 w-5 text-emerald-500" /> Laboratório reproduzível de detecção</CardTitle></CardHeader>
          <CardContent className="grid gap-4 text-sm text-muted-foreground lg:grid-cols-3">
            <div><p className="font-semibold text-foreground">1. Gere o ambiente</p><p className="mt-1 leading-6">CMDB, baseline, ataque correlacionado, atividade legítima e falhas de telemetria.</p></div>
            <div><p className="font-semibold text-foreground">2. Valide a regra</p><p className="mt-1 leading-6">Ajuste threshold e janela para medir TP, FP, FN, precisão, recall e latência.</p></div>
            <div><p className="font-semibold text-foreground">3. Melhore a cobertura</p><p className="mt-1 leading-6">Analise gaps, normalize os dados, pratique parsing e exporte Detection-as-Code.</p></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Configuração do ambiente</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2"><Label>Dificuldade</Label><Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}><option value="beginner">Iniciante</option><option value="intermediate">Intermediário</option><option value="advanced">Avançado</option></Select></div>
            <div className="space-y-2"><Label>Ruído benigno: {noiseLevel}%</Label><Input type="range" min={0} max={90} value={noiseLevel} onChange={(e) => setNoiseLevel(Number(e.target.value))} /></div>
            <div className="space-y-2"><Label>Perda de eventos: {dropRate}%</Label><Input type="range" min={0} max={40} value={dropRate} onChange={(e) => setDropRate(Number(e.target.value))} /></div>
            <div className="space-y-2"><Label>Duplicação: {duplicateRate}%</Label><Input type="range" min={0} max={30} value={duplicateRate} onChange={(e) => setDuplicateRate(Number(e.target.value))} /></div>
            <div className="space-y-2"><Label>Clock skew: {clockSkewSeconds}s</Label><Input type="range" min={0} max={600} step={10} value={clockSkewSeconds} onChange={(e) => setClockSkewSeconds(Number(e.target.value))} /></div>
            <div className="space-y-2"><Label>Campos corrompidos: {parserCorruptionRate}%</Label><Input type="range" min={0} max={30} value={parserCorruptionRate} onChange={(e) => setParserCorruptionRate(Number(e.target.value))} /></div>
            <div className="md:col-span-2 xl:col-span-3">
              <Label>Fontes disponíveis</Label>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{SOURCES.map((source) => <button type="button" key={source} onClick={() => toggleSource(source)} className={`rounded-lg border p-3 text-left text-sm transition ${availableSources.includes(source) ? "border-emerald-500/40 bg-emerald-500/10 text-foreground" : "border-border bg-secondary/20 text-muted-foreground"}`}>{availableSources.includes(source) ? "✓ " : "○ "}{source}</button>)}</div>
            </div>
            <div className="md:col-span-2 xl:col-span-3"><Button onClick={startLab} disabled={loading || availableSources.length === 0}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Gerar laboratório</Button></div>
            {message && <p className="md:col-span-2 xl:col-span-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-200">{message}</p>}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <div><p className="font-semibold text-foreground">{dataset.name}</p><p className="mt-1 text-sm text-muted-foreground">{dataset.scenario.summary}</p></div>
          <Button variant="outline" onClick={() => setDataset(null)}><RotateCcw className="h-4 w-4" /> Nova execução</Button>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-2">
        {NAV.map((item) => { const Icon = item.icon; return <Button key={item.id} size="sm" variant={view === item.id ? "default" : "outline"} onClick={() => setView(item.id)}><Icon className="h-4 w-4" /> {item.label}</Button>; })}
      </div>
      {message && <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-200">{message}</p>}

      {view === "overview" && (
        <div className="space-y-5">
          <Card><CardContent className="pt-6"><p className="text-sm font-semibold text-foreground">Attack Path correlacionado</p><div className="mt-3 flex flex-wrap items-center gap-2">{dataset.scenario.attackPath.map((phase, index) => <div key={phase} className="flex items-center gap-2"><Badge variant="outline">{phase}</Badge>{index < dataset.scenario.attackPath.length - 1 && <span className="text-muted-foreground">→</span>}</div>)}</div><div className="mt-3 flex flex-wrap gap-2">{dataset.scenario.mitre.map((item) => <Badge key={item} variant="secondary">{item}</Badge>)}</div></CardContent></Card>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <Card><CardContent className="pt-5"><Activity className="h-5 w-5 text-emerald-500" /><p className="mt-2 text-2xl font-bold">{dataset.telemetry.visibleEvents}</p><p className="text-xs text-muted-foreground">Eventos visíveis</p></CardContent></Card>
            <Card><CardContent className="pt-5"><TriangleAlert className="h-5 w-5 text-orange-500" /><p className="mt-2 text-2xl font-bold">{dataset.telemetry.droppedEvents}</p><p className="text-xs text-muted-foreground">Eventos perdidos</p></CardContent></Card>
            <Card><CardContent className="pt-5"><Network className="h-5 w-5 text-red-500" /><p className="mt-2 text-2xl font-bold">{dataset.telemetry.unavailableEvents}</p><p className="text-xs text-muted-foreground">Fonte indisponível</p></CardContent></Card>
            <Card><CardContent className="pt-5"><Database className="h-5 w-5 text-sky-500" /><p className="mt-2 text-2xl font-bold">{dataset.telemetry.duplicatedEvents}</p><p className="text-xs text-muted-foreground">Duplicados</p></CardContent></Card>
            <Card><CardContent className="pt-5"><Braces className="h-5 w-5 text-violet-500" /><p className="mt-2 text-2xl font-bold">{dataset.telemetry.corruptedEvents}</p><p className="text-xs text-muted-foreground">Parsing degradado</p></CardContent></Card>
            <Card><CardContent className="pt-5"><Radar className="h-5 w-5 text-emerald-500" /><p className="mt-2 text-2xl font-bold">{dataset.coverage.percentage}%</p><p className="text-xs text-muted-foreground">Cobertura de fontes</p></CardContent></Card>
          </div>

          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Server className="h-5 w-5" /> CMDB sintética</CardTitle></CardHeader><CardContent><div className="overflow-auto rounded-lg border border-border"><Table><TableHeader><TableRow><TableHead>Hostname</TableHead><TableHead>IP</TableHead><TableHead>Função</TableHead><TableHead>SO</TableHead><TableHead>Criticidade</TableHead><TableHead>Coletor</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{dataset.cmdb.map((asset) => <TableRow key={asset.hostname}><TableCell className="font-mono text-xs">{asset.hostname}</TableCell><TableCell className="font-mono text-xs">{asset.ip}</TableCell><TableCell>{asset.role}</TableCell><TableCell>{asset.os}</TableCell><TableCell><Badge variant={asset.criticality as never}>{asset.criticality}</Badge></TableCell><TableCell>{asset.collector}</TableCell><TableCell>{asset.status}</TableCell></TableRow>)}</TableBody></Table></div></CardContent></Card>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Gauge className="h-5 w-5" /> Baseline comportamental</CardTitle></CardHeader><CardContent className="space-y-3">{dataset.baselines.map((item) => <div key={`${item.entity}-${item.metric}`} className="rounded-lg border border-border p-3"><div className="flex items-start justify-between gap-2"><p className="font-mono text-sm text-foreground">{item.entity}</p><Badge variant={item.deviation === "critical" ? "critical" : item.deviation === "high" ? "high" : "low"}>{item.deviation}</Badge></div><p className="mt-2 text-xs text-muted-foreground">{item.metric}</p><p className="mt-1 text-sm">Esperado: {item.expected}</p><p className="text-sm">Observado: {item.observed}</p></div>)}</CardContent></Card>
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Network className="h-5 w-5" /> Coverage Gap</CardTitle></CardHeader><CardContent className="space-y-3">{dataset.coverage.required.map((item) => <div key={item.source} className={`rounded-lg border p-3 ${item.available ? "border-emerald-500/25 bg-emerald-500/5" : "border-red-500/25 bg-red-500/5"}`}><div className="flex items-center justify-between"><p className="font-semibold">{item.source}</p><Badge variant={item.available ? "low" : "critical"}>{item.available ? "Disponível" : "Gap"}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{item.component}</p><p className="mt-1 text-sm">{item.reason}</p></div>)}</CardContent></Card>
          </div>
        </div>
      )}

      {view === "dataset" && (
        <div className="space-y-5">
          <RawLogConsole logs={dataset.logs} />
          <div className="grid gap-5 xl:grid-cols-2">
            <CodeBlock title="OCSF normalizado" content={JSON.stringify(dataset.normalization.ocsf, null, 2)} />
            <CodeBlock title="OpenTelemetry LogRecord" content={JSON.stringify(dataset.normalization.opentelemetry, null, 2)} />
          </div>
        </div>
      )}

      {view === "detection" && (
        <div className="space-y-5">
          <Card><CardHeader><CardTitle>Validação da regra</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-3"><div className="space-y-2"><Label>Threshold de falhas</Label><Input type="number" min={2} max={100} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} /></div><div className="space-y-2"><Label>Janela em minutos</Label><Input type="number" min={1} max={120} value={timespanMinutes} onChange={(e) => setTimespanMinutes(Number(e.target.value))} /></div><div className="flex items-end"><Button onClick={validateRule} disabled={validating}>{validating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Executar contra Ground Truth</Button></div></CardContent></Card>
          {validation && <><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">{Object.entries({ TP: validation.metrics.truePositives, FP: validation.metrics.falsePositives, FN: validation.metrics.falseNegatives, TN: validation.metrics.trueNegatives, Precision: validation.metrics.precision, Recall: validation.metrics.recall, F1: validation.metrics.f1 }).map(([label, value]) => <Card key={label}><CardContent className="pt-5"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></CardContent></Card>)}</div><p className="rounded-lg border border-border bg-secondary/40 p-3 text-sm"><strong>Tuning:</strong> {validation.tuning} Latência: {validation.metrics.detectionLatencySeconds ?? "N/A"}s.</p></>}
          <div className="grid gap-5 xl:grid-cols-2">{Object.entries(validation?.artifacts || dataset.detectionPack).map(([name, content]) => <CodeBlock key={name} title={name.toUpperCase()} content={content} />)}</div>
        </div>
      )}

      {view === "parser" && (
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <Card><CardHeader><CardTitle>Raw desconhecido</CardTitle></CardHeader><CardContent><pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-background p-3 font-mono text-xs leading-6">{dataset.parserChallenge.raw}</pre></CardContent></Card>
          <Card><CardHeader><CardTitle>Mapeamento de campos</CardTitle></CardHeader><CardContent className="space-y-4">{dataset.parserChallenge.fields.map((field) => <div key={field} className="grid grid-cols-[1fr_1.3fr] items-center gap-3"><code className="rounded bg-secondary px-2 py-1 text-xs">{field}</code><Select value={mappings[field] || ""} onChange={(e) => setMappings({ ...mappings, [field]: e.target.value })}><option value="">Selecione...</option>{dataset.parserChallenge.targets.map((target) => <option key={target} value={target}>{target}</option>)}</Select></div>)}<Button className="w-full" onClick={submitParser}>Avaliar parser</Button>{parserScore && <div className={`rounded-lg border p-4 ${parserScore.score === 100 ? "border-emerald-500/30 bg-emerald-500/10" : "border-orange-500/30 bg-orange-500/10"}`}><p className="text-3xl font-bold">{parserScore.score}/100</p><p className="text-sm text-muted-foreground">{parserScore.correct} de {parserScore.total} campos corretos</p>{parserScore.score < 100 && <pre className="mt-3 whitespace-pre-wrap text-xs">{JSON.stringify(parserScore.expected, null, 2)}</pre>}</div>}</CardContent></Card>
        </div>
      )}

      {view === "report" && (
        <div className="grid gap-5 xl:grid-cols-2">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><FileCode2 className="h-5 w-5" /> Atomic Red Team Mapping</CardTitle></CardHeader><CardContent className="space-y-3"><div className="flex gap-2"><Badge>{dataset.atomic.technique}</Badge><Badge variant="secondary">{dataset.atomic.name}</Badge></div><p className="text-sm leading-6 text-muted-foreground">{dataset.atomic.testPlan}</p><p className="font-semibold">Telemetria esperada</p><ul className="space-y-1 text-sm text-muted-foreground">{dataset.atomic.expectedTelemetry.map((item) => <li key={item}>• {item}</li>)}</ul><p className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">Objetivo: {dataset.atomic.validationGoal}</p></CardContent></Card>
          <Card><CardHeader><CardTitle>Incident Report Copilot</CardTitle></CardHeader><CardContent>{validation ? <div className="space-y-3 text-sm"><p><strong>Incident Title:</strong> {validation.incidentReport.title}</p><p><strong>Classification:</strong> {validation.incidentReport.classification}</p><p><strong>Severity:</strong> {validation.incidentReport.severity}</p><p><strong>Destination Hostname:</strong> {validation.incidentReport.destinationHosts}</p><p><strong>User:</strong> {validation.incidentReport.user}</p><p><strong>MITRE:</strong> {validation.incidentReport.mitre}</p><div><strong>Resumo do evento:</strong><p className="mt-1 leading-6 text-muted-foreground">{validation.incidentReport.summary}</p></div><div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-3"><strong>Evidências confirmadas:</strong><ul className="mt-1 space-y-1 text-muted-foreground">{validation.incidentReport.confirmedEvidence.map((item) => <li key={item}>• {item}</li>)}</ul></div><div className="rounded-lg border border-yellow-500/25 bg-yellow-500/5 p-3"><strong>Hipóteses:</strong><ul className="mt-1 space-y-1 text-muted-foreground">{validation.incidentReport.hypotheses.map((item) => <li key={item}>• {item}</li>)}</ul></div><div className="rounded-lg border border-red-500/25 bg-red-500/5 p-3"><strong>Dados ausentes:</strong><ul className="mt-1 space-y-1 text-muted-foreground">{validation.incidentReport.missingData.map((item) => <li key={item}>• {item}</li>)}</ul></div><div><strong>Inferência:</strong><p className="mt-1 leading-6 text-muted-foreground">{validation.incidentReport.inference}</p></div><div><strong>Ação recomendada:</strong><p className="mt-1 leading-6 text-muted-foreground">{validation.incidentReport.action}</p></div><p><strong>Confiança:</strong> {validation.incidentReport.confidence}</p></div> : <div className="rounded-lg border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">Execute a validação da regra para gerar o relatório com métricas e confiança baseadas no resultado.</div>}</CardContent></Card>
        </div>
      )}
    </div>
  );
}
