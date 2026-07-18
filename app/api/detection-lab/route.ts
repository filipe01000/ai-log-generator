import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildDetectionLab, scoreParserChallenge, validateDetection, type DetectionDataset, type LabTruth } from "@/lib/detection-lab";
import { getClientKey, rateLimit } from "@/lib/rate-limit";
import { detectionLabStartSchema, detectionValidationSchema, parserChallengeSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const limit = rateLimit(`detection-lab-start:${getClientKey(request)}`, 10, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Rate limit excedido. Aguarde alguns segundos." }, { status: 429 });

  const body = await request.json().catch(() => null);
  const parsed = detectionLabStartSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Configuração inválida", details: parsed.error.flatten() }, { status: 400 });

  const generated = buildDetectionLab(parsed.data);
  const { truth, ...publicDataset } = generated;
  const run = await prisma.detectionLabRun.create({
    data: {
      name: generated.name,
      configJson: JSON.stringify(parsed.data),
      datasetJson: JSON.stringify(publicDataset),
      truthJson: JSON.stringify(truth)
    }
  });

  return NextResponse.json({ runId: run.id, ...publicDataset });
}

export async function PUT(request: Request) {
  const limit = rateLimit(`detection-lab-validate:${getClientKey(request)}`, 30, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Rate limit excedido. Aguarde alguns segundos." }, { status: 429 });

  const body = await request.json().catch(() => null);
  const parsed = detectionValidationSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Parâmetros de validação inválidos", details: parsed.error.flatten() }, { status: 400 });
  const run = await prisma.detectionLabRun.findUnique({ where: { id: parsed.data.runId } });
  if (!run) return NextResponse.json({ error: "Execução não encontrada" }, { status: 404 });

  const dataset = JSON.parse(run.datasetJson) as DetectionDataset;
  const truth = JSON.parse(run.truthJson) as LabTruth;
  const result = validateDetection(dataset, truth, parsed.data.threshold, parsed.data.timespanMinutes);
  await prisma.detectionLabRun.update({ where: { id: run.id }, data: { resultJson: JSON.stringify(result) } });
  return NextResponse.json(result);
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = parserChallengeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Mapeamento inválido" }, { status: 400 });
  const run = await prisma.detectionLabRun.findUnique({ where: { id: parsed.data.runId } });
  if (!run) return NextResponse.json({ error: "Execução não encontrada" }, { status: 404 });
  const truth = JSON.parse(run.truthJson) as LabTruth;
  return NextResponse.json(scoreParserChallenge(parsed.data.mappings, truth));
}
