"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { BrainCircuit, Loader2 } from "lucide-react";
import { COMPANY_TYPES, EVENT_TYPES, EXPORT_FORMATS, MANUFACTURERS, SEVERITIES } from "@/lib/constants";
import { aiScenarioSchema, type AiScenarioInput } from "@/lib/validators";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { LogsTable } from "@/components/tables/logs-table";

type ScenarioResult = {
  scenario: {
    id: string;
    name: string;
    summary: string;
    timeline: { phase: string; offset: string; description: string }[];
    iocs: { type: string; value: string; confidence: number }[];
    ttps: { tactic: string; technique: string; subTechnique?: string | null; mitreId: string; severity: string; confidence: number; riskScore: number; detection: string; recommendation: string }[];
    provider: string;
    model?: string;
  };
  logs: any[];
};

export function AiBuilderForm() {
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<AiScenarioInput>({
    resolver: zodResolver(aiScenarioSchema),
    defaultValues: {
      companyType: "Empresa média",
      assetCount: 120,
      userCount: 450,
      attackType: "Ransomware",
      durationHours: 8,
      noiseLevel: 35,
      severity: "critical",
      vendors: ["FortiGate", "Windows Security", "Sysmon", "Wazuh"],
      outputFormat: "json",
      logCount: 180,
      aiProvider: "mock"
    }
  });

  const selectedVendors = form.watch("vendors") || [];

  function toggleVendor(vendor: (typeof MANUFACTURERS)[number]) {
    const current = form.getValues("vendors") || [];
    const next = current.includes(vendor) ? current.filter((item) => item !== vendor) : [...current, vendor];
    form.setValue("vendors", next as AiScenarioInput["vendors"], { shouldValidate: true });
  }

  async function onSubmit(values: AiScenarioInput) {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/ai-scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Falha ao gerar cenário");
      setResult(data);
      setMessage(`Cenário criado com ${data.logs.length} logs. Provider usado: ${data.scenario.provider}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Construtor de cenário com IA</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 xl:grid-cols-4">
            <div className="space-y-2">
              <Label>Tipo de empresa</Label>
              <Select {...form.register("companyType")}>
                {COMPANY_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ativos</Label>
              <Input type="number" {...form.register("assetCount")} />
            </div>
            <div className="space-y-2">
              <Label>Usuários</Label>
              <Input type="number" {...form.register("userCount")} />
            </div>
            <div className="space-y-2">
              <Label>Tipo de ataque</Label>
              <Select {...form.register("attackType")}>
                {EVENT_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duração em horas</Label>
              <Input type="number" {...form.register("durationHours")} />
            </div>
            <div className="space-y-2">
              <Label>Ruído benigno %</Label>
              <Input type="number" {...form.register("noiseLevel")} />
            </div>
            <div className="space-y-2">
              <Label>Severidade</Label>
              <Select {...form.register("severity")}>
                {SEVERITIES.map((item) => <option key={item} value={item}>{item}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Formato</Label>
              <Select {...form.register("outputFormat")}>
                {EXPORT_FORMATS.map((item) => <option key={item} value={item}>{item.toUpperCase()}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Qtd. logs</Label>
              <Input type="number" min={10} max={5000} {...form.register("logCount")} />
            </div>
            <div className="space-y-2">
              <Label>Provider IA</Label>
              <Select {...form.register("aiProvider")}>
                <option value="mock">Mock híbrido</option>
                <option value="openai">OpenAI API</option>
                <option value="ollama">Ollama local</option>
              </Select>
            </div>

            <div className="xl:col-span-4">
              <Label>Fabricantes envolvidos</Label>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
                {MANUFACTURERS.map((vendor) => (
                  <button
                    key={vendor}
                    type="button"
                    onClick={() => toggleVendor(vendor)}
                    className={`rounded-lg border px-3 py-2 text-left text-xs transition ${selectedVendors.includes(vendor) ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-200" : "border-border bg-card text-muted-foreground hover:bg-secondary/60 hover:text-foreground"}`}
                  >
                    {vendor}
                  </button>
                ))}
              </div>
            </div>

            <div className="xl:col-span-4">
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
                Gerar cenário completo
              </Button>
              {message && <p className="mt-3 rounded-lg border border-border bg-secondary/70 p-3 text-sm text-foreground">{message}</p>}
            </div>
          </form>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>{result.scenario.name}</CardTitle>
                <Badge variant="outline">{result.scenario.provider}</Badge>
                {result.scenario.model && <Badge variant="secondary">{result.scenario.model}</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm leading-6 text-muted-foreground">{result.scenario.summary}</p>

              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl border border-border p-4">
                  <h3 className="font-semibold text-foreground">Linha do tempo</h3>
                  <div className="mt-3 space-y-3">
                    {result.scenario.timeline.map((item) => (
                      <div key={`${item.phase}-${item.offset}`}>
                        <Badge variant="outline">{item.offset}</Badge>
                        <p className="mt-1 text-sm font-medium text-foreground">{item.phase}</p>
                        <p className="text-xs leading-5 text-muted-foreground">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-border p-4">
                  <h3 className="font-semibold text-foreground">IOCs fictícios</h3>
                  <div className="mt-3 space-y-2">
                    {result.scenario.iocs.map((ioc) => (
                      <div key={`${ioc.type}-${ioc.value}`} className="rounded-lg bg-secondary/40 p-2">
                        <Badge variant="secondary">{ioc.type}</Badge>
                        <p className="mt-1 break-all font-mono text-xs text-emerald-100">{ioc.value}</p>
                        <p className="text-xs text-muted-foreground">confidence {ioc.confidence}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-border p-4">
                  <h3 className="font-semibold text-foreground">TTPs</h3>
                  <div className="mt-3 space-y-3">
                    {result.scenario.ttps.map((ttp) => (
                      <div key={ttp.mitreId} className="rounded-lg bg-secondary/40 p-3">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">{ttp.mitreId}</Badge>
                          <Badge variant={ttp.severity as never}>{ttp.severity}</Badge>
                        </div>
                        <p className="mt-2 text-sm font-medium text-foreground">{ttp.technique}</p>
                        <p className="text-xs leading-5 text-muted-foreground">{ttp.detection}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Logs coerentes do cenário</CardTitle>
            </CardHeader>
            <CardContent>
              <LogsTable logs={result.logs} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
