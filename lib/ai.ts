import type { AiScenarioInput } from "@/lib/validators";
import { buildScenarioSummary } from "@/lib/generators";
import { sanitizeText } from "@/lib/security";
import { parseRawLog } from "@/lib/parser";

type AiScenarioResult = ReturnType<typeof buildScenarioSummary> & {
  provider: "mock" | "openai" | "ollama";
  model?: string;
};

function buildPrompt(input: AiScenarioInput) {
  return `Você é um especialista em SOC, Blue Team, DFIR e MITRE ATT&CK. Gere um cenário sintético e seguro para treinamento.

Requisitos:
- Empresa: ${input.companyType}
- Ativos: ${input.assetCount}
- Usuários: ${input.userCount}
- Ataque: ${input.attackType}
- Duração: ${input.durationHours} horas
- Ruído benigno: ${input.noiseLevel}%
- Severidade: ${input.severity}
- Fabricantes: ${input.vendors.join(", ")}
- Formato: JSON válido

Retorne exatamente este JSON:
{
  "name": "string",
  "summary": "string",
  "timeline": [{"phase":"string","offset":"string","description":"string"}],
  "iocs": [{"type":"ip|domain|url|sha256|user_agent|process|command","value":"string","confidence":0.0}],
  "ttps": [{"tactic":"string","technique":"string","subTechnique":"string|null","mitreId":"string","severity":"string","confidence":0.0,"riskScore":0,"detection":"string","recommendation":"string"}]
}`;
}

function normalizeAiResponse(raw: string, fallback: ReturnType<typeof buildScenarioSummary>) {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    return {
      name: sanitizeText(parsed.name || fallback.name, 180),
      summary: sanitizeText(parsed.summary || fallback.summary, 2000),
      timeline: Array.isArray(parsed.timeline) ? parsed.timeline.slice(0, 12) : fallback.timeline,
      iocs: Array.isArray(parsed.iocs) ? parsed.iocs.slice(0, 30) : fallback.iocs,
      ttps: Array.isArray(parsed.ttps) ? parsed.ttps.slice(0, 12) : fallback.ttps
    };
  } catch {
    return fallback;
  }
}

async function callOpenAI(input: AiScenarioInput, fallback: ReturnType<typeof buildScenarioSummary>): Promise<AiScenarioResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Você gera cenários sintéticos e seguros para treinamento defensivo. Nunca use dados reais." },
        { role: "user", content: buildPrompt(input) }
      ]
    })
  });

  if (!response.ok) return null;
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) return null;
  return { ...normalizeAiResponse(content, fallback), provider: "openai", model };
}

async function callOllama(input: AiScenarioInput, fallback: ReturnType<typeof buildScenarioSummary>): Promise<AiScenarioResult | null> {
  const url = process.env.OLLAMA_URL || "http://localhost:11434/api/generate";
  const model = process.env.OLLAMA_MODEL || "llama3.1";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt: buildPrompt(input), stream: false, format: "json" })
    });
    if (!response.ok) return null;
    const data = await response.json();
    const content = data?.response;
    if (!content) return null;
    return { ...normalizeAiResponse(content, fallback), provider: "ollama", model };
  } catch {
    return null;
  }
}

export async function buildAiScenario(input: AiScenarioInput): Promise<AiScenarioResult> {
  const fallback = buildScenarioSummary(input);

  if (input.aiProvider === "openai") {
    const openai = await callOpenAI(input, fallback);
    if (openai) return openai;
  }

  if (input.aiProvider === "ollama") {
    const ollama = await callOllama(input, fallback);
    if (ollama) return ollama;
  }

  return { ...fallback, provider: "mock" };
}


export type AiLogAnalysisInput = {
  provider: "mock" | "openai" | "ollama";
  objective?: string;
  logs: Array<{
    id?: string;
    timestamp?: string;
    vendor?: string;
    eventType?: string;
    severity?: string;
    sourceIp?: string | null;
    destinationIp?: string | null;
    username?: string | null;
    hostname?: string | null;
    mitreId?: string | null;
    raw: string;
    jsonPayload?: string;
    riskScore?: number;
    confidence?: number;
  }>;
};

export type AiLogAnalysisResult = {
  provider: "mock" | "openai" | "ollama";
  model?: string;
  verdict: "true_positive" | "false_positive" | "needs_review" | "benign";
  severity: string;
  confidence: number;
  riskScore: number;
  summary: string;
  evidence: string[];
  parserAdjustments: string[];
  recommendedFixes: string[];
  responseSteps: string[];
  detectionLogic: string;
  normalizedEvent: Record<string, string | number | boolean | null>;
};

function analysisPrompt(input: AiLogAnalysisInput) {
  const log = input.logs[0];
  return `Você é um Analista SOC Sênior e Engenheiro de Detecção.
Analise o log sintético abaixo para treinamento defensivo.

Objetivo: ${input.objective || "Triagem SOC, parser, ajustes de detecção e resposta."}

Log:
${log.raw}

Metadados:
${JSON.stringify(log, null, 2)}

Retorne exatamente um JSON válido com este formato:
{
  "verdict": "true_positive|false_positive|needs_review|benign",
  "severity": "informational|low|medium|high|critical",
  "confidence": 0.0,
  "riskScore": 0,
  "summary": "string",
  "evidence": ["string"],
  "parserAdjustments": ["string"],
  "recommendedFixes": ["string"],
  "responseSteps": ["string"],
  "detectionLogic": "string",
  "normalizedEvent": {}
}`;
}

function normalizeAnalysisResponse(raw: string, fallback: AiLogAnalysisResult, provider: AiLogAnalysisResult["provider"], model?: string): AiLogAnalysisResult {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    return {
      provider,
      model,
      verdict: ["true_positive", "false_positive", "needs_review", "benign"].includes(parsed.verdict) ? parsed.verdict : fallback.verdict,
      severity: sanitizeText(parsed.severity || fallback.severity, 30),
      confidence: Number(parsed.confidence ?? fallback.confidence),
      riskScore: Number(parsed.riskScore ?? fallback.riskScore),
      summary: sanitizeText(parsed.summary || fallback.summary, 2000),
      evidence: Array.isArray(parsed.evidence) ? parsed.evidence.slice(0, 12).map((item: unknown) => sanitizeText(item, 500)) : fallback.evidence,
      parserAdjustments: Array.isArray(parsed.parserAdjustments) ? parsed.parserAdjustments.slice(0, 12).map((item: unknown) => sanitizeText(item, 500)) : fallback.parserAdjustments,
      recommendedFixes: Array.isArray(parsed.recommendedFixes) ? parsed.recommendedFixes.slice(0, 12).map((item: unknown) => sanitizeText(item, 500)) : fallback.recommendedFixes,
      responseSteps: Array.isArray(parsed.responseSteps) ? parsed.responseSteps.slice(0, 12).map((item: unknown) => sanitizeText(item, 500)) : fallback.responseSteps,
      detectionLogic: sanitizeText(parsed.detectionLogic || fallback.detectionLogic, 3000),
      normalizedEvent: parsed.normalizedEvent && typeof parsed.normalizedEvent === "object" ? parsed.normalizedEvent : fallback.normalizedEvent
    };
  } catch {
    return { ...fallback, provider, model };
  }
}

function buildMockAnalysis(input: AiLogAnalysisInput): AiLogAnalysisResult {
  const log = input.logs[0];
  const parsed = parseRawLog(log.raw, log.vendor);
  const severity = String(log.severity || parsed.normalized.severity || "medium").toLowerCase();
  const riskScore = Number(log.riskScore || (severity === "critical" ? 90 : severity === "high" ? 75 : severity === "medium" ? 50 : 25));
  const hasMitre = Boolean(log.mitreId || parsed.normalized.mitreId);
  const hasCommand = Boolean(parsed.normalized.commandLine || parsed.normalized.process);
  const hasNetwork = Boolean(parsed.normalized.sourceIp || log.sourceIp) && Boolean(parsed.normalized.destinationIp || log.destinationIp);
  const verdict: AiLogAnalysisResult["verdict"] = severity === "informational" || severity === "low" ? "benign" : hasMitre || hasCommand || riskScore >= 60 ? "true_positive" : "needs_review";

  const evidence = [
    hasMitre ? `MITRE presente: ${log.mitreId || parsed.normalized.mitreId}.` : "MITRE não identificado no evento.",
    hasNetwork ? `Fluxo observado entre ${parsed.normalized.sourceIp || log.sourceIp || "origem desconhecida"} e ${parsed.normalized.destinationIp || log.destinationIp || "destino desconhecido"}.` : "Campos de rede incompletos.",
    hasCommand ? `Execução ou comando identificado: ${parsed.normalized.commandLine || parsed.normalized.process}.` : "Sem comando ou processo explícito no raw.",
    `Severidade informada: ${severity}. Risco calculado: ${riskScore}/100.`
  ];

  const parserAdjustments = [
    parsed.normalized.sourceIp ? "Mapear campo de origem para source.ip." : "Criar regra de parser para extrair IP de origem.",
    parsed.normalized.destinationIp ? "Mapear campo de destino para destination.ip." : "Criar regra de parser para extrair IP de destino.",
    parsed.normalized.mitreId ? "Normalizar MITRE para threat.technique.id." : "Adicionar enriquecimento MITRE quando o evento for malicioso.",
    parsed.normalized.commandLine ? "Mapear linha de comando para process.command_line." : "Validar se o fabricante entrega campo de comando/processo."
  ];

  return {
    provider: "mock",
    verdict,
    severity,
    confidence: Number(Math.max(0.45, Math.min(0.97, log.confidence || parsed.confidence)).toFixed(2)),
    riskScore,
    summary: `Evento sintético de ${log.vendor || parsed.normalized.vendor || "fonte desconhecida"} classificado como ${verdict}. A leitura indica ${log.eventType || parsed.normalized.eventType || "atividade não classificada"}, com severidade ${severity}, risco ${riskScore}/100 e necessidade de validar parser, correlação e resposta.` ,
    evidence,
    parserAdjustments,
    recommendedFixes: [
      "Padronizar nomes dos campos em ECS ou schema interno: source.ip, destination.ip, user.name, event.action, event.severity, threat.technique.id.",
      "Criar validação automática para impedir logs sem timestamp, origem, destino, severidade e fabricante.",
      "Adicionar enriquecimento de IOC fictício para IP, domínio, hash e processo quando houver MITRE.",
      "Gerar eventos benignos correlacionáveis para reduzir dataset artificialmente perfeito."
    ],
    responseSteps: [
      "Confirmar se a origem é interna, externa ou serviço autorizado.",
      "Correlacionar com autenticação, DNS, processo, firewall e EDR no intervalo de 15 minutos.",
      "Validar recorrência por usuário, host, IP de destino e técnica MITRE.",
      "Se confirmado, isolar host simulado, bloquear IOC e registrar caso de detecção."
    ],
    detectionLogic: `where severity in ("high", "critical") and (mitre_id is not null or process.command_line is not null or action in ("blocked", "dropped", "detected", "alert"))`,
    normalizedEvent: {
      timestamp: parsed.normalized.timestamp || log.timestamp || null,
      vendor: parsed.normalized.vendor || log.vendor || null,
      eventType: parsed.normalized.eventType || log.eventType || null,
      severity,
      sourceIp: parsed.normalized.sourceIp || log.sourceIp || null,
      destinationIp: parsed.normalized.destinationIp || log.destinationIp || null,
      username: parsed.normalized.username || log.username || null,
      hostname: parsed.normalized.hostname || log.hostname || null,
      mitreId: parsed.normalized.mitreId || log.mitreId || null,
      parserFormat: parsed.format,
      parserConfidence: parsed.confidence,
      synthetic: true
    }
  };
}

async function callOpenAIAnalysis(input: AiLogAnalysisInput, fallback: AiLogAnalysisResult): Promise<AiLogAnalysisResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENAI_ANALYSIS_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Você analisa apenas logs sintéticos para defesa, parser, detecção e resposta. Não gere instruções ofensivas acionáveis." },
        { role: "user", content: analysisPrompt(input) }
      ]
    })
  });

  if (!response.ok) return null;
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) return null;
  return normalizeAnalysisResponse(content, fallback, "openai", model);
}

async function callOllamaAnalysis(input: AiLogAnalysisInput, fallback: AiLogAnalysisResult): Promise<AiLogAnalysisResult | null> {
  const url = process.env.OLLAMA_URL || "http://localhost:11434/api/generate";
  const model = process.env.OLLAMA_ANALYSIS_MODEL || process.env.OLLAMA_MODEL || "llama3.1";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt: analysisPrompt(input), stream: false, format: "json" })
    });
    if (!response.ok) return null;
    const data = await response.json();
    const content = data?.response;
    if (!content) return null;
    return normalizeAnalysisResponse(content, fallback, "ollama", model);
  } catch {
    return null;
  }
}

export async function analyzeGeneratedLogs(input: AiLogAnalysisInput): Promise<AiLogAnalysisResult> {
  const fallback = buildMockAnalysis(input);

  if (input.provider === "openai") {
    const openai = await callOpenAIAnalysis(input, fallback);
    if (openai) return openai;
  }

  if (input.provider === "ollama") {
    const ollama = await callOllamaAnalysis(input, fallback);
    if (ollama) return ollama;
  }

  return fallback;
}
