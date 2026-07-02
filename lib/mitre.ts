export type MitreTechniqueSeed = {
  id: string;
  tactic: string;
  technique: string;
  subTechnique?: string;
  description: string;
  detection: string;
  recommendation: string;
  severity: "informational" | "low" | "medium" | "high" | "critical";
  confidence: number;
  riskScore: number;
  eventTypes: string[];
};

export const MITRE_TECHNIQUES: MitreTechniqueSeed[] = [
  {
    id: "T1110",
    tactic: "Credential Access",
    technique: "Brute Force",
    description: "Múltiplas tentativas de autenticação contra serviço exposto ou conta corporativa.",
    detection: "Correlacionar falhas 4625/SSH/VPN por origem, usuário e janela temporal curta.",
    recommendation: "Aplicar MFA, lockout progressivo, bloqueio por reputação e revisão de exposição externa.",
    severity: "high",
    confidence: 0.86,
    riskScore: 76,
    eventTypes: ["Brute Force", "Hydra", "Falha de autenticação", "VPN", "SSH"]
  },
  {
    id: "T1059.001",
    tactic: "Execution",
    technique: "Command and Scripting Interpreter",
    subTechnique: "PowerShell",
    description: "Execução de PowerShell com parâmetros suspeitos, download remoto ou bypass de política.",
    detection: "Monitorar Event ID 4104, Sysmon Event ID 1 e comandos com EncodedCommand, IEX ou DownloadString.",
    recommendation: "Habilitar script block logging, AMSI, WDAC/AppLocker e investigar parent process.",
    severity: "high",
    confidence: 0.88,
    riskScore: 82,
    eventTypes: ["PowerShell", "Criação de processos", "Execução remota"]
  },
  {
    id: "T1059.004",
    tactic: "Execution",
    technique: "Command and Scripting Interpreter",
    subTechnique: "Unix Shell",
    description: "Execução de shell Linux com comportamento anômalo ou cadeia de comandos suspeita.",
    detection: "Correlacionar auditd execve, bash_history, parent process e conexões externas subsequentes.",
    recommendation: "Validar usuário, origem SSH, integridade do binário e executar hunting por persistência.",
    severity: "medium",
    confidence: 0.78,
    riskScore: 62,
    eventTypes: ["Linux Bash", "Reverse Shell", "Web Shell"]
  },
  {
    id: "T1003.001",
    tactic: "Credential Access",
    technique: "OS Credential Dumping",
    subTechnique: "LSASS Memory",
    description: "Tentativa de dump de credenciais da memória do LSASS ou ferramenta equivalente.",
    detection: "Monitorar acesso ao processo lsass.exe, criação de dump, Sysmon Event ID 10 e Defender alerts.",
    recommendation: "Isolar host, coletar memória, rotacionar credenciais e verificar movimentação lateral.",
    severity: "critical",
    confidence: 0.91,
    riskScore: 94,
    eventTypes: ["Dump de credenciais", "Mimikatz"]
  },
  {
    id: "T1558.003",
    tactic: "Credential Access",
    technique: "Steal or Forge Kerberos Tickets",
    subTechnique: "Kerberoasting",
    description: "Solicitação anormal de tickets Kerberos para contas de serviço com SPN.",
    detection: "Analisar Event ID 4769 com encryption type RC4, volume alto de SPNs e origem incomum.",
    recommendation: "Forçar AES, senhas fortes para contas de serviço, gMSA e auditoria de SPNs.",
    severity: "high",
    confidence: 0.84,
    riskScore: 80,
    eventTypes: ["Kerberoasting"]
  },
  {
    id: "T1558.001",
    tactic: "Credential Access",
    technique: "Steal or Forge Kerberos Tickets",
    subTechnique: "Golden Ticket",
    description: "Uso ou criação de ticket Kerberos forjado com privilégios elevados.",
    detection: "Correlacionar TGTs com tempo de vida anômalo, Event ID 4768/4769 e privilégios inconsistentes.",
    recommendation: "Rotacionar KRBTGT duas vezes, revisar DCs, privilegiados e evidências de comprometimento de domínio.",
    severity: "critical",
    confidence: 0.8,
    riskScore: 96,
    eventTypes: ["Golden Ticket"]
  },
  {
    id: "T1550.002",
    tactic: "Defense Evasion",
    technique: "Use Alternate Authentication Material",
    subTechnique: "Pass the Hash",
    description: "Autenticação lateral usando hash NTLM sem conhecimento da senha em texto claro.",
    detection: "Investigar 4624 Logon Type 3 com NTLM, origem incomum, admin shares e execução remota.",
    recommendation: "Restringir NTLM, aplicar LAPS, segmentação, Credential Guard e tiering administrativo.",
    severity: "critical",
    confidence: 0.83,
    riskScore: 90,
    eventTypes: ["Pass-the-Hash", "Movimentação lateral", "SMB"]
  },
  {
    id: "T1021.001",
    tactic: "Lateral Movement",
    technique: "Remote Services",
    subTechnique: "Remote Desktop Protocol",
    description: "Uso de RDP para movimentação lateral, acesso interativo ou persistência operacional.",
    detection: "Correlacionar 4624 Logon Type 10, 4778/4779, origem incomum e horários fora do padrão.",
    recommendation: "Exigir MFA, restringir RDP por jump server, revisar grupos locais e bloquear exposição pública.",
    severity: "high",
    confidence: 0.82,
    riskScore: 78,
    eventTypes: ["RDP", "Movimentação lateral", "Logon"]
  },
  {
    id: "T1046",
    tactic: "Discovery",
    technique: "Network Service Discovery",
    description: "Varredura de portas e enumeração de serviços internos ou externos.",
    detection: "Detectar conexão para múltiplas portas ou hosts, Suricata/Zeek notices e NetFlow incomum.",
    recommendation: "Bloquear origem, validar autorização do scan, revisar segmentação e exposição de serviços.",
    severity: "medium",
    confidence: 0.9,
    riskScore: 64,
    eventTypes: ["Port Scan", "Nmap", "Masscan"]
  },
  {
    id: "T1071.004",
    tactic: "Command and Control",
    technique: "Application Layer Protocol",
    subTechnique: "DNS",
    description: "Uso de DNS como canal de comando e controle ou túnel de exfiltração.",
    detection: "Monitorar domínios de alta entropia, TXT incomum, NXDOMAIN alto e volume por host.",
    recommendation: "Forçar DNS corporativo, bloquear DoH não autorizado e investigar host de origem.",
    severity: "high",
    confidence: 0.79,
    riskScore: 83,
    eventTypes: ["DNS Tunneling", "Beacon C2", "Exfiltração"]
  },
  {
    id: "T1055",
    tactic: "Defense Evasion",
    technique: "Process Injection",
    description: "Possível injeção de processo para evasão, execução furtiva ou acesso a credenciais.",
    detection: "Monitorar Sysmon Event ID 8/10, criação remota de thread e acesso suspeito a processos sensíveis.",
    recommendation: "Coletar árvore de processos, memória, artefatos de EDR e bloquear hash se confirmado.",
    severity: "high",
    confidence: 0.72,
    riskScore: 78,
    eventTypes: ["Malware", "Mimikatz", "Criação de processos"]
  },
  {
    id: "T1190",
    tactic: "Initial Access",
    technique: "Exploit Public-Facing Application",
    description: "Exploração de aplicação web pública via payload malicioso ou endpoint vulnerável.",
    detection: "Correlacionar WAF/web logs com status 4xx/5xx, payloads SQLi/XSS/traversal e user agents anômalos.",
    recommendation: "Corrigir aplicação, ativar WAF virtual patching, coletar logs e revisar upload/web shell.",
    severity: "high",
    confidence: 0.85,
    riskScore: 84,
    eventTypes: ["SQL Injection", "XSS", "Directory Traversal", "Web Shell", "HTTP", "HTTPS"]
  },
  {
    id: "T1105",
    tactic: "Command and Control",
    technique: "Ingress Tool Transfer",
    description: "Transferência de ferramenta ou payload de/para o ambiente comprometido.",
    detection: "Monitorar download via PowerShell/curl/wget, conexões para domínios recém-criados e arquivos executáveis.",
    recommendation: "Bloquear IOC, coletar amostra, validar proxy logs e revisar cadeia de execução.",
    severity: "high",
    confidence: 0.81,
    riskScore: 79,
    eventTypes: ["Beacon C2", "Reverse Shell", "Malware", "Exfiltração"]
  },
  {
    id: "T1486",
    tactic: "Impact",
    technique: "Data Encrypted for Impact",
    description: "Criptografia de arquivos com objetivo de impacto operacional e extorsão.",
    detection: "Detectar alto volume de rename/write, extensões incomuns, ransom notes e processos tocando muitos diretórios.",
    recommendation: "Isolar host, preservar evidência, acionar resposta a incidente e validar backups offline.",
    severity: "critical",
    confidence: 0.93,
    riskScore: 98,
    eventTypes: ["Ransomware"]
  },
  {
    id: "T1041",
    tactic: "Exfiltration",
    technique: "Exfiltration Over C2 Channel",
    description: "Exfiltração de dados pelo mesmo canal usado para comando e controle.",
    detection: "Identificar upload incomum, sessões longas, volume elevado e domínios com reputação ruim.",
    recommendation: "Bloquear canal, quantificar dados transferidos, preservar evidências e iniciar contenção.",
    severity: "critical",
    confidence: 0.82,
    riskScore: 92,
    eventTypes: ["Exfiltração", "Beacon C2", "APT"]
  }
];

export function findTechniqueForEvent(eventType: string) {
  return (
    MITRE_TECHNIQUES.find((item) => item.eventTypes.includes(eventType)) ||
    MITRE_TECHNIQUES.find((item) => item.id === "T1046")!
  );
}

export function getTechniqueById(id?: string | null) {
  if (!id) return undefined;
  return MITRE_TECHNIQUES.find((item) => item.id === id);
}
