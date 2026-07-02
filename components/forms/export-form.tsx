"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { EXPORT_FORMATS, MANUFACTURERS, SEVERITIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function ExportForm() {
  const [form, setForm] = useState({ format: "json", vendor: "", severity: "", ip: "", username: "", mitreId: "", q: "", limit: 1000 });
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    const response = await fetch("/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "Erro ao exportar");
      return;
    }
    const blob = new Blob([data.content], { type: data.mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = data.filename;
    link.click();
    URL.revokeObjectURL(url);
    setMessage(`${data.recordCount} registros exportados em ${data.format.toUpperCase()}.`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exportar dataset sintético</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
          <div className="space-y-2">
            <Label>Formato</Label>
            <Select value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
              {EXPORT_FORMATS.map((item) => <option key={item} value={item}>{item.toUpperCase()}</option>)}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Fabricante</Label>
            <Select value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })}>
              <option value="">Todos</option>
              {MANUFACTURERS.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Severidade</Label>
            <Select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
              <option value="">Todas</option>
              {SEVERITIES.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Limite</Label>
            <Input type="number" value={form.limit} onChange={(e) => setForm({ ...form, limit: Number(e.target.value) })} />
          </div>
          <div className="space-y-2">
            <Label>IP</Label>
            <Input value={form.ip} onChange={(e) => setForm({ ...form, ip: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Usuário</Label>
            <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>MITRE</Label>
            <Input value={form.mitreId} onChange={(e) => setForm({ ...form, mitreId: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Busca</Label>
            <Input value={form.q} onChange={(e) => setForm({ ...form, q: e.target.value })} />
          </div>
        </div>
        <Button onClick={submit}>
          <Download className="h-4 w-4" /> Exportar
        </Button>
        {message && <p className="rounded-lg border border-border bg-secondary/70 p-3 text-sm text-foreground">{message}</p>}
      </CardContent>
    </Card>
  );
}
