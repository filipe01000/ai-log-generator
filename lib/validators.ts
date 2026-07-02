import { z } from "zod";
import { COMPANY_TYPES, EVENT_TYPES, EXPORT_FORMATS, MANUFACTURERS, SEVERITIES, SIMULATION_MODES } from "@/lib/constants";

export const generateSchema = z.object({
  vendor: z.enum(MANUFACTURERS),
  eventType: z.enum(EVENT_TYPES),
  count: z.coerce.number().int().min(1).max(5000).default(50),
  severity: z.enum(SEVERITIES).default("medium"),
  noiseLevel: z.coerce.number().int().min(0).max(100).default(25),
  simulationMode: z.enum(SIMULATION_MODES).optional(),
  outputFormat: z.enum(EXPORT_FORMATS).default("json"),
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

export type GenerateInput = z.infer<typeof generateSchema>;
export type AiScenarioInput = z.infer<typeof aiScenarioSchema>;
export type ExportInput = z.infer<typeof exportSchema>;
export type AiAnalysisInput = z.infer<typeof aiAnalysisSchema>;
