import { NextResponse } from "next/server";
import type { GeneratedLog } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function topEntries(map: Map<string, number>, limit = 10) {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, value]) => ({ name, value }));
}

export async function GET() {
  const logs = await prisma.generatedLog.findMany({ orderBy: { createdAt: "desc" }, take: 5000 });
  const settings = await prisma.setting.findUnique({ where: { key: "last_generation_ms" } });

  const vendorMap = new Map<string, number>();
  const severityMap = new Map<string, number>();
  const mitreMap = new Map<string, { technique: string; count: number }>();
  const users = new Set<string>();
  const sourceIps = new Set<string>();
  const destinationIps = new Set<string>();
  let volumeBytes = 0;

  for (const log of logs) {
    vendorMap.set(log.vendor, (vendorMap.get(log.vendor) || 0) + 1);
    severityMap.set(log.severity, (severityMap.get(log.severity) || 0) + 1);
    if (log.mitreId) {
      const current = mitreMap.get(log.mitreId) || { technique: log.mitreTechnique || "Unknown", count: 0 };
      current.count += 1;
      mitreMap.set(log.mitreId, current);
    }
    if (log.username) users.add(log.username);
    if (log.sourceIp) sourceIps.add(log.sourceIp);
    if (log.destinationIp) destinationIps.add(log.destinationIp);
    volumeBytes += Buffer.byteLength(log.raw, "utf-8");
  }

  return NextResponse.json({
    totals: {
      logs: logs.length,
      attacks: Array.from(mitreMap.values()).reduce((acc, item) => acc + item.count, 0),
      users: users.size,
      sourceIps: sourceIps.size,
      destinationIps: destinationIps.size,
      volumeBytes,
      avgGenerationMs: Number(settings?.value || 0)
    },
    byVendor: topEntries(vendorMap, 12),
    bySeverity: topEntries(severityMap, 5),
    topMitre: Array.from(mitreMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 8)
      .map(([id, data]) => ({ id, technique: data.technique, count: data.count })),
    recent: logs.slice(0, 8).map((log: GeneratedLog) => ({
      id: log.id,
      timestamp: log.timestamp.toISOString(),
      vendor: log.vendor,
      eventType: log.eventType,
      severity: log.severity,
      sourceIp: log.sourceIp,
      destinationIp: log.destinationIp,
      mitreId: log.mitreId
    }))
  });
}
