import { NextResponse } from "next/server";
import { analyzeGeneratedLogs } from "@/lib/ai";
import { getClientKey, rateLimit } from "@/lib/rate-limit";
import { aiAnalysisSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const limit = rateLimit(`ai-analysis:${getClientKey(request)}`, 12, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Rate limit excedido. Aguarde alguns segundos." }, { status: 429 });

  const body = await request.json().catch(() => null);
  const parsed = aiAnalysisSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido", details: parsed.error.flatten() }, { status: 400 });
  }

  const analysis = await analyzeGeneratedLogs(parsed.data);
  return NextResponse.json({ analysis });
}
