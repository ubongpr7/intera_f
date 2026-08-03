import { LegalList, LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";

const effectiveDate = "2 August 2026";

export default function TermsPage() {
  return (
    <LegalPageLayout
      eyebrow="Service terms"
      title="Intera IMS Terms and Conditions"
      description="These terms govern access to and use of the Intera IMS website and business operations service. They are written for review and finalization with legal counsel before production publication."
      effectiveDate={effectiveDate}
    >
      <LegalSection number="01" title="Agreement and definitions">
        <p>These Terms and Conditions are an agreement between you and <strong>InteraPro Tech Solutions</strong> (“Intera”, “we”, “us”, or “our”) concerning your use of Intera IMS, including its website, application, APIs, integrations, communications, and related services (together, the “Service”).</p>
        <p>“Customer” means the person or organization that creates or controls a workspace. “Workspace” means the customer environment and its configuration, members, records, permissions, and connected services. “User” means a person authorized to access a workspace. “Customer Data” means information, files, prompts, records, and other content submitted to or generated for a customer workspace.</p>
      </LegalSection>

      <LegalSection number="02" title="Acceptance and authority">
        <p>By creating an account, accepting an invitation, selecting a plan, accessing a workspace, or using the Service, you agree to these terms and our <a href="/privacy">Privacy Policy</a>. If you use the Service for an organization, you confirm that you have authority to bind that organization.</p>
        <p>If you do not agree, do not create an account or use the Service. We may require a user to confirm acceptance of updated terms before continuing to use material parts of the Service.</p>
      </LegalSection>

      <LegalSection number="03" title="Eligibility and accounts">
        <p>The Service is intended for businesses and professional users. You must provide accurate information, keep account details current, protect your credentials and MFA methods, and promptly report unauthorized use. You may not share an account, impersonate another person, or create an account for someone without authorization.</p>
        <p>Workspace owners and administrators control invitations, roles, access, connected services, and many data-management decisions. They are responsible for ensuring that members are authorized and that the workspace’s use of the Service complies with applicable law and internal policy.</p>
      </LegalSection>

      <LegalSection number="04" title="Workspaces, roles, and member access">
        <p>Each workspace is a distinct operating environment. A user may belong to more than one workspace, and access may differ by workspace. Users must select and operate in the correct workspace and must not attempt to bypass workspace boundaries or access records outside their permissions.</p>
        <p>Customers are responsible for reviewing members and permissions, disabling access when a person leaves or changes role, protecting invitation links, and ensuring that their instructions to Intera are lawful. Actions taken by an authorized member may be attributed to the customer and may appear in audit history.</p>
      </LegalSection>

      <LegalSection number="05" title="The Service">
        <p>Intera IMS provides tools for inventory and business operations, which may include products and variants, barcode-supported product data, locations, stock movements, pricing, purchasing, sales, returns, POS workflows, reporting, audit history, notifications, subscriptions, and configurable AI or agent assistance.</p>
        <p>Features, limits, integrations, availability, and plan entitlements may change. Some functionality may be marked as beta, experimental, coming soon, or dependent on third-party providers. We do not promise that every feature will be available in every location, plan, device, or integration.</p>
      </LegalSection>

      <LegalSection number="06" title="Subscriptions, trials, and payments">
        <p>Some features require a paid plan or an active subscription. A trial, promotional entitlement, or free plan may have limits, expiry conditions, or verification requirements. The applicable checkout, order summary, plan page, or written order controls the price, billing interval, taxes, and renewal terms shown to you.</p>
        <p>Payments may be processed by a third-party payment provider. You authorize the selected payment method for approved charges and are responsible for accurate billing information. We may suspend paid functionality for failed, reversed, disputed, or overdue payments after reasonable notice where required.</p>
        <p>Where the Service uses Intera Coins or another usage unit, the applicable plan or purchase screen describes the units, permitted uses, expiry or refund rules, and any limits. Usage units are not money, securities, or a deposit and may not be resold or transferred unless we expressly allow it.</p>
      </LegalSection>

      <LegalSection number="07" title="Customer Data and instructions">
        <p>You retain your rights in Customer Data. You grant Intera the limited rights needed to host, copy, transmit, display, index, back up, secure, and otherwise process Customer Data to provide, maintain, troubleshoot, and improve the Service, as permitted by your instructions and our Privacy Policy.</p>
        <p>You represent that you have the rights, notices, permissions, and lawful basis needed for Customer Data and that your instructions will not cause Intera to violate law or another person’s rights. You must not upload passwords, private keys, payment-card numbers, or unnecessary sensitive data.</p>
        <p>We may remove or restrict content that creates a security, legal, operational, or rights risk. We may preserve information where required for an investigation, legal obligation, dispute, or security response.</p>
      </LegalSection>

      <LegalSection number="08" title="AI and agent features">
        <p>AI and agent features are assistive tools, not a substitute for responsible review. You are responsible for checking outputs, confirming calculations, validating actions, and ensuring that an agent has only the permissions and tools it needs. You must not use an AI output as the sole basis for a decision that could materially affect a person without appropriate human review.</p>
        <p>Agent actions may depend on configuration, permissions, external services, incomplete data, or model limitations. We are not responsible for a decision you make solely because an AI response appeared confident or complete. Customers should establish internal approval rules for stock, pricing, purchasing, financial, employment, and other consequential workflows.</p>
      </LegalSection>

      <LegalSection number="09" title="Operational records and responsibility">
        <p>Intera IMS helps organize and trace operational activity but does not independently verify every product, barcode, price, quantity, supplier, employee, customer, or transaction entered by a user. Customers are responsible for physical counts, reconciliations, approvals, tax treatment, financial records, product safety, and compliance obligations.</p>
        <p>Anti-theft signals, audit records, role controls, alerts, and reports can support investigation and accountability. They do not guarantee prevention, detection, recovery, or prosecution of theft, fraud, loss, or unauthorized activity. Customers must maintain suitable physical, financial, and supervisory controls.</p>
      </LegalSection>

      <LegalSection number="10" title="Acceptable use">
        <p>You may use the Service only for lawful business purposes and in accordance with these terms. You must not:</p>
        <LegalList items={[
          "Access or probe another workspace, account, system, or dataset without authorization.",
          "Circumvent plan limits, security controls, payment requirements, rate limits, or usage metering.",
          "Upload malware, unlawful content, infringing material, or information collected without the required authority.",
          "Use the Service to harass, defraud, impersonate, discriminate against, or harm another person.",
          "Reverse engineer, copy, scrape, resell, frame, or create a competing service from the Service except where applicable law permits it.",
          "Use the Service for emergency, safety-critical, unlawful surveillance, or other high-risk decisions without appropriate independent controls and human review."
        ]} />
      </LegalSection>

      <LegalSection number="11" title="Third-party services and integrations">
        <p>The Service may connect to third-party hosting, payment, email, authentication, AI, catalog, barcode, storage, realtime, communications, analytics, and other providers. A third party may impose its own terms, privacy policy, limits, or availability conditions. We are not responsible for a third party’s independent acts or failures.</p>
        <p>You authorize an integration only when you have authority to do so. Review scopes, credentials, data destinations, and revocation controls before connecting a service. We may disable an integration that creates a security, legal, or reliability risk.</p>
      </LegalSection>

      <LegalSection number="12" title="Support and access to customer environments">
        <p>Intera may provide support, maintenance, troubleshooting, and incident response. Where support access to a workspace is needed, access should be limited, logged, authorized, and removed when no longer required. Customers should not give support staff more access than necessary.</p>
        <p>Support channels are not guaranteed to be monitored continuously. Do not use them for emergencies or send secrets in a support request.</p>
      </LegalSection>

      <LegalSection number="13" title="Intellectual property">
        <p>Intera and its licensors own the Service, software, designs, documentation, names, logos, templates, and related intellectual property, excluding Customer Data and third-party materials. These terms grant you a limited, non-exclusive, non-transferable right to use the Service during the applicable subscription or authorization period.</p>
        <p>You may provide suggestions or feedback. We may use feedback without restriction or payment, provided that doing so does not disclose your confidential information.</p>
      </LegalSection>

      <LegalSection number="14" title="Confidentiality">
        <p>Each party may receive non-public information from the other. The recipient must use reasonable care, use the information only for the relationship, and disclose it only to people or providers who need it and are bound to protect it. These obligations do not apply to information that is public without breach, already known lawfully, independently developed, or required to be disclosed by law.</p>
      </LegalSection>

      <LegalSection number="15" title="Availability, maintenance, and changes">
        <p>We aim to provide a reliable service but do not guarantee uninterrupted or error-free operation. Availability may be affected by maintenance, upgrades, security events, internet services, third-party providers, force majeure, or events outside our reasonable control.</p>
        <p>We may change, suspend, or discontinue a feature. Where a change materially reduces a paid service, we will seek to provide reasonable notice or an appropriate remedy where required by the applicable agreement or law.</p>
      </LegalSection>

      <LegalSection number="16" title="Suspension and termination">
        <p>You may stop using the Service or close an account subject to any outstanding payment and customer obligations. We may suspend or terminate access if necessary to protect the Service, comply with law, address non-payment, investigate misuse, or enforce these terms. Where reasonable and lawful, we will provide notice and an opportunity to correct the issue.</p>
        <p>After termination, access may stop and Customer Data may be deleted according to the applicable retention process, legal requirements, backups, and any agreed export period. Sections that by their nature should continue, including intellectual property, confidentiality, disclaimers, liability, and dispute terms, will survive.</p>
      </LegalSection>

      <LegalSection number="17" title="Disclaimers">
        <p>To the maximum extent permitted by law, the Service is provided on an “as available” and “as is” basis. We disclaim implied warranties of fitness for a particular purpose, merchantability, non-infringement, uninterrupted availability, and error-free operation, except where a warranty cannot lawfully be excluded.</p>
        <p>We do not guarantee that the Service will prevent theft, loss, fraud, unauthorized access, operational mistakes, regulatory penalties, or business interruption. You remain responsible for independent backups, reconciliations, approvals, and controls appropriate to your business.</p>
      </LegalSection>

      <LegalSection number="18" title="Limitation of liability">
        <p>To the maximum extent permitted by law, Intera will not be liable for indirect, incidental, special, consequential, exemplary, or punitive loss, or for lost profits, revenue, goodwill, data, or business opportunity arising from use of or inability to use the Service.</p>
        <p>Subject to mandatory law and any written order, Intera’s aggregate liability for claims relating to the Service will be limited to the fees paid or payable for the affected Service during the twelve months before the event giving rise to the claim. This limitation does not limit liability that cannot lawfully be limited.</p>
      </LegalSection>

      <LegalSection number="19" title="Indemnity">
        <p>To the extent permitted by law, you will defend and hold Intera and its personnel harmless from claims, losses, liabilities, costs, and expenses arising from your Customer Data, unlawful instructions, misuse of the Service, breach of these terms, or violation of another person’s rights. We will give reasonable notice and cooperation for a covered claim. Final legal wording should be confirmed in the customer agreement reviewed by counsel.</p>
      </LegalSection>

      <LegalSection number="20" title="Governing law and disputes">
        <p>These terms are intended to be governed by the laws of the Federal Republic of Nigeria, subject to the final advice of our lawyer and any mandatory consumer or data-protection rights. The parties should first try in good faith to resolve a dispute through written notice and discussion before starting formal proceedings.</p>
        <p>The appropriate court, venue, arbitration process, notice period, consumer exceptions, and business-customer rules must be finalized in the lawyer-reviewed version.</p>
      </LegalSection>

      <LegalSection number="21" title="Changes and notices">
        <p>We may update these terms by publishing a new version, changing the effective date, and providing additional notice where appropriate. Continued use after the effective date means the updated terms apply to future use. If a change requires express acceptance, we will request it.</p>
        <p>Legal notices may be sent to <a href="mailto:legal@interapro.tech">legal@interapro.tech</a> or <a href="mailto:business@interapro.tech">business@interapro.tech</a>, or to the address provided below.</p>
      </LegalSection>
      <LegalSection number="22" title="Contact and review status">
        <p>InteraPro Tech Solutions<br />9, First Avenue Off Kilaso Way, Magbon Imowonla<br />Ikorodu, Lagos State, Nigeria<br /><a href="https://www.interapro.tech">www.interapro.tech</a><br />Phone: <a href="tel:+2347042042034">+234 704 204 2034</a></p>
      </LegalSection>

    </LegalPageLayout>
  );
}
