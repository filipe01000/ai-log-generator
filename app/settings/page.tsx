import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { ThemeSettingsCard } from "@/components/theme/theme-settings-card";

export default function SettingsPage() {
  const openAiEnabled = Boolean(process.env.OPENAI_API_KEY);
  const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434/api/generate";

  return (
    <>
      <PageHeader
        title="Settings"
        description="Configurações do MVP, provedores de IA, banco de dados e controles de segurança para uso educacional."
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <ThemeSettingsCard />
        <Card>
          <CardHeader>
            <CardTitle>IA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span>OpenAI API</span>
              <Badge variant={openAiEnabled ? "low" : "medium"}>{openAiEnabled ? "configurada" : "não configurada"}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span>Ollama local</span>
              <Badge variant="outline">{ollamaUrl}</Badge>
            </div>
            <p className="text-muted-foreground">Sem chave de IA, o sistema usa o motor híbrido local: templates + geração sintética determinística.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Banco e segurança</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span>Banco MVP</span>
              <Badge variant="outline">SQLite via Prisma</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span>Produção</span>
              <Badge variant="outline">PostgreSQL preparado</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span>Rate limit</span>
              <Badge variant="low">ativo em memória</Badge>
            </div>
            <p className="text-muted-foreground">A aplicação separa explicitamente dados simulados de dados reais e não exige entrada de informações sensíveis.</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
