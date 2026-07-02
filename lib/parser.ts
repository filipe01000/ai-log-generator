export type ParsedRawLog = {
  format: "json" | "key_value" | "web_access" | "zeek_tsv" | "plain_text";
  confidence: number;
  fields: Record<string, string>;
  normalized: {
    timestamp?: string;
    vendor?: string;
    eventType?: string;
    severity?: string;
    action?: string;
    sourceIp?: string;
    sourcePort?: string;
    destinationIp?: string;
    destinationPort?: string;
    protocol?: string;
    username?: string;
    hostname?: string;
    process?: string;
    commandLine?: string;
    url?: string;
    userAgent?: string;
    hash?: string;
    mitreId?: string;
  };
  observations: string[];
};

const NORMALIZED_KEYS: Record<string, keyof ParsedRawLog["normalized"]> = {
  date: "timestamp",
  time: "timestamp",
  timestamp: "timestamp",
  eventTime: "timestamp",
  eventtime: "timestamp",
  event_time: "timestamp",
  eventType: "eventType",
  event_type: "eventType",
  event: "eventType",
  attack: "eventType",
  eventName: "eventType",
  severity: "severity",
  level: "severity",
  Level: "severity",
  action: "action",
  src: "sourceIp",
  srcip: "sourceIp",
  src_ip: "sourceIp",
  sourceIPAddress: "sourceIp",
  SourceAddress: "sourceIp",
  client: "sourceIp",
  dest_ip: "destinationIp",
  dst: "destinationIp",
  dstip: "destinationIp",
  dst_ip: "destinationIp",
  destination_ip: "destinationIp",
  sport: "sourcePort",
  srcport: "sourcePort",
  src_port: "sourcePort",
  dport: "destinationPort",
  dstport: "destinationPort",
  dst_port: "destinationPort",
  dest_port: "destinationPort",
  protocol: "protocol",
  proto: "protocol",
  user: "username",
  username: "username",
  AccountName: "username",
  userName: "username",
  auid: "username",
  hostname: "hostname",
  host: "hostname",
  Workstation: "hostname",
  ProcessName: "process",
  process: "process",
  exe: "process",
  CommandLine: "commandLine",
  command: "commandLine",
  command_line: "commandLine",
  statement: "commandLine",
  url: "url",
  request: "url",
  user_agent: "userAgent",
  userAgent: "userAgent",
  Hashes: "hash",
  hash_sha256: "hash",
  sha256: "hash",
  mitre: "mitreId",
  MITRE: "mitreId",
  mitreid: "mitreId",
  mitreId: "mitreId"
};

function stripQuotes(value: unknown) {
  return String(value ?? "").replace(/^['\"]|['\"]$/g, "").trim();
}

function flattenJson(input: unknown, prefix = "", output: Record<string, string> = {}) {
  if (!input || typeof input !== "object") return output;
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      flattenJson(value, nextKey, output);
    } else {
      output[nextKey] = stripQuotes(Array.isArray(value) ? value.join(",") : value);
      output[key] = output[nextKey];
    }
  }
  return output;
}

function parseKeyValue(raw: string) {
  const fields: Record<string, string> = {};
  const regex = /([A-Za-z_][A-Za-z0-9_.-]*)=("(?:\\"|[^"])*"|'(?:\\'|[^'])*'|[^\s]+)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(raw)) !== null) {
    fields[match[1]] = stripQuotes(match[2]);
  }
  return fields;
}

function parseWebAccess(raw: string) {
  const fields: Record<string, string> = {};
  const webRegex = /^(?<sourceIp>\S+)\s+\S+\s+(?<username>\S+)\s+\[(?<timestamp>[^\]]+)\]\s+"(?<method>\S+)\s+(?<path>[^\s]+)\s+(?<httpVersion>[^"]+)"\s+(?<status>\d{3})\s+(?<bytes>\d+|-)\s+"(?<referer>[^"]*)"\s+"(?<userAgent>[^"]*)"/;
  const match = raw.match(webRegex);
  if (!match?.groups) return fields;
  Object.assign(fields, match.groups);
  fields.request = `${fields.method} ${fields.path} ${fields.httpVersion}`;
  return fields;
}

function parseZeek(raw: string) {
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const dataLine = lines.find((line) => !line.startsWith("#"));
  if (!dataLine) return {};
  const parts = dataLine.split("\t");
  if (parts.length < 10) return {};
  return {
    timestamp: parts[0],
    uid: parts[1],
    src_ip: parts[2],
    src_port: parts[3],
    dest_ip: parts[4],
    dest_port: parts[5],
    proto: parts[6],
    event_type: parts[7],
    severity: parts[8],
    mitre: parts[9]
  };
}

function normalize(fields: Record<string, string>, fallbackVendor?: string) {
  const normalized: ParsedRawLog["normalized"] = {};

  for (const [key, value] of Object.entries(fields)) {
    const normalizedKey = NORMALIZED_KEYS[key] || NORMALIZED_KEYS[key.split(".").pop() || ""];
    if (normalizedKey && value && !normalized[normalizedKey]) {
      normalized[normalizedKey] = value;
    }
  }

  if (!normalized.vendor && fallbackVendor) normalized.vendor = fallbackVendor;

  if (fields.date && fields.time) normalized.timestamp = `${fields.date} ${fields.time}`;
  if (fields.dst && fields.dst.includes(":")) {
    const [ip, port] = fields.dst.split(":");
    normalized.destinationIp ||= ip;
    normalized.destinationPort ||= port;
  }
  if (fields.Hashes?.includes("SHA256=")) normalized.hash = fields.Hashes.split("SHA256=")[1];
  if (fields["mitre.id"] && !normalized.mitreId) normalized.mitreId = fields["mitre.id"];
  if (fields["alert.signature"] && !normalized.eventType) normalized.eventType = fields["alert.signature"];
  if (fields["alert.action"] && !normalized.action) normalized.action = fields["alert.action"];

  return normalized;
}

function buildObservations(parsed: ParsedRawLog) {
  const observations: string[] = [];
  const { normalized, fields } = parsed;

  if (!normalized.sourceIp) observations.push("Campo de IP de origem não foi identificado no raw.");
  if (!normalized.destinationIp) observations.push("Campo de IP de destino não foi identificado no raw.");
  if (!normalized.severity) observations.push("Severidade ausente ou não padronizada.");
  if (!normalized.mitreId) observations.push("MITRE ausente no raw ou não extraído pelo parser.");
  if (normalized.commandLine) observations.push("Comando/processo extraído com sucesso para triagem operacional.");
  if (normalized.mitreId) observations.push(`Técnica MITRE correlacionada: ${normalized.mitreId}.`);
  if (Object.keys(fields).length >= 8) observations.push("Parser encontrou quantidade suficiente de campos para investigação inicial.");

  return observations;
}

export function parseRawLog(raw: string, fallbackVendor?: string): ParsedRawLog {
  const trimmed = raw.trim();
  let format: ParsedRawLog["format"] = "plain_text";
  let fields: Record<string, string> = {};
  let confidence = 0.2;

  try {
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      fields = flattenJson(JSON.parse(trimmed));
      format = "json";
      confidence = 0.95;
    }
  } catch {
    fields = {};
  }

  if (!Object.keys(fields).length && trimmed.startsWith("#separator")) {
    fields = parseZeek(trimmed);
    if (Object.keys(fields).length) {
      format = "zeek_tsv";
      confidence = 0.82;
    }
  }

  if (!Object.keys(fields).length) {
    const webFields = parseWebAccess(trimmed);
    if (Object.keys(webFields).length) {
      fields = { ...webFields, ...parseKeyValue(trimmed) };
      format = "web_access";
      confidence = 0.86;
    }
  }

  if (!Object.keys(fields).length) {
    fields = parseKeyValue(trimmed);
    if (Object.keys(fields).length) {
      format = "key_value";
      confidence = Object.keys(fields).length >= 8 ? 0.88 : 0.68;
    }
  }

  if (!Object.keys(fields).length) {
    fields = { raw: trimmed };
  }

  const parsed: ParsedRawLog = {
    format,
    confidence,
    fields,
    normalized: normalize(fields, fallbackVendor),
    observations: []
  };
  parsed.observations = buildObservations(parsed);
  return parsed;
}

export function parseManyRawLogs(logs: Array<{ raw: string; vendor?: string }>) {
  return logs.map((log) => parseRawLog(log.raw, log.vendor));
}
