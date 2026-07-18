import { InvestigationLab } from "@/components/investigation/investigation-lab";
import { PageHeader } from "@/components/layout/page-header";

export default function InvestigationPage() {
  return (
    <>
      <PageHeader
        title="Investigation Mode"
        description="Investigue uma timeline multivendor sem ver o gabarito. Classifique o caso, documente evidências e receba uma avaliação objetiva de SOC."
      />
      <InvestigationLab />
    </>
  );
}
