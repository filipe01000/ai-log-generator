import { AiBuilderForm } from "@/components/forms/ai-builder-form";
import { PageHeader } from "@/components/layout/page-header";

export default function AiBuilderPage() {
  return (
    <>
      <PageHeader
        title="AI Scenario Builder"
        description="Construa cenários completos com linha do tempo, IOCs fictícios, TTPs, hosts, usuários e logs benignos/maliciosos misturados."
      />
      <AiBuilderForm />
    </>
  );
}
