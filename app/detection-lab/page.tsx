import { DetectionEngineeringLab } from "@/components/detection-lab/detection-engineering-lab";
import { PageHeader } from "@/components/layout/page-header";

export default function DetectionLabPage() {
  return (
    <>
      <PageHeader
        title="Detection Engineering Lab"
        description="Crie um ambiente sintético, degrade a telemetria, valide regras, meça cobertura e pratique parsing em um fluxo único."
      />
      <DetectionEngineeringLab />
    </>
  );
}
