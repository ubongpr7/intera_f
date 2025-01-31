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
        <h1>Data Deletion Policy for QuickCampaigns</h1>

        <section>
          <h2>Last Updated: December 29, 2024</h2>
        </section>

        <section>
          <h2>Introduction</h2>
          <p>
            At QuickCampaigns.io, we prioritize user privacy and data protection. In compliance with Facebook’s platform policies
            and GDPR, we offer users full control over their personal data. If you no longer wish to use our services and would
            like to request the deletion of your data, please follow the instructions below.
          </p>
        </section>

        <section>
          <h2>How to Request Data Deletion</h2>
          <h3>Option 1: Delete via Account Settings (Recommended)</h3>
          <p>
            1. Log in to your QuickCampaigns.io account.<br />
            2. Navigate to Settings - Account.<br />
            3. Click on "Delete Account" and confirm your request.<br />
            Upon confirmation, all personal data associated with your account will be permanently deleted within 7 business days,
            except for data we are required to retain by law.
          </p>

          <h3>Option 2: Request Deletion by Email</h3>
          <p>
            Alternatively, you can email us directly at:<br />
            📧 <a href="mailto:support@quickcampaigns.io">support@quickcampaigns.io</a>
          </p>
          <ul>
            <li>Subject: Data Deletion Request</li>
            <li>Required Details: Full Name, Registered Email Address, and (Optional) Reason for Data Deletion</li>
          </ul>
          <p>
            We will process your request within 7 business days and confirm once your data has been deleted.
          </p>
        </section>

        <section>
          <h2>Automatic Data Deletion (Inactivity)</h2>
          <p>
            Accounts inactive for 12 months will be automatically deleted after receiving a 30-day prior notification. Users will
            have the opportunity to log in and reactivate their accounts before automatic deletion occurs.
          </p>
        </section>

        <section>
          <h2>Important Notes</h2>
          <ul>
            <li>Ad-related data (e.g., Facebook Ads uploaded through QuickCampaigns) may still exist within your Facebook account.
              To delete ad data, follow Facebook’s data deletion process directly.</li>
            <li>Data required for legal, regulatory, or security reasons may be retained as per applicable laws.</li>
          </ul>
        </section>

        <section>
          <h2>Need Help?</h2>
          <p>
            If you have any questions or encounter issues during the data deletion process, feel free to contact our support team at:<br />
            📧 <a href="mailto:support@quickcampaigns.io">support@quickcampaigns.io</a>
          </p>
        </section>
      </main>

      {/* Footer */}
      <Footer/>
    </div>
  )
}

export default page
