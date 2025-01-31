"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Nav from "@/Components/NavBar/Nav";
import Footer from "@/Components/Footer/Footer";
const page = () => {
  const router = useRouter(); // Use Next.js router

  return (
    <div id="terms-of-service">
      <link rel="stylesheet" href="/Styles/PolicyStyles.css" />

      {/* Header */}
      <header>
        <Nav/>
      </header>

      {/* Main Content */}
      <main className="content">
        <h1>Refund Policy for QuickCampaigns</h1>

        <section>
          <h2>1. Overview</h2>
          <p>
            We offer a 30-day money-back guarantee for all subscriptions. If you are not satisfied with the software,
            you may request a full refund.
          </p>
        </section>

        <section>
          <h2>2. Eligibility</h2>
          <p>Refunds must be requested within 30 days of the initial purchase.</p>
          <p>Only subscriptions with no more than one active campaign upload will be eligible for refunds.</p>
        </section>

        <section>
          <h2>3. Refund Process</h2>
          <p>To request a refund, contact <a href="mailto:support@quickcampaigns.io">[support@quickcampaigns.io]</a> with your account details.</p>
          <p>Refunds will be processed within 7 business days to the original payment method.</p>
        </section>

        <section>
          <h2>4. Limitations</h2>
          <p>Refunds are not provided after 30 days.</p>
          <p>Accounts that abuse the refund process may be flagged for review.</p>
        </section>

        <h1>Affiliate Program Terms for QuickCampaigns</h1>

        <section>
          <h2>1. Introduction</h2>
          <p>
            The QuickCampaigns Affiliate Program allows you to earn 30% recurring commission on referrals that lead to
            new subscriptions.
          </p>
        </section>

        <section>
          <h2>2. Enrollment and Eligibility</h2>
          <p>
            Affiliates must apply and be approved before accessing affiliate tools. We reserve the right to accept or
            deny applicants at our discretion.
          </p>
        </section>

        <section>
          <h2>3. Commission Structure</h2>
          <p>Affiliates earn 30% of each successful subscription payment.</p>
          <p>Payments are made monthly once the minimum payout threshold is met.</p>
        </section>

        <section>
          <h2>4. Affiliate Responsibilities</h2>
          <ul>
            <li>Promote the software responsibly and ethically.</li>
            <li>Avoid false advertising or misleading claims.</li>
            <li>Follow applicable advertising regulations.</li>
          </ul>
        </section>

        <section>
          <h2>5. Termination</h2>
          <p>
            Affiliate accounts may be terminated for violations, including spam marketing, false claims, or misuse of
            branding.
          </p>
          <p>
            For questions regarding the affiliate program, contact <a href="mailto:support@example.com">[support email]</a>.
          </p>
        </section>
      </main>

      {/* Footer */}
      <Footer/>
    </div>
  )
}

export default page
