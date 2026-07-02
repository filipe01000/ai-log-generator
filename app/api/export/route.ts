import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { exportLogs, type ExportFormat } from "@/lib/exporters";
import { getClientKey, rateLimit } from "@/lib/rate-limit";
import { sanitizeText } from "@/lib/security";
import { exportSchema } from "@/lib/validators";

function buildWhere(input: Record<string, unknown>): Prisma.GeneratedLogWhereInput {
  const vendor = sanitizeText(input.vendor, 80);
  const severity = sanitizeText(input.severity, 30);
  const ip = sanitizeText(input.ip, 80);
  const username = sanitizeText(input.username, 80);
  const mitreId = sanitizeText(input.mitreId, 30);
  const q = sanitizeText(input.q, 200);

  const and: Prisma.GeneratedLogWhereInput[] = [];
  if (vendor) and.push({ vendor });
  if (severity) and.push({ severity });
  if (username) and.push({ username: { contains: username } });
  if (mitreId) and.push({ mitreId: { contains: mitreId } });
  if (ip) and.push({ OR: [{ sourceIp: { contains: ip } }, { destinationIp: { contains: ip } }] });
  if (q) and.push({ OR: [{ raw: { contains: q } }, { eventType: { contains: q } }, { hostname: { contains: q } }] });
  return and.length ? { AND: and } : {};
}

export async function POST(request: Request) {
  const limit = rateLimit(`export:${getClientKey(request)}`, 20, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Rate limit excedido. Aguarde alguns segundos." }, { status: 429 });

  const body = await request.json().catch(() => null);
  const parsed = exportSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Payload inválido", details: parsed.error.flatten() }, { status: 400 });

  const where = buildWhere(parsed.data);
  const logs = await prisma.generatedLog.findMany({ where, orderBy: { timestamp: "desc" }, take: parsed.data.limit });
  const result = exportLogs(logs, parsed.data.format as ExportFormat);
  const filename = `ai-log-generator-${new Date().toISOString().replace(/[:.]/g, "-")}.${result.extension}`;

  await prisma.exportJob.create({
    data: {
      format: parsed.data.format,
      filename,
      recordCount: logs.length,
      filtersJson: JSON.stringify(parsed.data)
    }
  });

  return NextResponse.json({
    filename,
    format: parsed.data.format,
    recordCount: logs.length,
    mimeType: result.mimeType,
    content: result.content
  });
}
