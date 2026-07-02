"use client";

import { useEffect, useState } from "react";
import { Activity, Clock, Database, Fingerprint, Gauge, Network, ShieldAlert, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VendorChart } from "@/components/charts/vendor-chart";
import { SeverityChart } from "@/components/charts/severity-chart";

type DashboardData = {
  totals: {
    logs: number;
    attacks: number;
    users: number;
    sourceIps: number;
    destinationIps: number;
    volumeBytes: number;
    avgGenerationMs: number;
  };
  byVendor: { name: string; value: number }[];
  bySeverity: { name: string; value: number }[];
  topMitre: { id: string; technique: string; count: number }[];
  recent: { id: string; timestamp: string; vendor: string; eventType: string; severity: string; sourceIp?: string; destinationIp?: string; mitreId?: string }[];
};

const empty: DashboardData = {
  totals: { logs: 0, attacks: 0, users: 0, sourceIps: 0, destinationIps: 0, volumeBytes: 0, avgGenerationMs: 0 },
  byVendor: [],
  bySeverity: [],
  topMitre: [],
  recent: []
};

function metricLabel(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function byteLabel(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function DashboardClient() {
  const [data, setData] = useState<DashboardData>(empty);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const metrics = [
    { label: "Total de logs", value: metricLabel(data.totals.logs), icon: Database },
    { label: "Ataques simulados", value: metricLabel(data.totals.attacks), icon: ShieldAlert },
    { label: "Usuários envolvidos", value: metricLabel(data.totals.users), icon: Users },
    { label: "IPs de origem", value: metricLabel(data.totals.sourceIps), icon: Network },
    { label: "IPs de destino", value: metricLabel(data.totals.destinationIps), icon: Fingerprint },
    { label: "Volume gerado", value: byteLabel(data.totals.volumeBytes), icon: Gauge },
    { label: "Tempo médio", value: `${data.totals.avgGenerationMs} ms`, icon: Clock },
    { label: "Status", value: loading ? "Carregando" : "Online", icon: Activity }
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label}>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{metric.label}</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{metric.value}</p>
                </div>
                <div className="rounded-lg bg-emerald-400/10 p-3 text-emerald-300">
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Logs por fabricante</CardTitle>
          </CardHeader>
          <CardContent>
            <VendorChart data={data.byVendor} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Logs por severidade</CardTitle>
          </CardHeader>
          <CardContent>
            <SeverityChart data={data.bySeverity} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Técnicas MITRE mais usadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.topMitre.length === 0 && <p className="text-sm text-muted-foreground">Gere logs para popular este painel.</p>}
            {data.topMitre.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-border/80 bg-secondary/20 p-3">
                <div>
                  <Badge variant="outline">{item.id}</Badge>
                  <p className="mt-2 text-sm text-foreground">{item.technique}</p>
                </div>
                <p className="text-xl font-bold text-emerald-300">{item.count}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimos eventos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recent.length === 0 && <p className="text-sm text-muted-foreground">Nenhum log gerado ainda.</p>}
            {data.recent.map((log) => (
              <div key={log.id} className="rounded-lg border border-border/80 bg-secondary/30 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={log.severity as never}>{log.severity}</Badge>
                  <span className="text-sm font-semibold text-foreground">{log.vendor}</span>
                  <span className="text-xs text-muted-foreground">{log.eventType}</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {log.sourceIp || "n/a"} → {log.destinationIp || "n/a"} {log.mitreId ? `• ${log.mitreId}` : ""}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
