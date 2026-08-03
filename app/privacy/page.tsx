import { LegalList, LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";

const effectiveDate = "2 August 2026";

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      eyebrow="Privacy and data protection"
      title="Intera IMS Privacy Policy"
      description="This policy explains how InteraPro Tech Solutions handles personal data when you visit our website, create an Intera IMS account, use a workspace, contact us, or interact with our services."
      effectiveDate={effectiveDate}
    >
      <LegalSection number="01" title="Who we are">
        <p>Intera IMS is operated by <strong>InteraPro Tech Solutions</strong> (referred to as “Intera”, “we”, “us”, or “our”), with an address at 9, First Avenue Off Kilaso Way, Magbon Imowonla, Ikorodu, Lagos State, Nigeria.</p>
        <p>For privacy questions, contact <a href="mailto:privacy@interapro.tech">privacy@interapro.tech</a>. General business enquiries may be sent to <a href="mailto:business@interapro.tech">business@interapro.tech</a>. Our website is <a href="https://www.interapro.tech">www.interapro.tech</a>.</p>
      </LegalSection>

      <LegalSection number="02" title="Scope of this policy">
        <p>This policy applies to the Intera IMS website, web application, account and workspace services, product and operational features, support channels, and related communications that link to it. It applies whether you are an account owner, workspace administrator, staff member, invited member, visitor, prospect, or support contact.</p>
        <p>Intera IMS is a business operations product. A workspace may contain information entered by a business about its employees, products, suppliers, customers, transactions, locations, and other operations. In those cases, the business that controls the workspace usually decides why that information is collected and how it is used. Intera generally processes that workspace information to provide the service on the business’s instructions. The workspace owner should provide its own notices and lawful basis where required.</p>
      </LegalSection>

      <LegalSection number="03" title="The data we collect">
        <p>The information we handle depends on how you use Intera IMS and what your workspace chooses to enter. It may include:</p>
        <LegalList items={[
          "Account and identity information, such as name, email address, profile details, authentication records, MFA settings, and recovery information.",
          "Workspace information, such as workspace name, company code, industry, locations, membership, roles, invitations, permissions, and configuration.",
          "Operational information entered by a workspace, such as products, variants, barcodes, prices, stock, locations, suppliers, purchase orders, sales orders, returns, POS activity, and related records.",
          "Files and media uploaded or connected to the service, such as product images, workspace logos, documents, and attachments. These may include metadata such as file name, type, size, source, and upload time.",
          "Activity, audit, notification, and support information, including actions taken in a workspace, system messages, requests, and support correspondence.",
          "AI and agent interaction data, including prompts, questions, selected records, uploaded context, tool actions, and generated responses. Do not provide information that your organization does not permit you to share with the service.",
          "Technical information, such as IP address, browser and device type, operating system, approximate location derived from network information, request logs, error information, and security signals.",
          "Subscription and payment information, such as plan, entitlement, invoice, payment status, transaction reference, and usage. Payment providers process card or bank details; Intera does not intend to store full payment-card numbers.",
          "Information you provide when you contact us, join a waitlist, request a demonstration, apply for access, or communicate with our team."
        ]} />
        <p>We do not ask you to submit special-category or highly sensitive personal data to Intera IMS. If a workspace chooses to enter such data, the workspace owner is responsible for determining whether that processing is lawful and appropriate and for applying suitable safeguards.</p>
      </LegalSection>

      <LegalSection number="04" title="How we use personal data">
        <p>We use information for purposes connected with providing, securing, improving, and supporting Intera IMS, including to:</p>
        <LegalList items={[
          "Create and maintain accounts, workspaces, memberships, authentication, MFA, invitations, and access permissions.",
          "Provide inventory, product, POS, purchasing, sales, returns, reporting, audit, notification, and other workspace functionality selected by the customer.",
          "Store, retrieve, transform, display, and deliver data and files that a workspace asks us to process.",
          "Run AI and agent features requested by a user, return responses, execute permitted tools, and maintain the context needed for those interactions.",
          "Process subscriptions, entitlements, usage, invoices, payments, refunds, and account administration.",
          "Send service messages, security alerts, invitation messages, account notices, and support responses.",
          "Detect fraud, abuse, unauthorized access, suspicious activity, security incidents, and violations of our terms.",
          "Troubleshoot errors, monitor reliability, measure product performance, and improve the service.",
          "Meet legal, regulatory, accounting, tax, dispute-resolution, and law-enforcement obligations.",
          "Communicate product information or marketing where permitted and where you have not opted out."
        ]} />
      </LegalSection>

      <LegalSection number="05" title="Lawful bases and roles">
        <p>Depending on the context, our legal basis may be performance of a contract, compliance with a legal obligation, consent, or a legitimate interest such as protecting accounts, improving reliability, preventing abuse, and communicating with business contacts. Where we rely on consent, you may withdraw it, although withdrawal does not affect processing that already occurred lawfully.</p>
        <p>For personal data in a customer workspace, the workspace customer may be the data controller and Intera may be its processor or service provider. The customer is responsible for its instructions, user notices, permissions, retention settings, and responses to requests relating to its workspace data. Where Intera independently determines the purpose of processing, such as account security, billing administration, or service analytics, Intera may act as a controller for that processing.</p>
      </LegalSection>

      <LegalSection number="06" title="Workspace data and user responsibility">
        <p>A workspace can contain information about people who do not have an Intera account. Workspace owners and administrators must only collect and upload information they are authorized to use, must provide any required notices, and must configure roles so that people only access what they need for their work.</p>
        <p>If you are invited to a workspace, your activity and profile may be visible to that workspace’s administrators and may be recorded in its audit or operational history. Questions about a workspace’s use of your information should first be directed to the workspace owner or administrator. Intera may assist the customer where appropriate.</p>
      </LegalSection>

      <LegalSection number="07" title="AI, agents, and automated processing">
        <p>Intera IMS may provide natural-language AI and configurable agent features. These features can process the prompts, records, files, and instructions that a user selects in order to produce an answer or perform an authorized action. The available context and tools depend on the workspace configuration and the user’s permissions.</p>
        <p>AI output can be incomplete, inaccurate, outdated, or unsuitable for a particular decision. Users must review important outputs and remain responsible for business, financial, employment, safety, inventory, and compliance decisions. Do not rely on an AI response as professional legal, accounting, medical, or security advice.</p>
        <p>Intera does not intentionally use customer workspace content to train a public model unless the customer separately agrees to that use or the applicable service terms clearly say otherwise. Lawyer and technical review should confirm the providers, retention settings, and cross-border arrangements used for each AI integration before launch.</p>
      </LegalSection>

      <LegalSection number="08" title="Analytics and Microsoft Clarity">
        <p>We may use Microsoft Clarity to understand how visitors and users interact with the public product experience, improve usability, and identify technical problems. The current application integration is configured not to initialize Clarity on routes under <code>/accounts</code>, which covers the authentication area. This does not replace a review of masking, consent, retention, and project settings in the Clarity dashboard.</p>
        <p>We do not intend to use analytics tools to collect passwords, MFA codes, payment-card details, or other secrets. Users should still avoid entering secrets into free-text fields that are not intended for them. Analytics preferences, consent controls, and any regional restrictions should be configured before production publication.</p>
      </LegalSection>

      <LegalSection number="09" title="Cookies and similar technologies">
        <p>Intera IMS may use essential cookies or browser storage to maintain authentication, security, workspace selection, preferences, and application operation. We may also use analytics technologies where enabled. Some third-party services may set their own cookies or identifiers.</p>
        <p>Browser settings can block or delete cookies, but doing so may prevent sign-in or reduce functionality. Where consent is legally required for non-essential technologies, we will seek it through an appropriate notice or preference mechanism.</p>
      </LegalSection>

      <LegalSection number="10" title="Service providers and disclosures">
        <p>We may disclose information to providers that help us operate Intera IMS, subject to appropriate contractual, security, and confidentiality obligations. These providers may include:</p>
        <LegalList items={[
          "Cloud hosting, database, backup, object-storage, content-delivery, and infrastructure providers.",
          "Email, authentication, identity, social sign-in, notification, and customer-support providers.",
          "Payment and subscription providers that process payment instructions and transaction status.",
          "AI, agent, search, catalog, barcode, realtime, voice, video, and integration providers selected for a workspace feature.",
          "Security, monitoring, error-reporting, analytics, audit, and compliance providers.",
          "Professional advisers, insurers, auditors, legal representatives, or authorities where disclosure is required or reasonably necessary."
        ]} />
        <p>We do not sell personal data. We may disclose information as part of a merger, acquisition, financing, restructuring, or sale of assets, subject to appropriate confidentiality and legal requirements.</p>
      </LegalSection>

      <LegalSection number="11" title="International processing">
        <p>Some providers may process information outside Nigeria. Where personal data is transferred across borders, we will seek to use a lawful transfer mechanism and appropriate safeguards required by applicable data-protection law. Customers remain responsible for assessing whether their workspace instructions and data transfers meet their own regulatory obligations.</p>
      </LegalSection>

      <LegalSection number="12" title="Security">
        <p>We use administrative, technical, and organizational measures intended to protect information, including authentication controls, MFA support, role-based access, workspace scoping, audit history, restricted service access, transport security, backups, and incident monitoring. No online service can guarantee absolute security.</p>
        <p>Keep credentials and MFA devices private, use unique passwords, review workspace membership, and report suspected unauthorized access promptly to <a href="mailto:security@interapro.tech">security@interapro.tech</a>. Workspace owners should remove former members and rotate exposed credentials without delay.</p>
      </LegalSection>

      <LegalSection number="13" title="Retention and deletion">
        <p>We retain information for as long as necessary to provide the service, maintain an account or workspace, resolve disputes, enforce agreements, meet legal and accounting obligations, protect the service, and maintain legitimate business records. Retention periods vary by data type and customer instruction.</p>
        <p>When an account or workspace is closed, data may remain in backups, audit records, legal holds, or aggregated and de-identified records for a limited period. Workspace customers may request export or deletion of workspace data, subject to contract, security verification, legal obligations, and the technical operation of backups.</p>
      </LegalSection>

      <LegalSection number="14" title="Your privacy rights">
        <p>Subject to applicable law and the role of the relevant organization, you may have rights to be informed, access your data, request correction, object to or restrict processing, request deletion, request portability, withdraw consent, and complain to a competent data-protection authority. You may also have rights relating to significant decisions based solely on automated processing.</p>
        <p>To make a request, email <a href="mailto:privacy@interapro.tech">privacy@interapro.tech</a> with enough detail for us to identify the request and the relevant account or workspace. We may need to verify identity and may refer a workspace-data request to the relevant workspace owner. We aim to respond within the period required by applicable law.</p>
      </LegalSection>

      <LegalSection number="15" title="Children">
        <p>Intera IMS is intended for businesses and professional users, not children. We do not knowingly seek personal data from children. If you believe a child has provided information, contact us so that we can investigate and take appropriate action.</p>
      </LegalSection>

      <LegalSection number="16" title="Changes to this policy">
        <p>We may update this policy when the service, law, providers, or our processing practices change. We will publish the updated version with a new effective date and, where appropriate, provide additional notice. Continued use after an update means the updated policy applies to future use, subject to any rights that cannot be waived.</p>
      </LegalSection>

      <LegalSection number="17" title="Contact">
        <p>For privacy, data-protection, or rights requests:</p>
        <LegalList items={[
          "Email: privacy@interapro.tech",
          "General business email: business@interapro.tech",
          "Phone: +234 704 204 2034",
          "Address: 9, First Avenue Off Kilaso Way, Magbon Imowonla, Ikorodu, Lagos State, Nigeria"
        ]} />
      </LegalSection>
    </LegalPageLayout>
  );
}
