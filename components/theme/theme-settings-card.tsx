"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/components/theme/theme-provider";

const OPTIONS = [
  { value: "light" as const, label: "Claro", icon: Sun, description: "Melhor para apresentação, documentação e prints." },
  { value: "dark" as const, label: "Escuro", icon: Moon, description: "Melhor para operação SOC e leitura de logs." },
  { value: "system" as const, label: "Sistema", icon: Monitor, description: "Segue a preferência visual do Windows/navegador." }
];

export function ThemeSettingsCard() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aparência</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid gap-3 sm:grid-cols-3">
          {OPTIONS.map((option) => {
            const Icon = option.icon;
            const active = theme === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                className={`rounded-xl border p-4 text-left transition hover:bg-secondary/60 ${active ? "border-emerald-500/50 bg-emerald-500/10 ring-1 ring-emerald-500/30" : "border-border bg-card"}`}
              >
                <div className="mb-3 flex items-center gap-2 font-semibold text-foreground">
                  <Icon className="h-4 w-4" />
                  {option.label}
                </div>
                <p className="text-xs leading-5 text-muted-foreground">{option.description}</p>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-secondary/40 p-3 text-muted-foreground">
          <span>Tema salvo no navegador</span>
          <Button size="sm" variant="outline" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>Alternar agora</Button>
        </div>
      </CardContent>
    </Card>
  );
}
