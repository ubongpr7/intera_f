import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { PrivacyPolicyContent } from "@/components/legal/LegalPolicyContent";

const effectiveDate = "2 August 2026";

export const metadata = {
  title: "Privacy Policy | Intera IMS",
  description: "How InteraProTech handles personal data when you visit, contact, or use Intera IMS.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      eyebrow="Privacy and data protection"
      title="Intera IMS Privacy Policy"
      description="This policy explains how InteraPro Tech Solutions handles personal data when you visit our website, create an Intera IMS account, use a workspace, contact us, or interact with our services."
      effectiveDate={effectiveDate}
    >
      <PrivacyPolicyContent />
    </LegalPageLayout>
  );
}
