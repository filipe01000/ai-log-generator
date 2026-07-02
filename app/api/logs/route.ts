import { NextResponse } from "next/server";
import type { GeneratedLog, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { deleteLogsSchema, logSearchSchema } from "@/lib/validators";
import { sanitizeText } from "@/lib/security";
import { getClientKey, rateLimit } from "@/lib/rate-limit";

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
  if (q) {
    and.push({
      OR: [
        { raw: { contains: q } },
        { eventType: { contains: q } },
        { hostname: { contains: q } },
        { username: { contains: q } },
        { mitreTechnique: { contains: q } }
      ]
    });
  }
  return and.length ? { AND: and } : {};
}

function hasActiveFilter(input: Record<string, unknown>) {
  return ["vendor", "severity", "ip", "username", "mitreId", "q"].some((key) => Boolean(sanitizeText(input[key], 200)));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const raw = Object.fromEntries(url.searchParams.entries());
  const parsed = logSearchSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Filtros inválidos" }, { status: 400 });

  const where = buildWhere(parsed.data);
  const [logs, total] = await Promise.all([
    prisma.generatedLog.findMany({ where, orderBy: { timestamp: "desc" }, take: parsed.data.take, skip: parsed.data.skip }),
    prisma.generatedLog.count({ where })
  ]);

  return NextResponse.json({
    total,
    logs: logs.map((log: GeneratedLog) => ({ ...log, timestamp: log.timestamp.toISOString(), createdAt: log.createdAt.toISOString() }))
  });
}

export async function DELETE(request: Request) {
  const limit = rateLimit(`delete-logs:${getClientKey(request)}`, 10, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Rate limit excedido. Aguarde alguns segundos." }, { status: 429 });

  const body = await request.json().catch(() => null);
  const parsed = deleteLogsSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Payload inválido", details: parsed.error.flatten() }, { status: 400 });

  const filters = parsed.data.filters || {};

  if (parsed.data.scope === "filtered" && !hasActiveFilter(filters)) {
    return NextResponse.json({ error: "Para excluir filtrados, aplique pelo menos um filtro. Para apagar tudo, use scope=all." }, { status: 400 });
  }

  const where = parsed.data.scope === "all" ? {} : buildWhere(filters);
  const result = await prisma.generatedLog.deleteMany({ where });

  return NextResponse.json({ deleted: result.count, scope: parsed.data.scope });
}
