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
        <Nav />
      </header>

      {/* Main Content */}
      <main className="content">
        <h1>Cookie Policy for QuickCampaigns.io</h1>
        <p className="lastUpdated">Last Updated: December 30, 2024</p>
        <p>
          At QuickCampaigns.io, we use cookies to enhance user experience, improve site performance, and serve personalized content. Below is a detailed list of the cookies we use, categorized by function. Users can manage their preferences at any time by visiting the <a href="/cookie-settings" className="link">Cookie Settings</a> page.
        </p>

        <section>
          <h2>1. Essential Cookies (Always Active)</h2>
          <ul>
            <li><strong>session_id:</strong> Maintains user login sessions. <em>Expires:</em> End of session.</li>
            <li><strong>csrf_token:</strong> Ensures secure form submissions. <em>Expires:</em> 1 day.</li>
            <li><strong>cookie_consent_status:</strong> Stores consent preferences. <em>Expires:</em> 365 days.</li>
          </ul>
        </section>

        <section>
          <h2>2. Analytics Cookies</h2>
          <ul>
            <li><strong>_ga:</strong> Tracks visits. <em>Expires:</em> 2 years.</li>
            <li><strong>_gid:</strong> Tracks activity. <em>Expires:</em> 1 day.</li>
          </ul>
        </section>

        <section>
          <h2>3. Marketing Cookies</h2>
          <ul>
            <li><strong>fr:</strong> Retargeting ads. <em>Expires:</em> 90 days.</li>
          </ul>
        </section>

        <section>
          <h2>4. Functional Cookies</h2>
          <ul>
            <li><strong>theme:</strong> Stores theme preferences. <em>Expires:</em> 30 days.</li>
          </ul>
        </section>

        <section>
          <p>For questions, contact <a href="mailto:support@quickcampaigns.io" className="link">support@quickcampaigns.io</a>.</p>
        </section>
      </main>
      {/* Footer */}
      <Footer />
    </div>
  )
}

export default page
