import React from 'react'
import Link from 'next/link';

const Footer = () => {
  return (
    <div>
      <footer>
        <div className="footer-first-col">
          <Link href="/"><img className="footer-logo" src="/assets/logo-footer.png" alt="QuickCampaigns Footer Logo" /></Link>
          <p className="footer-logo-desc">
            Our software intelligently creates campaigns, ad sets, and ads based on your selected folders and default settings.
          </p>
        </div>
        <div className="footer-column-container footer-second-col">
          <div>
            <p>Pages</p>
            <ul>
              <li><Link href="/">Home</Link></li>
              <li><Link href="/#benefit-section" className="nav-link" >Benefits</Link></li>
              <li><Link href="/#pricing-section" className="nav-link" >Pricing</Link></li>
              <li><Link href="/#review-section" className="nav-link" >Reviews</Link></li>
              <li><Link href="/#faq-section" className="nav-link">FAQ’s</Link></li>
            </ul>
          </div>
          <div>
            <p>Help</p>
            <ul>
              <li><Link href="/Terms/TermsAndCond">Terms & Conditions</Link></li>
              <li><Link href="/Terms/PrivacyPolicy">Privacy Policy</Link></li>
              <li><Link href="/Terms/RefundPolicy">Refund Policy</Link></li>
              <li><Link href="/Terms/DeletionPolicy">Data Deletion Policy</Link></li>
              <li><Link href="/Terms/CookiesPolicy">Cookies Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-third-col">
          <p>Newsletter</p>
          <input type="text" placeholder="Enter your email" />
          <br />
          <button className="subscribe-btn">Subscribe Now</button>
        </div>
      </footer>
    </div>
  )
}

export default Footer
