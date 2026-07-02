import { PrismaClient } from "@prisma/client";
import { MITRE_TECHNIQUES } from "../lib/mitre";

const prisma = new PrismaClient();

async function main() {
  for (const technique of MITRE_TECHNIQUES) {
    await prisma.mitreTechnique.upsert({
      where: { id: technique.id },
      update: {
        tactic: technique.tactic,
        technique: technique.technique,
        subTechnique: technique.subTechnique || null,
        description: technique.description,
        detection: technique.detection,
        recommendation: technique.recommendation,
        severity: technique.severity,
        confidence: technique.confidence,
        riskScore: technique.riskScore
      },
      create: {
        id: technique.id,
        tactic: technique.tactic,
        technique: technique.technique,
        subTechnique: technique.subTechnique || null,
        description: technique.description,
        detection: technique.detection,
        recommendation: technique.recommendation,
        severity: technique.severity,
        confidence: technique.confidence,
        riskScore: technique.riskScore
      }
    });
  }

  await prisma.setting.upsert({
    where: { key: "educational_notice" },
    update: { value: "true" },
    create: {
      key: "educational_notice",
      value: "true",
      description: "Exibe aviso de uso educacional e dados sintéticos."
    }
  });

  await prisma.setting.upsert({
    where: { key: "default_ai_provider" },
    update: { value: process.env.AI_PROVIDER || "mock" },
    create: {
      key: "default_ai_provider",
      value: process.env.AI_PROVIDER || "mock",
      description: "Provider padrão para AI Scenario Builder."
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
