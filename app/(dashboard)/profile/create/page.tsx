import CompanyProfileContainer from "@/components/company/CompanyProfileContainer";
import { WorkspaceSetupShell } from "@/components/onboarding/WorkspaceSetupShell";

export default function CreateCompanyPage() {
  return (
    <WorkspaceSetupShell
      activeStage="company"
      title="Create and activate your company workspace"
      description="Capture the company identity, address, social links, and policies needed by the inventory platform."
    >
      <CompanyProfileContainer />
    </WorkspaceSetupShell>
  );
}
