import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildAiScenario } from "@/lib/ai";
import { generateScenarioLogs } from "@/lib/generators";
import { getClientKey, rateLimit } from "@/lib/rate-limit";
import { aiScenarioSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const limit = rateLimit(`ai-scenario:${getClientKey(request)}`, 10, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Rate limit excedido. Aguarde alguns segundos." }, { status: 429 });

  const body = await request.json().catch(() => null);
  const parsed = aiScenarioSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Payload inválido", details: parsed.error.flatten() }, { status: 400 });

  const aiScenario = await buildAiScenario(parsed.data);

  const scenario = await prisma.scenario.create({
    data: {
      name: aiScenario.name,
      companyType: parsed.data.companyType,
      assetCount: parsed.data.assetCount,
      userCount: parsed.data.userCount,
      attackType: parsed.data.attackType,
      durationHours: parsed.data.durationHours,
      noiseLevel: parsed.data.noiseLevel,
      severity: parsed.data.severity,
      vendors: parsed.data.vendors.join(","),
      outputFormat: parsed.data.outputFormat,
      summary: aiScenario.summary,
      timelineJson: JSON.stringify(aiScenario.timeline),
      iocJson: JSON.stringify(aiScenario.iocs),
      ttpJson: JSON.stringify(aiScenario.ttps)
    }
  });

  const logs = generateScenarioLogs(parsed.data, scenario.id);
  await prisma.generatedLog.createMany({ data: logs });

  return NextResponse.json({
    scenario: {
      id: scenario.id,
      name: aiScenario.name,
      summary: aiScenario.summary,
      timeline: aiScenario.timeline,
      iocs: aiScenario.iocs,
      ttps: aiScenario.ttps,
      provider: aiScenario.provider,
      model: aiScenario.model
    },
    logs: logs.map((log) => ({ ...log, timestamp: log.timestamp.toISOString() }))
  });
}
