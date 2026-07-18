import { z } from "zod";
import { COMPANY_TYPES, EVENT_TYPES, EXPORT_FORMATS, GENERATION_PROFILES, MANUFACTURERS, REALISM_LEVELS, SEVERITIES, SIMULATION_MODES } from "@/lib/constants";

export const generateSchema = z.object({
  vendor: z.enum(MANUFACTURERS),
  eventType: z.enum(EVENT_TYPES),
  count: z.coerce.number().int().min(1).max(5000).default(50),
  severity: z.enum(SEVERITIES).default("medium"),
  noiseLevel: z.coerce.number().int().min(0).max(100).default(25),
  simulationMode: z.enum(SIMULATION_MODES).optional(),
  outputFormat: z.enum(EXPORT_FORMATS).default("json"),
  generationProfile: z.enum(GENERATION_PROFILES).default("Rotina SOC N1"),
  realismLevel: z.enum(REALISM_LEVELS).default("operacional"),
  useAI: z.coerce.boolean().optional().default(false)
});

export const aiScenarioSchema = z.object({
  companyType: z.enum(COMPANY_TYPES),
  assetCount: z.coerce.number().int().min(1).max(10000),
  userCount: z.coerce.number().int().min(1).max(50000),
  attackType: z.enum(EVENT_TYPES),
  durationHours: z.coerce.number().int().min(1).max(720),
  noiseLevel: z.coerce.number().int().min(0).max(100),
  severity: z.enum(SEVERITIES),
  vendors: z.array(z.enum(MANUFACTURERS)).min(1).max(12),
  outputFormat: z.enum(EXPORT_FORMATS),
  logCount: z.coerce.number().int().min(10).max(5000).default(150),
  aiProvider: z.enum(["mock", "openai", "ollama"]).default("mock")
});

export const exportSchema = z.object({
  format: z.enum(EXPORT_FORMATS),
  vendor: z.string().optional(),
  severity: z.string().optional(),
  ip: z.string().optional(),
  username: z.string().optional(),
  mitreId: z.string().optional(),
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(10000).default(1000)
});

export const logSearchSchema = z.object({
  vendor: z.string().optional(),
  severity: z.string().optional(),
  ip: z.string().optional(),
  username: z.string().optional(),
  mitreId: z.string().optional(),
  q: z.string().optional(),
  take: z.coerce.number().int().min(1).max(1000).default(100),
  skip: z.coerce.number().int().min(0).default(0)
});

export const deleteLogsSchema = z.object({
  scope: z.enum(["all", "filtered"]).default("filtered"),
  filters: z.object({
    vendor: z.string().optional(),
    severity: z.string().optional(),
    ip: z.string().optional(),
    username: z.string().optional(),
    mitreId: z.string().optional(),
    q: z.string().optional()
  }).optional()
});


export const aiAnalysisSchema = z.object({
  provider: z.enum(["mock", "openai", "ollama"]).default("mock"),
  objective: z.string().max(1500).optional(),
  logs: z.array(z.object({
    id: z.string().optional(),
    timestamp: z.string().optional(),
    vendor: z.string().optional(),
    eventType: z.string().optional(),
    severity: z.string().optional(),
    sourceIp: z.string().nullable().optional(),
    destinationIp: z.string().nullable().optional(),
    username: z.string().nullable().optional(),
    hostname: z.string().nullable().optional(),
    mitreId: z.string().nullable().optional(),
    raw: z.string().min(1).max(50000),
    jsonPayload: z.string().optional(),
    riskScore: z.number().optional(),
    confidence: z.number().optional()
  })).min(1).max(20)
});

export const investigationStartSchema = z.object({
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate")
});

export const investigationSubmitSchema = z.object({
  caseId: z.string().min(1),
  classification: z.enum(["true_positive", "false_positive", "inconclusive"]),
  severity: z.enum(SEVERITIES),
  mitreId: z.string().trim().min(1).max(30),
  affectedUser: z.string().trim().min(1).max(200),
  affectedHosts: z.string().trim().min(1).max(1000),
  evidence: z.string().trim().min(20).max(5000),
  recommendedAction: z.string().trim().min(20).max(5000),
  confidence: z.coerce.number().int().min(0).max(100)
});

export const detectionLabStartSchema = z.object({
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
  noiseLevel: z.coerce.number().int().min(0).max(90).default(45),
  dropRate: z.coerce.number().int().min(0).max(40).default(5),
  duplicateRate: z.coerce.number().int().min(0).max(30).default(3),
  clockSkewSeconds: z.coerce.number().int().min(0).max(600).default(30),
  parserCorruptionRate: z.coerce.number().int().min(0).max(30).default(3),
  availableSources: z.array(z.enum(MANUFACTURERS)).min(1).max(12)
});

export const detectionValidationSchema = z.object({
  runId: z.string().min(1),
  threshold: z.coerce.number().int().min(2).max(100),
  timespanMinutes: z.coerce.number().int().min(1).max(120)
});

export const parserChallengeSchema = z.object({
  runId: z.string().min(1),
  mappings: z.record(z.string(), z.string())
});

export type GenerateInput = z.infer<typeof generateSchema>;
export type AiScenarioInput = z.infer<typeof aiScenarioSchema>;
export type ExportInput = z.infer<typeof exportSchema>;
export type DeleteLogsInput = z.infer<typeof deleteLogsSchema>;
export type AiAnalysisInput = z.infer<typeof aiAnalysisSchema>;
export type InvestigationSubmitInput = z.infer<typeof investigationSubmitSchema>;
export type DetectionLabStartInput = z.infer<typeof detectionLabStartSchema>;
