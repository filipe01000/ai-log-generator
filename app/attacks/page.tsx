import { AttackModeGrid } from "@/components/attacks/attack-mode-grid";
import { PageHeader } from "@/components/layout/page-header";

export default function AttacksPage() {
  return (
    <>
      <PageHeader
        title="Simulações prontas"
        description="Modos operacionais para Blue Team, SOC, Purple Team, Threat Hunting, CTF, ambientes setoriais, ransomware, APT e insider threat."
      />
      <AttackModeGrid />
    </>
  );
}
