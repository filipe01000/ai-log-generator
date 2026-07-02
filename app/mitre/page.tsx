import { MITRE_TECHNIQUES } from "@/lib/mitre";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";

export default function MitrePage() {
  return (
    <>
      <PageHeader
        title="MITRE ATT&CK"
        description="Base inicial de técnicas utilizadas pelo gerador, com tática, técnica, severidade, confidence, risk score, detecção e resposta."
      />
      <div className="grid gap-4 xl:grid-cols-2">
        {MITRE_TECHNIQUES.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{item.id}</Badge>
                <Badge variant={item.severity}>{item.severity}</Badge>
                <Badge variant="secondary">risk {item.riskScore}</Badge>
                <Badge variant="secondary">confidence {item.confidence}</Badge>
              </div>
              <CardTitle>{item.technique}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p><strong>Tática:</strong> {item.tactic}</p>
              {item.subTechnique && <p><strong>Subtécnica:</strong> {item.subTechnique}</p>}
              <p>{item.description}</p>
              <div className="rounded-lg border border-border bg-secondary/40 p-3">
                <strong>Possível detecção:</strong> {item.detection}
              </div>
              <div className="rounded-lg border border-border bg-secondary/40 p-3">
                <strong>Resposta recomendada:</strong> {item.recommendation}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
