"use client";

import { useState } from "react";
import { CheckCircle2, Eye, FileSearch, Loader2, RotateCcw, Send, ShieldAlert, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RawLogConsole } from "@/components/tables/raw-log-console";
import { ParserViewer } from "@/components/tables/parser-viewer";

type CaseLog = {
  id: string;
  timestamp: string;
  vendor: string;
  eventType: string;
  severity: string;
  raw: string;
};

type CaseData = {
  id: string;
  title: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  briefing: string;
  createdAt: string;
};

type ScoreResult = {
  score: number;
  passed: boolean;
  breakdown: Record<string, number>;
  groundTruth: {
    classification: string;
    severity: string;
    mitreId: string;
    affectedUser: string;
    affectedHosts: string[];
    explanation: string;
  };
};

const initialAnswer = {
  classification: "inconclusive",
  severity: "medium",
  mitreId: "",
  affectedUser: "",
  affectedHosts: "",
  evidence: "",
  recommendedAction: "",
  confidence: 50
};

const SCORE_LABELS: Record<string, string> = {
  classification: "Classificação",
  severity: "Severidade",
  mitre: "MITRE ATT&CK",
  scope: "Escopo",
  evidence: "Evidências",
  response: "Resposta",
  confidence: "Confiança"
};

export function InvestigationLab() {
  const [difficulty, setDifficulty] = useState<CaseData["difficulty"]>("intermediate");
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [logs, setLogs] = useState<CaseLog[]>([]);
  const [answer, setAnswer] = useState(initialAnswer);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [logView, setLogView] = useState<"raw" | "parser">("raw");

  async function startCase() {
    setLoading(true);
    setMessage(null);
    setResult(null);
    setAnswer(initialAnswer);
    try {
      const response = await fetch("/api/investigation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Falha ao iniciar caso");
      setCaseData(data.case);
      setLogs(data.logs);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswer() {
    if (!caseData) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch("/api/investigation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: caseData.id, ...answer, confidence: Number(answer.confidence) })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Revise os campos obrigatórios da investigação");
      setResult(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro inesperado");
    } finally {
      setSubmitting(false);
    }
  }

  if (!caseData) {
    return (
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-emerald-500/25 bg-emerald-500/5">
          <CardHeader><CardTitle className="flex items-center gap-2"><FileSearch className="h-5 w-5 text-emerald-500" /> Como funciona</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>Você receberá logs correlacionados de Windows, FortiGate, Sysmon, Trend Vision One e Linux. Alguns eventos são evidências do incidente; outros são ruído benigno.</p>
            <p>O Ground Truth permanece oculto no servidor até o envio da análise. A nota considera classificação, severidade, MITRE, escopo, evidências, resposta e calibração da confiança.</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-card p-3"><p className="font-semibold text-foreground">Iniciante</p><p className="text-xs">Mais evidências e pouco ruído.</p></div>
              <div className="rounded-lg border border-border bg-card p-3"><p className="font-semibold text-foreground">Intermediário</p><p className="text-xs">Correlação e ruído moderado.</p></div>
              <div className="rounded-lg border border-border bg-card p-3"><p className="font-semibold text-foreground">Avançado</p><p className="text-xs">Menos sinais e muito ruído.</p></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Iniciar investigação</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Dificuldade</Label>
              <Select value={difficulty} onChange={(event) => setDifficulty(event.target.value as CaseData["difficulty"])}>
                <option value="beginner">Iniciante</option>
                <option value="intermediate">Intermediário</option>
                <option value="advanced">Avançado</option>
              </Select>
            </div>
            <Button className="w-full" onClick={startCase} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
              Gerar caso oculto
            </Button>
            {message && <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-200">{message}</p>}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {result && (
        <Card className={result.passed ? "border-emerald-500/40 bg-emerald-500/5" : "border-orange-500/40 bg-orange-500/5"}>
          <CardContent className="grid gap-6 pt-6 xl:grid-cols-[220px_1fr]">
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-5 text-center">
              <Trophy className={`h-8 w-8 ${result.passed ? "text-emerald-500" : "text-orange-500"}`} />
              <p className="mt-2 text-4xl font-bold text-foreground">{result.score}</p>
              <p className="text-xs text-muted-foreground">de 100 pontos</p>
              <Badge className={result.passed ? "mt-3 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" : "mt-3 border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-300"} variant="outline">{result.passed ? "Aprovado" : "Revisar análise"}</Badge>
            </div>
            <div className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {Object.entries(result.breakdown).map(([key, value]) => (
                  <div key={key} className="rounded-lg border border-border bg-card p-3"><p className="text-xs text-muted-foreground">{SCORE_LABELS[key] || key}</p><p className="text-xl font-semibold text-foreground">{value}</p></div>
                ))}
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="font-semibold text-foreground">Ground Truth</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{result.groundTruth.explanation}</p>
                <div className="mt-3 flex flex-wrap gap-2"><Badge>{result.groundTruth.classification}</Badge><Badge variant="outline">{result.groundTruth.severity}</Badge><Badge variant="outline">{result.groundTruth.mitreId}</Badge><Badge variant="secondary">{result.groundTruth.affectedUser}</Badge></div>
              </div>
              <Button variant="outline" onClick={() => { setCaseData(null); setLogs([]); setResult(null); }}><RotateCcw className="h-4 w-4" /> Novo caso</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><CardTitle>{caseData.title}</CardTitle><p className="mt-2 text-sm text-muted-foreground">{caseData.briefing}</p></div>
            <div className="flex gap-2"><Badge variant="outline">{caseData.difficulty}</Badge><Badge variant="secondary">{logs.length} eventos</Badge></div>
          </div>
        </CardHeader>
      </Card>

      <div className="flex gap-2">
        <Button size="sm" variant={logView === "raw" ? "default" : "outline"} onClick={() => setLogView("raw")}><Eye className="h-4 w-4" /> Raw timeline</Button>
        <Button size="sm" variant={logView === "parser" ? "default" : "outline"} onClick={() => setLogView("parser")}><FileSearch className="h-4 w-4" /> Parser</Button>
      </div>
      {logView === "raw" ? <RawLogConsole logs={logs} /> : <ParserViewer logs={logs} />}

      <Card>
        <CardHeader><CardTitle>Relatório do analista</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><Label>Classificação</Label><Select value={answer.classification} onChange={(e) => setAnswer({ ...answer, classification: e.target.value })}><option value="inconclusive">Inconclusivo</option><option value="true_positive">Verdadeiro positivo</option><option value="false_positive">Falso positivo</option></Select></div>
          <div className="space-y-2"><Label>Severidade</Label><Select value={answer.severity} onChange={(e) => setAnswer({ ...answer, severity: e.target.value })}><option value="informational">Informacional</option><option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option><option value="critical">Crítica</option></Select></div>
          <div className="space-y-2"><Label>MITRE ATT&CK principal</Label><Input value={answer.mitreId} onChange={(e) => setAnswer({ ...answer, mitreId: e.target.value })} placeholder="Ex.: T1110.001" /></div>
          <div className="space-y-2"><Label>Usuário afetado</Label><Input value={answer.affectedUser} onChange={(e) => setAnswer({ ...answer, affectedUser: e.target.value })} placeholder="domínio\\usuário" /></div>
          <div className="space-y-2 md:col-span-2"><Label>Hosts afetados</Label><Input value={answer.affectedHosts} onChange={(e) => setAnswer({ ...answer, affectedHosts: e.target.value })} placeholder="Separe os hosts identificados por vírgula" /></div>
          <div className="space-y-2 md:col-span-2"><Label>Evidências técnicas</Label><Textarea rows={5} value={answer.evidence} onChange={(e) => setAnswer({ ...answer, evidence: e.target.value })} placeholder="Liste os Event IDs, correlações, origem, horários e comportamentos relevantes..." /></div>
          <div className="space-y-2 md:col-span-2"><Label>Ação recomendada</Label><Textarea rows={4} value={answer.recommendedAction} onChange={(e) => setAnswer({ ...answer, recommendedAction: e.target.value })} placeholder="Descreva validação, contenção e próximos passos..." /></div>
          <div className="space-y-2"><Label>Confiança da conclusão: {answer.confidence}%</Label><Input type="range" min={0} max={100} value={answer.confidence} onChange={(e) => setAnswer({ ...answer, confidence: Number(e.target.value) })} /></div>
          <div className="flex items-end justify-end"><Button onClick={submitAnswer} disabled={submitting || Boolean(result)}>{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : result ? <CheckCircle2 className="h-4 w-4" /> : <Send className="h-4 w-4" />}{result ? "Análise avaliada" : "Enviar para avaliação"}</Button></div>
          {message && <p className="md:col-span-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-200">{message}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
