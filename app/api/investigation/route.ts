import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildInvestigationCase, publicInvestigationLog, scoreInvestigation, type InvestigationGroundTruth } from "@/lib/investigation";
import { getClientKey, rateLimit } from "@/lib/rate-limit";
import { investigationStartSchema, investigationSubmitSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const limit = rateLimit(`investigation-start:${getClientKey(request)}`, 15, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Rate limit excedido. Aguarde alguns segundos." }, { status: 429 });

  const body = await request.json().catch(() => ({}));
  const parsed = investigationStartSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dificuldade inválida" }, { status: 400 });

  const generated = buildInvestigationCase(parsed.data.difficulty);
  const investigationCase = await prisma.investigationCase.create({
    data: {
      title: generated.title,
      difficulty: generated.difficulty,
      briefing: generated.briefing,
      logsJson: JSON.stringify(generated.logs.map(publicInvestigationLog)),
      groundTruthJson: JSON.stringify(generated.groundTruth)
    }
  });

  return NextResponse.json({
    case: {
      id: investigationCase.id,
      title: generated.title,
      difficulty: generated.difficulty,
      briefing: generated.briefing,
      createdAt: investigationCase.createdAt.toISOString()
    },
    logs: generated.logs.map(publicInvestigationLog)
  });
}

export async function PUT(request: Request) {
  const limit = rateLimit(`investigation-submit:${getClientKey(request)}`, 30, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Rate limit excedido. Aguarde alguns segundos." }, { status: 429 });

  const body = await request.json().catch(() => null);
  const parsed = investigationSubmitSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Resposta incompleta", details: parsed.error.flatten() }, { status: 400 });

  const investigationCase = await prisma.investigationCase.findUnique({ where: { id: parsed.data.caseId } });
  if (!investigationCase) return NextResponse.json({ error: "Caso não encontrado" }, { status: 404 });
  if (investigationCase.status === "completed" && investigationCase.resultJson) {
    return NextResponse.json(JSON.parse(investigationCase.resultJson));
  }

  const truth = JSON.parse(investigationCase.groundTruthJson) as InvestigationGroundTruth;
  const result = scoreInvestigation(parsed.data, truth);
  await prisma.investigationCase.update({
    where: { id: investigationCase.id },
    data: {
      status: "completed",
      score: result.score,
      resultJson: JSON.stringify(result),
      completedAt: new Date()
    }
  });

  return NextResponse.json(result);
}
