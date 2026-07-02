import { PageHeader } from "@/components/layout/page-header";
import { GeneratedLogsClient } from "@/components/tables/generated-logs-client";

export default function LogsPage() {
  return (
    <>
      <PageHeader
        title="Logs Gerados"
        description="Raw concentrado, parser de campos, análise por IA, tabela filtrável, JSON formatado e cópia para clipboard."
      />
      <GeneratedLogsClient />
    </>
  );
}
