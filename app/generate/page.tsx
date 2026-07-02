import { GenerateForm } from "@/components/forms/generate-form";
import { PageHeader } from "@/components/layout/page-header";

export default function GeneratePage() {
  return (
    <>
      <PageHeader
        title="Gerador de Logs"
        description="Gere logs sintéticos realistas por fabricante, evento, severidade, ruído benigno e formato de saída."
      />
      <GenerateForm />
    </>
  );
}
