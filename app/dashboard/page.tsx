import { PageHeader } from "@/components/layout/page-header";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Métricas do dataset sintético: volume de logs, fabricantes, severidades, técnicas MITRE, usuários, IPs e eventos recentes."
      />
      <DashboardClient />
    </>
  );
}
