import { randomUUID } from "crypto";
import { generateOne, type GeneratedLogRecord } from "@/lib/generators";

export type InvestigationDifficulty = "beginner" | "intermediate" | "advanced";

export type InvestigationGroundTruth = {
  classification: "true_positive" | "false_positive" | "inconclusive";
  severity: "informational" | "low" | "medium" | "high" | "critical";
  mitreId: string;
  affectedUser: string;
  affectedHosts: string[];
  evidenceKeywords: string[];
  actionKeywords: string[];
  explanation: string;
};

export type InvestigationAnswer = {
  classification: InvestigationGroundTruth["classification"];
  severity: InvestigationGroundTruth["severity"];
  mitreId: string;
  affectedUser: string;
  affectedHosts: string;
  evidence: string;
  recommendedAction: string;
  confidence: number;
};

const COMMON = {
  sourceIp: "198.51.100.42",
  internalSourceIp: "10.40.18.77",
  user: "lab\\svc.finance",
  dc: "DC-LAB-01",
  fileServer: "FILE-LAB-02",
  workstation: "WS-FIN-17"
};

function correlate(log: GeneratedLogRecord, values: { sourceIp?: string; destinationIp?: string; username?: string; hostname?: string }) {
  const replacements: Array<[string | null | undefined, string | undefined]> = [
    [log.sourceIp, values.sourceIp],
    [log.destinationIp, values.destinationIp],
    [log.username, values.username],
    [log.hostname, values.hostname]
  ];
  let raw = log.raw;
  for (const [from, to] of replacements) {
    if (from && to) raw = raw.split(from).join(to);
  }

  const payload = JSON.parse(log.jsonPayload) as Record<string, unknown>;
  if (values.sourceIp) payload.src_ip = values.sourceIp;
  if (values.destinationIp) payload.dst_ip = values.destinationIp;
  if (values.username) payload.username = values.username;
  if (values.hostname) payload.hostname = values.hostname;

  return {
    ...log,
    sourceIp: values.sourceIp || log.sourceIp,
    destinationIp: values.destinationIp || log.destinationIp,
    username: values.username || log.username,
    hostname: values.hostname || log.hostname,
    raw,
    jsonPayload: JSON.stringify(payload)
  };
}

function event(offsetSeconds: number, vendor: string, eventType: string, severity: string, values: Parameters<typeof correlate>[1]) {
  const timestamp = new Date(Date.now() - 30 * 60_000 + offsetSeconds * 1000);
  return correlate(generateOne({ vendor, eventType, severity, timestamp }), values);
}

export function buildInvestigationCase(difficulty: InvestigationDifficulty) {
  const logs: GeneratedLogRecord[] = [];
  const failureCount = difficulty === "beginner" ? 18 : difficulty === "intermediate" ? 11 : 7;

  for (let i = 0; i < failureCount; i++) {
    logs.push(event(i * 9, "Windows Security", "Windows 4625 - Falha de logon", "medium", {
      sourceIp: COMMON.sourceIp,
      destinationIp: "10.40.0.10",
      username: COMMON.user,
      hostname: COMMON.dc
    }));
  }

  const pivot = failureCount * 9;
  logs.push(event(pivot + 12, "Windows Security", "Windows 4624 - Logon bem-sucedido", "high", {
    sourceIp: COMMON.sourceIp,
    destinationIp: "10.40.0.10",
    username: COMMON.user,
    hostname: COMMON.dc
  }));
  logs.push(event(pivot + 45, "FortiGate", "FortiGate Traffic Forward", "high", {
    sourceIp: COMMON.internalSourceIp,
    destinationIp: "10.40.0.25",
    username: COMMON.user,
    hostname: COMMON.workstation
  }));
  logs.push(event(pivot + 71, "Windows Security", "Windows 5145 - Acesso SMB", "high", {
    sourceIp: COMMON.internalSourceIp,
    destinationIp: "10.40.0.25",
    username: COMMON.user,
    hostname: COMMON.fileServer
  }));
  logs.push(event(pivot + 105, "Sysmon", "PowerShell", "high", {
    sourceIp: COMMON.internalSourceIp,
    destinationIp: "10.40.0.25",
    username: COMMON.user,
    hostname: COMMON.fileServer
  }));
  logs.push(event(pivot + 132, "Trend Vision One", "Trend Vision One - Arquivo via SMB", "high", {
    sourceIp: COMMON.internalSourceIp,
    destinationIp: "10.40.0.25",
    username: COMMON.user,
    hostname: COMMON.fileServer
  }));

  const noiseMultiplier = difficulty === "beginner" ? 1 : difficulty === "intermediate" ? 4 : 9;
  for (let i = 0; i < noiseMultiplier; i++) {
    logs.push(event(20 + i * 31, "Linux Auditd", "Linux Auditd - Comando who", "informational", {
      sourceIp: `10.40.30.${20 + i}`,
      destinationIp: `10.40.30.${20 + i}`,
      username: "zabbix",
      hostname: `LIN-MON-${String(i + 1).padStart(2, "0")}`
    }));
    logs.push(event(27 + i * 37, "FortiGate", "FortiGate App Control", "informational", {
      sourceIp: `10.40.20.${30 + i}`,
      destinationIp: "203.0.113.80",
      username: `lab\\user${String(i + 1).padStart(2, "0")}`,
      hostname: `WS-LAB-${String(i + 1).padStart(2, "0")}`
    }));
  }

  logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const groundTruth: InvestigationGroundTruth = {
    classification: "true_positive",
    severity: "high",
    mitreId: "T1110.001",
    affectedUser: COMMON.user,
    affectedHosts: [COMMON.dc, COMMON.fileServer, COMMON.workstation],
    evidenceKeywords: ["4625", "4624", "5145", "powershell"],
    actionKeywords: ["validar", "conter", "reset", "isolar"],
    explanation: "A sequência contém múltiplas falhas de autenticação originadas do mesmo IP, seguida de logon bem-sucedido para a mesma conta, acesso SMB, execução de PowerShell e evidência de arquivo transferido por SMB. A correlação sustenta abuso de credencial e possível movimentação lateral."
  };

  return {
    title: "Anomalia de autenticação e atividade lateral",
    difficulty,
    briefing: "Analise os eventos da timeline, determine se existe incidente e documente evidências, escopo, MITRE e resposta recomendada. Parte dos eventos é ruído operacional benigno.",
    logs,
    groundTruth
  };
}

function containsAny(text: string, keywords: string[]) {
  const normalized = text.toLowerCase();
  return keywords.filter((keyword) => normalized.includes(keyword.toLowerCase())).length;
}

export function scoreInvestigation(answer: InvestigationAnswer, truth: InvestigationGroundTruth) {
  const classification = answer.classification === truth.classification ? 20 : 0;
  const severity = answer.severity === truth.severity ? 10 : 0;
  const mitre = answer.mitreId.trim().toUpperCase() === truth.mitreId ? 10 : 0;
  const user = answer.affectedUser.toLowerCase().trim() === truth.affectedUser.toLowerCase() ? 8 : 0;
  const matchedHosts = containsAny(answer.affectedHosts, truth.affectedHosts);
  const hosts = Math.round((matchedHosts / truth.affectedHosts.length) * 7);
  const evidenceMatches = containsAny(answer.evidence, truth.evidenceKeywords);
  const evidence = Math.round((evidenceMatches / truth.evidenceKeywords.length) * 20);
  const actionMatches = containsAny(answer.recommendedAction, truth.actionKeywords);
  const response = Math.round((actionMatches / truth.actionKeywords.length) * 15);
  const confidence = answer.classification === truth.classification
    ? answer.confidence >= 70 && answer.confidence <= 100 ? 10 : 5
    : answer.confidence <= 60 ? 5 : 0;
  const score = classification + severity + mitre + user + hosts + evidence + response + confidence;

  return {
    score,
    passed: score >= 70,
    breakdown: { classification, severity, mitre, scope: user + hosts, evidence, response, confidence },
    groundTruth: truth
  };
}

export function publicInvestigationLog(log: GeneratedLogRecord) {
  return { ...log, timestamp: log.timestamp.toISOString(), scenarioId: undefined, id: log.id || randomUUID() };
}
