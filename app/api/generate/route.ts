import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSchema } from "@/lib/validators";
import { generateLogBatch } from "@/lib/generators";
import { getClientKey, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const limit = rateLimit(`generate:${getClientKey(request)}`, 20, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Rate limit excedido. Aguarde alguns segundos." }, { status: 429 });

  const startedAt = Date.now();
  const body = await request.json().catch(() => null);
  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Payload inválido", details: parsed.error.flatten() }, { status: 400 });

  const logs = generateLogBatch(parsed.data);
  await prisma.generatedLog.createMany({ data: logs });

  const generationMs = Date.now() - startedAt;
  await prisma.setting.upsert({
    where: { key: "last_generation_ms" },
    create: { key: "last_generation_ms", value: String(generationMs), description: "Tempo da última geração em milissegundos" },
    update: { value: String(generationMs) }
  });

  return NextResponse.json({
    generationMs,
    count: logs.length,
    logs: logs.map((log) => ({ ...log, timestamp: log.timestamp.toISOString() }))
  });
}
