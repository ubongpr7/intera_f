import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { TermsPolicyContent } from "@/components/legal/LegalPolicyContent";

const effectiveDate = "2 August 2026";

export const metadata = {
  title: "Terms and Conditions | Intera IMS",
  description: "Terms governing access to and use of the Intera IMS website and business operations service.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPageLayout
      eyebrow="Service terms"
      title="Intera IMS Terms and Conditions"
      description="These terms govern access to and use of the Intera IMS website and business operations service. They are written for review and finalization with legal counsel before production publication."
      effectiveDate={effectiveDate}
    >
      <TermsPolicyContent />
    </LegalPageLayout>
  );
}
