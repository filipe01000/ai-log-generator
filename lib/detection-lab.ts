import { randomUUID } from "crypto";
import { buildInvestigationCase, publicInvestigationLog, type InvestigationGroundTruth } from "@/lib/investigation";
import { generateOne, type GeneratedLogRecord } from "@/lib/generators";
import type { DetectionLabStartInput } from "@/lib/validators";

type LabTruth = {
  incident: InvestigationGroundTruth;
  maliciousAuthIds: string[];
  benignAuthIds: string[];
  parserMappings: Record<string, string>;
};

export type DetectionDataset = ReturnType<typeof buildDetectionLab>;

const ENTITIES = {
  attackerIp: "198.51.100.42",
  user: "lab\\svc.finance",
  dc: "DC-LAB-01",
  workstation: "WS-FIN-17",
  fileServer: "FILE-LAB-02"
};

function rewrite(log: GeneratedLogRecord, values: { sourceIp: string; destinationIp: string; username: string; hostname: string }) {
  let raw = log.raw;
  const replacements: Array<[string | null | undefined, string]> = [
    [log.sourceIp, values.sourceIp], [log.destinationIp, values.destinationIp], [log.username, values.username], [log.hostname, values.hostname]
  ];
  for (const [from, to] of replacements) if (from) raw = raw.split(from).join(to);
  const payload = JSON.parse(log.jsonPayload) as Record<string, unknown>;
  Object.assign(payload, { src_ip: values.sourceIp, dst_ip: values.destinationIp, username: values.username, hostname: values.hostname });
  return { ...log, ...values, raw, jsonPayload: JSON.stringify(payload) };
}

function benignAuthNoise(count: number, start: Date) {
  const logs: GeneratedLogRecord[] = [];
  for (let i = 0; i < count; i++) {
    const log = generateOne({
      vendor: "Windows Security",
      eventType: "Windows 4625 - Falha de logon",
      severity: "low",
      timestamp: new Date(start.getTime() + i * 22_000),
      isBenign: true
    });
    logs.push(rewrite(log, {
      sourceIp: "10.40.20.88",
      destinationIp: "10.40.0.10",
      username: "lab\\user.training",
      hostname: "DC-LAB-01"
    }));
  }
  return logs;
}

function cmdb() {
  return [
    { hostname: ENTITIES.dc, ip: "10.40.0.10", role: "Domain Controller", os: "Windows Server 2025", criticality: "critical", owner: "Identity", exposure: "internal", collector: "Windows Agent", status: "online" },
    { hostname: ENTITIES.fileServer, ip: "10.40.0.25", role: "File Server", os: "Windows Server 2022", criticality: "high", owner: "Infrastructure", exposure: "internal", collector: "Windows Agent + EDR", status: "online" },
    { hostname: ENTITIES.workstation, ip: "10.40.18.77", role: "Finance Workstation", os: "Windows 11", criticality: "medium", owner: "Finance", exposure: "internal", collector: "EDR", status: "online" },
    { hostname: "FGT-LAB-01", ip: "10.40.0.1", role: "Firewall", os: "FortiOS", criticality: "critical", owner: "Network", exposure: "internet", collector: "Syslog", status: "online" },
    { hostname: "LIN-MON-01", ip: "10.40.30.20", role: "Monitoring", os: "Linux", criticality: "medium", owner: "Observability", exposure: "internal", collector: "Auditd", status: "degraded" }
  ];
}

function baselines() {
  return [
    { entity: ENTITIES.user, metric: "Falhas de logon por 15 min", expected: "0 a 2", observed: "acima do baseline", deviation: "critical" },
    { entity: ENTITIES.user, metric: "Hosts normalmente acessados", expected: "WS-FIN-17 e FILE-LAB-02", observed: "DC-LAB-01 e FILE-LAB-02", deviation: "high" },
    { entity: "zabbix", metric: "Execução de who", expected: "a cada 3 minutos", observed: "compatível", deviation: "none" },
    { entity: "lab\\user.training", metric: "Falhas ocasionais", expected: "até 8 por 15 min", observed: "dentro da faixa", deviation: "none" }
  ];
}

function detectionArtifacts(threshold = 10, minutes = 15) {
  return {
    sigma: `title: Multiple Windows Logon Failures Followed by Success\nid: ${randomUUID()}\nstatus: experimental\nlogsource:\n  product: windows\n  service: security\ndetection:\n  failure:\n    EventID: 4625\n  condition: failure\n---\ntitle: Correlated Authentication Burst\ncorrelation:\n  type: event_count\n  rules:\n    - multiple_windows_logon_failures\n  group-by:\n    - TargetUserName\n    - IpAddress\n  timespan: ${minutes}m\n  condition:\n    gte: ${threshold}`,
    kql: `SecurityEvent\n| where EventID == 4625\n| summarize Failures=count(), FirstSeen=min(TimeGenerated), LastSeen=max(TimeGenerated) by TargetUserName, IpAddress, bin(TimeGenerated, ${minutes}m)\n| where Failures >= ${threshold}`,
    spl: `index=windows EventCode=4625\n| bin _time span=${minutes}m\n| stats count as failures min(_time) as first_seen max(_time) as last_seen by TargetUserName IpAddress _time\n| where failures >= ${threshold}`,
    fortisiem: `Event Type = Win-Security-4625 AND COUNT(*) >= ${threshold}\nGROUP BY user, srcIp\nTIME WINDOW = ${minutes} MINUTES`,
    generic: `event.code = 4625 | group by user.name, source.ip | count >= ${threshold} within ${minutes}m`
  };
}

function coverage(availableSources: readonly string[]) {
  const required = [
    { source: "Windows Security", component: "Logon Session Creation and Authentication", reason: "Falhas 4625 e sucesso 4624" },
    { source: "Sysmon", component: "Process Creation", reason: "Execução de PowerShell" },
    { source: "FortiGate", component: "Network Connection Creation", reason: "Conexão entre origem e destino" },
    { source: "Trend Vision One", component: "File Creation", reason: "Arquivo incomum transferido por SMB" }
  ].map((item) => ({ ...item, available: availableSources.includes(item.source) }));
  const available = required.filter((item) => item.available).length;
  return { required, percentage: Math.round((available / required.length) * 100), missing: required.filter((item) => !item.available).map((item) => item.source) };
}

function ocsf(log: GeneratedLogRecord) {
  const isAuth = log.eventType.includes("4624") || log.eventType.includes("4625");
  return {
    class_uid: isAuth ? 3002 : 1001,
    class_name: isAuth ? "Authentication" : "System Activity",
    activity_name: log.eventType,
    time: log.timestamp.getTime(),
    severity: log.severity,
    src_endpoint: { ip: log.sourceIp },
    dst_endpoint: { ip: log.destinationIp, hostname: log.hostname },
    user: { name: log.username },
    metadata: { product: { vendor_name: log.vendor }, synthetic: true }
  };
}

function otel(log: GeneratedLogRecord) {
  return {
    Timestamp: log.timestamp.toISOString(),
    SeverityText: log.severity.toUpperCase(),
    Body: log.raw,
    Attributes: {
      "event.name": log.eventType,
      "event.domain": "security",
      "source.address": log.sourceIp,
      "destination.address": log.destinationIp,
      "user.name": log.username,
      "host.name": log.hostname,
      "security.synthetic": true
    },
    Resource: { "service.name": "ai-log-generator", "telemetry.sdk.name": "synthetic" }
  };
}

function applyTelemetryFaults(logs: GeneratedLogRecord[], config: DetectionLabStartInput) {
  const droppedIds: string[] = [];
  const corruptedIds: string[] = [];
  const visible: GeneratedLogRecord[] = [];
  for (const log of logs) {
    if (Math.random() * 100 < config.dropRate) {
      droppedIds.push(log.id);
      continue;
    }
    let next = { ...log };
    if (log.vendor === "Linux Auditd" && config.clockSkewSeconds) {
      next.timestamp = new Date(log.timestamp.getTime() - config.clockSkewSeconds * 1000);
    }
    if (Math.random() * 100 < config.parserCorruptionRate) {
      next.raw = next.raw.replace(/srcip=/g, "source_unmapped=").replace(/SourceAddress=/g, "UnmappedSource=");
      corruptedIds.push(next.id);
    }
    visible.push(next);
    if (Math.random() * 100 < config.duplicateRate) {
      visible.push({ ...next, id: randomUUID(), timestamp: new Date(next.timestamp.getTime() + 5), raw: `${next.raw} duplicate=true` });
    }
  }
  return { visible: visible.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()), droppedIds, corruptedIds };
}

export function buildDetectionLab(config: DetectionLabStartInput) {
  const base = buildInvestigationCase(config.difficulty);
  const maliciousAuthIds = base.logs.filter((log) => log.eventType.includes("4625") && log.username === ENTITIES.user).map((log) => log.id);
  const extraNoiseCount = Math.max(2, Math.round(config.noiseLevel / 8));
  const start = base.logs[0]?.timestamp || new Date();
  const benignFailures = benignAuthNoise(extraNoiseCount, new Date(start.getTime() + 5 * 60_000));
  const allLogs = [...base.logs, ...benignFailures].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const controlledSources = new Set(["Windows Security", "Sysmon", "FortiGate", "Trend Vision One", "Linux Auditd"]);
  const sourceAvailableLogs = allLogs.filter((log) => !controlledSources.has(log.vendor) || config.availableSources.includes(log.vendor as DetectionLabStartInput["availableSources"][number]));
  const unavailableEvents = allLogs.length - sourceAvailableLogs.length;
  const faults = applyTelemetryFaults(sourceAvailableLogs, config);
  const visibleIds = new Set(faults.visible.map((log) => log.id));
  const truth: LabTruth = {
    incident: base.groundTruth,
    maliciousAuthIds: maliciousAuthIds.filter((id) => visibleIds.has(id)),
    benignAuthIds: benignFailures.map((log) => log.id).filter((id) => visibleIds.has(id)),
    parserMappings: { srcip: "sourceIp", dstip: "destinationIp", user: "username", action: "action", eventtime: "timestamp" }
  };
  const parserTarget = allLogs.find((log) => log.vendor === "FortiGate") || allLogs[0];
  const sourceCoverage = coverage(config.availableSources);

  return {
    name: "Credential Abuse Detection Engineering Lab",
    scenario: {
      summary: "Abuso de credencial com autenticação bem-sucedida após falhas, acesso SMB e execução de PowerShell, misturado a atividade operacional legítima.",
      attackPath: ["Credential Access", "Valid Accounts", "Lateral Movement", "Execution", "Collection"],
      mitre: ["T1110.001", "T1078", "T1021.002", "T1059.001"]
    },
    cmdb: cmdb(),
    baselines: baselines(),
    telemetry: {
      inputEvents: allLogs.length,
      unavailableEvents,
      visibleEvents: faults.visible.length,
      droppedEvents: faults.droppedIds.length,
      duplicatedEvents: Math.max(0, faults.visible.length - (allLogs.length - faults.droppedIds.length)),
      corruptedEvents: faults.corruptedIds.length,
      clockSkewSeconds: config.clockSkewSeconds,
      health: unavailableEvents > 0 || faults.droppedIds.length > 0 || faults.corruptedIds.length > 0 ? "degraded" : "healthy"
    },
    coverage: sourceCoverage,
    detectionPack: detectionArtifacts(),
    normalization: {
      ocsf: faults.visible.slice(0, 3).map(ocsf),
      opentelemetry: faults.visible.slice(0, 3).map(otel)
    },
    atomic: {
      technique: "T1110.001",
      name: "Password Guessing",
      testPlan: "Executar somente em laboratório autorizado e isolado. O AI LOG gera a telemetria esperada, mas não dispara comandos ofensivos.",
      expectedTelemetry: ["Windows 4625", "Windows 4624", "FortiGate traffic", "Sysmon process creation"],
      validationGoal: "Confirmar coleta, parsing, correlação e geração de incidente."
    },
    parserChallenge: {
      raw: parserTarget?.raw || "",
      fields: Object.keys(truth.parserMappings),
      targets: ["sourceIp", "destinationIp", "username", "action", "timestamp"]
    },
    logs: faults.visible.map(publicInvestigationLog),
    truth
  };
}

export function validateDetection(dataset: DetectionDataset, truth: LabTruth, threshold: number, timespanMinutes: number) {
  const logs = dataset.logs;
  const failures = logs.filter((log) => log.eventType.includes("4625"));
  const groups = new Map<string, typeof failures>();
  for (const log of failures) {
    const key = `${log.username}|${log.sourceIp}`;
    groups.set(key, [...(groups.get(key) || []), log]);
  }
  const predicted = new Set<string>();
  let detectionLatencySeconds: number | null = null;
  for (const group of groups.values()) {
    const sorted = [...group].sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp));
    const spanMs = sorted.length > 1 ? +new Date(sorted.at(-1)!.timestamp) - +new Date(sorted[0].timestamp) : 0;
    if (sorted.length >= threshold && spanMs <= timespanMinutes * 60_000) {
      sorted.forEach((log) => predicted.add(log.id));
      const latency = (+new Date(sorted[threshold - 1].timestamp) - +new Date(sorted[0].timestamp)) / 1000;
      detectionLatencySeconds = detectionLatencySeconds === null ? latency : Math.min(detectionLatencySeconds, latency);
    }
  }

  const malicious = new Set(truth.maliciousAuthIds);
  const benign = new Set(truth.benignAuthIds);
  const tp = [...predicted].filter((id) => malicious.has(id)).length;
  const fp = [...predicted].filter((id) => benign.has(id)).length;
  const fn = [...malicious].filter((id) => !predicted.has(id)).length;
  const tn = [...benign].filter((id) => !predicted.has(id)).length;
  const precision = tp + fp ? tp / (tp + fp) : 0;
  const recall = tp + fn ? tp / (tp + fn) : 0;
  const f1 = precision + recall ? 2 * precision * recall / (precision + recall) : 0;

  const artifacts = detectionArtifacts(threshold, timespanMinutes);
  return {
    metrics: { truePositives: tp, falsePositives: fp, falseNegatives: fn, trueNegatives: tn, precision: Number(precision.toFixed(3)), recall: Number(recall.toFixed(3)), f1: Number(f1.toFixed(3)), detectionLatencySeconds },
    rule: { threshold, timespanMinutes },
    artifacts,
    tuning: fp > 0 ? "Aumente o threshold ou exclua padrões de falha operacional conhecidos após validar o baseline." : fn > 0 ? "Reduza o threshold ou amplie a janela, verificando o impacto em falsos positivos." : "A regra detectou o conjunto visível sem falsos positivos no dataset atual.",
    incidentReport: {
      title: "[AI-LOG] Credential abuse followed by lateral activity",
      classification: truth.incident.classification,
      severity: truth.incident.severity,
      destinationHosts: truth.incident.affectedHosts.join(" / "),
      user: truth.incident.affectedUser,
      mitre: truth.incident.mitreId,
      summary: truth.incident.explanation,
      confirmedEvidence: ["Eventos 4625 correlacionados por usuário e IP de origem", "Evento 4624 posterior para a mesma conta", "Acesso SMB 5145 e execução de PowerShell na timeline"],
      hypotheses: ["Credencial comprometida ou utilizada sem autorização", "Possível movimentação lateral em direção ao servidor de arquivos"],
      missingData: dataset.coverage.missing.length ? [`Fontes ausentes: ${dataset.coverage.missing.join(", ")}`] : ["Nenhuma fonte obrigatória ausente no cenário"],
      inference: "A classificação resulta da correlação temporal e comportamental; um evento isolado não seria suficiente para confirmar comprometimento.",
      action: "Validar a origem com o responsável, redefinir credenciais se não reconhecida, conter hosts afetados conforme evidências e preservar a timeline para investigação.",
      confidence: recall >= 0.8 ? "Alta" : recall >= 0.5 ? "Média" : "Baixa"
    }
  };
}

export function scoreParserChallenge(mappings: Record<string, string>, truth: LabTruth) {
  const entries = Object.entries(truth.parserMappings);
  const correct = entries.filter(([source, target]) => mappings[source] === target).length;
  return {
    score: Math.round((correct / entries.length) * 100),
    correct,
    total: entries.length,
    expected: truth.parserMappings
  };
}

export type { LabTruth };
