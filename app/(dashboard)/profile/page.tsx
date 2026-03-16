import CompanyProfileContainer from "@/components/company/CompanyProfileContainer";
import { WorkspaceSetupShell } from "@/components/onboarding/WorkspaceSetupShell";

export default function CreateCompanyPage() {
  return (
    <WorkspaceSetupShell
      activeStage="company"
      title="Create and activate your company workspace"
      description="This onboarding flow is intentionally step-based. Capture your company identity first, then address, social links, and policies so the rest of the inventory platform has a clean operating context."
    >
      <CompanyProfileContainer />
    </WorkspaceSetupShell>
  );
}
