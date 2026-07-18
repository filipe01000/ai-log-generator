"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Download, Loader2, PlayCircle } from "lucide-react";
import { EVENT_TYPES, EXPORT_FORMATS, GENERATION_PROFILES, MANUFACTURERS, REALISM_LEVELS, SEVERITIES, SIMULATION_MODES } from "@/lib/constants";
import { generateSchema, type GenerateInput } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { LogsTable } from "@/components/tables/logs-table";

type ApiLog = {
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
};

export function GenerateForm() {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<GenerateInput>({
    resolver: zodResolver(generateSchema),
    defaultValues: {
      vendor: "FortiGate",
      eventType: "Rotina SOC N1 - Mix diário",
      count: 50,
      severity: "high",
      noiseLevel: 25,
      simulationMode: "SOC",
      outputFormat: "json",
      generationProfile: "Rotina SOC N1",
      realismLevel: "operacional",
      useAI: false
    }
  });

  async function onSubmit(values: GenerateInput) {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Falha ao gerar logs");
      setLogs(data.logs);
      setMessage(`${data.logs.length} logs sintéticos gerados e salvos no SQLite.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function exportCurrent() {
    const values = form.getValues();
    const response = await fetch("/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format: values.outputFormat, vendor: values.vendor, limit: values.count })
    });
    const data = await response.json();
    const blob = new Blob([data.content], { type: data.mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = data.filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Parâmetros de geração</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Perfil de geração</Label>
              <Select {...form.register("generationProfile")}>
                {GENERATION_PROFILES.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fabricante / sistema</Label>
              <Select {...form.register("vendor")}>
                {MANUFACTURERS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de evento</Label>
              <Select {...form.register("eventType")}>
                {EVENT_TYPES.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input type="number" min={1} max={5000} {...form.register("count")} />
              </div>
              <div className="space-y-2">
                <Label>Ruído benigno %</Label>
                <Input type="number" min={0} max={100} {...form.register("noiseLevel")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Fidelidade do raw log</Label>
              <Select {...form.register("realismLevel")}>
                {REALISM_LEVELS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground">Operacional reproduz campos e estrutura próximos aos logs analisados no SOC.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Severidade</Label>
                <Select {...form.register("severity")}>
                  {SEVERITIES.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Formato</Label>
                <Select {...form.register("outputFormat")}>
                  {EXPORT_FORMATS.map((item) => (
                    <option key={item} value={item}>{item.toUpperCase()}</option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Modo pronto</Label>
              <Select {...form.register("simulationMode")}>
                {SIMULATION_MODES.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </Select>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 p-3">
              <input id="useAI" type="checkbox" className="h-4 w-4" {...form.register("useAI")} />
              <Label htmlFor="useAI">Usar IA quando configurada</Label>
            </div>

            {Object.values(form.formState.errors).length > 0 && (
              <p className="text-sm text-red-300">Revise os campos. Há valores fora do limite permitido.</p>
            )}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                Gerar logs
              </Button>
              <Button type="button" variant="outline" onClick={exportCurrent}>
                <Download className="h-4 w-4" /> Exportar últimos
              </Button>
            </div>

            {message && <p className="rounded-lg border border-border bg-secondary/70 p-3 text-sm text-foreground">{message}</p>}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pré-visualização dos logs gerados</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? <p className="text-sm text-muted-foreground">Gere um lote para visualizar raw e JSON formatado.</p> : <LogsTable logs={logs} />}
        </CardContent>
      </Card>
    </div>
  );
}
