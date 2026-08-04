import { LegalList, LegalSection } from "@/components/legal/LegalPageLayout";

export function TermsPolicyContent() {
  return (
    <>
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
    </>
  );
}

export function PrivacyPolicyContent() {
  return (
    <>
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
    </>
  );
}

