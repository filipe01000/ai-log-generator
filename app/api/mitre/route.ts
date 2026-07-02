import { NextResponse } from "next/server";
import { MITRE_TECHNIQUES } from "@/lib/mitre";

export async function GET() {
  return NextResponse.json({ techniques: MITRE_TECHNIQUES });
}
