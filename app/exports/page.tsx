import { ExportForm } from "@/components/forms/export-form";
import { PageHeader } from "@/components/layout/page-header";

export default function ExportsPage() {
  return (
    <>
      <PageHeader
        title="Exportações"
        description="Exporte datasets sintéticos em TXT, JSON, CSV, Syslog, CEF, LEEF, EVTX simulado e NDJSON."
      />
      <ExportForm />
    </>
  );
}
