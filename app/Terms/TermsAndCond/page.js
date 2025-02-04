import React from "react";
import Nav from "@/Components/NavBar/Nav";
import Footer from "@/Components/Footer/Footer";

const TermsOfService = () => {
  return (
    <div id="terms-of-service">
      <head>
        <link rel="stylesheet" href="/Styles/PolicyStyles.css" />
      </head>

      <nav>
        <Nav />
      </nav>

      <main className="content">
        <h1>Terms of Service for QuickCampaigns</h1>

        <section>
          <h2>1. Introduction</h2>
          <p>
            Welcome to QuickCampaigns, a platform by Crown18 Limited designed to help marketers create and upload Facebook Ads campaigns efficiently. By using QuickCampaigns, you agree to comply with these Terms of Service.
          </p>
        </section>

        <section>
          <h2>2. Eligibility</h2>
          <p>You must be at least 18 years old and legally authorized to enter agreements to use QuickCampaigns.</p>
        </section>

        <section>
          <h2>3. Account Registration & Security</h2>
          <p>
            You must register with accurate details, including a valid email. You're responsible for securing your account credentials. Report any unauthorized access to{" "}
            <a href="mailto:support@quickcampaigns.io">support@quickcampaigns.io</a>.
          </p>
        </section>

        <section>
          <h2>4. Subscription & Billing</h2>
          <p>
            QuickCampaigns offers Free Trial, Professional, and Enterprise plans. Subscriptions auto-renew monthly unless canceled before the next billing cycle. Plan changes apply in the next cycle.
          </p>
        </section>

        <section>
          <h2>5. Refund Policy</h2>
          <p>
            Refunds are available within 30 days of purchase. Refunds will be processed to the original payment method. See our Refund Policy for full details.
          </p>
        </section>

        <section>
          <h2>6. User Conduct</h2>
          <p>Users must not:</p>
          <ul>
            <li>Misuse the platform or resell features without authorization.</li>
            <li>Provide false information or impersonate others.</li>
            <li>Create misleading or illegal ads.</li>
          </ul>
          <p>Violations may result in account suspension or termination.</p>
        </section>

        <section>
          <h2>7. Limitation of Liability</h2>
          <p>
            QuickCampaigns and its affiliates are not liable for indirect, incidental, or consequential damages, including data loss, ad account issues, or service interruptions beyond our control.
          </p>
        </section>

        <section>
          <h2>8. Intellectual Property</h2>
          <p>
            All platform-related content, trademarks, and technology belong to Crown18 Limited. Users retain rights to their campaigns, but platform tools and templates remain the property of Crown18 Limited.
          </p>
        </section>

        <section>
          <h2>9. Termination</h2>
          <p>
            Accounts may be terminated for violating these Terms. Users may cancel subscriptions anytime, but fees for the current billing cycle are non-refundable.
          </p>
        </section>

        <section>
          <h2>10. Dispute Resolution</h2>
          <p>Disputes will be resolved under the applicable jurisdiction governing Crown18 Limited.</p>
        </section>
      </main>

      <footer>
        <Footer />
      </footer>
    </div>
  );
};

export default TermsOfService;
