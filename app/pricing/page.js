"use client"
import Header from '@/Components/Header/Header'
import React from 'react'
import styles from './Pricing.module.css'
import Link from 'next/link'

const Pricing = () => {
  return (
    <div className={styles.forclr}>
      {/* <Sidebar /> */}
      <Header />
      <div className={styles.mainContainer}>
        <main>
          <div className={styles.pricingSection}>
            <div className={styles.header}>
              <Link href="/main">
                {/* <img src="/assets/Vector4.png" alt="Go Back" className={styles.goBackIcon} onClick={() => window.history.back()} /> */}
                <Image
                  src="/assets/logo-header.png"
                  alt="Logo"
                  width={150} 
                  height={150}
                  className="logo-header"
                />
              </Link>
              <p className={styles.priceHeading}>Choose the <span>Perfect Plan</span> for Your Needs</p>
            </div>
            <p className={styles.priceDesc}>Flexible Pricing to Suit Every Advertiser</p>
            <div className={styles.priceCardContainer}>
              <div className={`${styles.priceCard} ${styles.popularPlan}`}>
                <div className={styles.popularPlanWrapper}>
                  <p>Most Popular</p>
                  <svg width="70" height="58" viewBox="0 0 70 58" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M38.5158 9.90098C25.6315 17.6818 18.4779 31.9119 14.1785 45.8289C13.9575 46.5441 13.6873 47.2619 13.4404 47.9605C12.75 46.5676 8.03917 34.9998 6.13728 35.707C5.02576 36.1204 5.66158 37.6059 5.90619 38.2052C7.67675 42.5372 9.40645 46.4209 11.522 50.6102C13.1143 53.7639 16.0773 52.9418 19.0123 51.9819C23.4934 50.5165 23.8571 50.0963 28.4466 48.4097C29.203 48.1315 29.9979 47.9067 30.699 47.5593C31.5233 47.1502 32.4071 46.2845 31.9695 45.341C31.4735 44.2716 30.3945 44.3471 29.4728 44.7397C29.2803 44.8222 29.0849 44.8977 28.8877 44.9686C26.7215 45.7463 16.8895 49.8951 16.562 49.1937C16.4515 48.9575 16.4888 48.6827 16.5306 48.4255C17.7342 41.0033 20.9214 33.9331 24.6866 27.4731C27.2199 23.126 30.4713 19.1994 34.2601 15.8874C37.3047 13.2258 40.7371 10.966 44.4762 9.40628C48.4857 7.73348 52.366 7.38881 56.6492 7.13439C59.1151 6.98817 57.162 4.63891 55.7901 4.37429C54.2823 4.08303 52.668 4.60609 51.2031 4.91103C46.5692 5.87811 42.3375 7.59325 38.5158 9.90098Z" fill="#5356FF"></path>
                  </svg>
                </div>
                <p className={styles.priceCardPrice}>$129.95/month</p>
                <p className={styles.priceCardAccounts}>1 Ad Account</p>
                <p className={styles.priceCardPlan}>Professional Plan</p>
                <p className={styles.priceCardPlanDesc}>Perfect for Individual Advertisers and Small Teams</p>
                <div className={styles.priceCardFeatureContainer}>
                  <div className={styles.priceCardFeature}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="24" height="24" rx="12" fill="#378CE7" fillOpacity="0.7"></rect>
                      <path fillRule="evenodd" clipRule="evenodd" d="M17.0964 7.39016L9.93638 14.3002L8.03638 12.2702C7.68638 11.9402 7.13638 11.9202 6.73638 12.2002C6.34638 12.4902 6.23638 13.0002 6.47638 13.4102L8.72638 17.0702C8.94638 17.4102 9.32638 17.6202 9.75638 17.6202C10.1664 17.6202 10.5564 17.4102 10.7764 17.0702C11.1364 16.6002 18.0064 8.41016 18.0064 8.41016C18.9064 7.49016 17.8164 6.68016 17.0964 7.38016V7.39016Z" fill="#EEEEEE"></path>
                    </svg>
                    Upload unlimited ads to 1 ad account.
                  </div>
                  {/* Repeat for other features */}
                </div>
                <Link href="/success" className={styles.linktag}>
                  <button className={styles.priceStartBtn}>Upgrade</button>
                </Link>
              </div>
            </div>
            <Link href="/main" className={`${styles.goBackButton} ${styles.linktag}`}>Go Back</Link>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Pricing