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
                <h1>Privacy Policy for QuickCampaigns</h1>

                <section>
                    <h2>1. Introduction</h2>
                    <p>
                        QuickCampaigns is committed to protecting your privacy. This Privacy Policy explains our data
                        collection practices and your rights regarding your information.
                    </p>
                </section>

                <section>
                    <h2>2. Data Collection</h2>
                    <p>
                        <strong>Account Information:</strong> Collected during registration (name, email, company name, payment details).
                    </p>
                    <p>
                        <strong>Usage Data:</strong> We track interactions with the platform, including ad uploads and account activity.
                    </p>
                    <p>
                        <strong>Payment Information:</strong> Securely processed through third-party providers. Payment data is not stored on our servers.
                    </p>
                </section>

                <section>
                    <h2>3. Data Storage and Security</h2>
                    <p>
                        Data is securely stored on cloud servers and encrypted to protect user information. Only authorized
                        personnel have access to sensitive data.
                    </p>
                </section>

                <section>
                    <h2>4. Use of Data</h2>
                    <ul>
                        <li>Improve user experience and software functionality.</li>
                        <li>Provide customer support and resolve technical issues.</li>
                        <li>Send promotional emails (with opt-out options).</li>
                    </ul>
                </section>

                <section>
                    <h2>5. User Rights</h2>
                    <p>
                        You may request access, modification, or deletion of your personal data by contacting
                        <a href="mailto:support@quickcampaigns.io"> [support@quickcampaigns.io]</a>.
                    </p>
                </section>

                <section>
                    <h2>6. Cookies</h2>
                    <p>
                        We use cookies to enhance user experience. You can adjust cookie settings through your browser.
                    </p>
                </section>

                <section>
                    <h2>7. Policy Changes</h2>
                    <p>
                        We reserve the right to update this Privacy Policy. Users will be notified of significant changes.
                    </p>
                </section>
            </main>

            {/* Footer */}
            <Footer/>
        </div>
    )
}

export default page
