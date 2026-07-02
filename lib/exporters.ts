import type { GeneratedLog } from "@prisma/client";
import { escapeCsv, safeJsonParse } from "@/lib/utils";

export type ExportFormat = "txt" | "json" | "csv" | "syslog" | "cef" | "leef" | "evtx" | "ndjson";

type ExportResult = {
  content: string;
  mimeType: string;
  extension: string;
};

function parsed(log: GeneratedLog) {
  return safeJsonParse<Record<string, unknown>>(log.jsonPayload, {});
}

function asPlainObject(log: GeneratedLog) {
  return {
    id: log.id,
    timestamp: log.timestamp.toISOString(),
    vendor: log.vendor,
    eventType: log.eventType,
    severity: log.severity,
    sourceIp: log.sourceIp,
    destinationIp: log.destinationIp,
    username: log.username,
    hostname: log.hostname,
    mitreId: log.mitreId,
    mitreTactic: log.mitreTactic,
    mitreTechnique: log.mitreTechnique,
    riskScore: log.riskScore,
    confidence: log.confidence,
    raw: log.raw,
    payload: parsed(log),
    synthetic: true
  };
}

function toCsv(logs: GeneratedLog[]) {
  const headers = [
    "timestamp",
    "vendor",
    "eventType",
    "severity",
    "sourceIp",
    "destinationIp",
    "username",
    "hostname",
    "mitreId",
    "mitreTactic",
    "mitreTechnique",
    "riskScore",
    "confidence",
    "raw"
  ];
  const rows = logs.map((log) => headers.map((header) => escapeCsv((asPlainObject(log) as Record<string, unknown>)[header])).join(","));
  return [headers.join(","), ...rows].join("\n");
}

function toCef(log: GeneratedLog) {
  const sev = log.severity === "critical" ? 10 : log.severity === "high" ? 8 : log.severity === "medium" ? 5 : log.severity === "low" ? 3 : 1;
  return `CEF:0|AI Log Generator|${log.vendor}|1.0|${log.mitreId || "synthetic"}|${log.eventType}|${sev}|src=${log.sourceIp || ""} dst=${log.destinationIp || ""} suser=${log.username || ""} shost=${log.hostname || ""} cs1=${log.mitreTactic || ""} cs1Label=mitreTactic cs2=${log.mitreTechnique || ""} cs2Label=mitreTechnique msg=${log.raw.replace(/\s+/g, " ")}`;
}

function toLeef(log: GeneratedLog) {
  return `LEEF:2.0|AI Log Generator|${log.vendor}|1.0|${log.eventType}|src=${log.sourceIp || ""}\tdst=${log.destinationIp || ""}\tusrName=${log.username || ""}\tsev=${log.severity}\tmitre=${log.mitreId || ""}\triskScore=${log.riskScore}\tmsg=${log.raw.replace(/\s+/g, " ")}`;
}

function toEvtxSimulated(logs: GeneratedLog[]) {
  const events = logs
    .map(
      (log) => `  <Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event">
    <System>
      <Provider Name="AI-Log-Generator" />
      <EventID>${log.eventType === "Falha de autenticação" ? 4625 : log.eventType === "Logon" ? 4624 : 4688}</EventID>
      <Level>${log.severity}</Level>
      <TimeCreated SystemTime="${log.timestamp.toISOString()}" />
      <Computer>${log.hostname || "synthetic-host"}</Computer>
    </System>
    <EventData>
      <Data Name="Vendor">${log.vendor}</Data>
      <Data Name="User">${log.username || ""}</Data>
      <Data Name="SourceIp">${log.sourceIp || ""}</Data>
      <Data Name="DestinationIp">${log.destinationIp || ""}</Data>
      <Data Name="MITRE">${log.mitreId || ""}</Data>
      <Data Name="Raw">${log.raw.replace(/[<>&]/g, "")}</Data>
    </EventData>
  </Event>`
    )
    .join("\n");

  return `<Events generatedBy="AI Log Generator" synthetic="true">\n${events}\n</Events>`;
}

export function exportLogs(logs: GeneratedLog[], format: ExportFormat): ExportResult {
  switch (format) {
    case "txt":
    case "syslog":
      return { content: logs.map((log) => log.raw).join("\n"), mimeType: "text/plain", extension: "txt" };
    case "json":
      return { content: JSON.stringify(logs.map(asPlainObject), null, 2), mimeType: "application/json", extension: "json" };
    case "csv":
      return { content: toCsv(logs), mimeType: "text/csv", extension: "csv" };
    case "cef":
      return { content: logs.map(toCef).join("\n"), mimeType: "text/plain", extension: "cef" };
    case "leef":
      return { content: logs.map(toLeef).join("\n"), mimeType: "text/plain", extension: "leef" };
    case "evtx":
      return { content: toEvtxSimulated(logs), mimeType: "application/xml", extension: "xml" };
    case "ndjson":
      return { content: logs.map((log) => JSON.stringify(asPlainObject(log))).join("\n"), mimeType: "application/x-ndjson", extension: "ndjson" };
    default:
      return { content: logs.map((log) => log.raw).join("\n"), mimeType: "text/plain", extension: "txt" };
  }
}
