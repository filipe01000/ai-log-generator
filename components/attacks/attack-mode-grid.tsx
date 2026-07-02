import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SIMULATION_MODES } from "@/lib/constants";

const descriptions: Record<string, string> = {
  "Blue Team": "Cenários focados em triagem, classificação, resposta e documentação de alertas.",
  SOC: "Volume misto de alertas, eventos benignos, falsos positivos e incidentes reais simulados.",
  "Purple Team": "Cadeias de ataque com técnica, detecção esperada e resposta operacional.",
  "Threat Hunting": "Eventos de baixa evidência para caça por hipótese, anomalia e correlação.",
  CTF: "Datasets com pistas, flags sintéticas e progressão de investigação.",
  "Empresa pequena": "Ambiente enxuto com poucos servidores, firewall, VPN e endpoints.",
  "Empresa média": "Cenário corporativo com AD, servidores internos, cloud e múltiplas fontes.",
  Banco: "Alta criticidade, fraude, lateral movement, controles fortes e trilha de auditoria.",
  Hospital: "Foco em disponibilidade, ransomware, dispositivos legados e dados sensíveis sintéticos.",
  Universidade: "Ambiente aberto, alta variação de usuários, web, DNS e varreduras.",
  Indústria: "Rede segmentada com eventos de TI/OT, firewall, VPN e endpoints críticos.",
  Cloud: "AWS, Azure, identidade, tokens, buckets, EventHub, CloudTrail e Defender.",
  Ransomware: "Execução, discovery, credenciais, impacto, arquivos criptografados e exfiltração.",
  APT: "Cadeia longa com baixo ruído, C2, persistência e técnicas avançadas.",
  "Insider Threat": "Uso indevido de credenciais, acesso anômalo, extração de dados e horários incomuns."
};

export function AttackModeGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {SIMULATION_MODES.map((mode) => (
        <Card key={mode}>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>{mode}</CardTitle>
              <Badge variant="outline">preset</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">{descriptions[mode]}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
