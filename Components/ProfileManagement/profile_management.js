"use client"
import React, { useState, useEffect } from 'react';
const ProfileManagement = ({ onLogout, activeAccount, setActiveAccount, onPlanUpgrade }) => {
  // const navigate = useNavigate();
  const [profilePic, setProfilePic] = useState(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  const [subscriptionPlan, setSubscriptionPlan] = useState('');
  const [subscriptionStartDate, setSubscriptionStartDate] = useState('-- -- --');
  const [subscriptionEndDate, setSubscriptionEndDate] = useState('-- -- --');
  const [isActive, setIsActive] = useState(false);

  const [currentPlan, setCurrentPlan] = useState(null);


  useEffect(() => {
    // Mocked profile data for now
    setFullName("John Doe");
    setEmail("johndoe@example.com");
    setProfilePic("https://via.placeholder.com/150"); // Placeholder image
  }, []);

  useEffect(() => {
    // Static subscription details
    setSubscriptionPlan("Basic");
    setSubscriptionStartDate("01-01-2025");
    setSubscriptionEndDate("01-01-2026");
    setIsActive(true);
  }, []);

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 5242880) {
      setProfilePic(URL.createObjectURL(file));
    } else {
      toast.error('File size should be less than 5MB');
    }
  };

  const handleLogout = () => {
    toast.success('Logged out successfully');
    setActiveAccount(null);
    localStorage.removeItem('activeAccount');
    navigate('/login');
  };


  const handleSaveChanges = () => {
    toast.success('Profile updated successfully');
  };

  const handleDeleteAccount = () => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    if (confirmDelete) {
      toast.success('Your account has been deleted.');
      onLogout();
      window.location.reload();
    }
  };

  return (
    <>
      {/* <link rel="stylesheet" href="/Styles/ProfileManagement.module..css" /> */}

    <div className="container">
      <div className="header">
        <img
          src="/assets/arrow-left.png"
          alt="Go Back"
          className="goBackIcon"
          onClick={() => navigate('/')}
        />
        <h2>Profile Management</h2>
      </div>
      <div className="profileContent">
        <div className="profileContent">
          <div className="section">
            <h3>Profile Information</h3>
            <div className="formSection">
              {/* Profile Picture Upload Section */}
              <div className="profilePicSection">
                <div className="profilePicWrapper">
                  
                    {/* <img src="/assets/profileImage.png" alt="Profile" className="profilePic" /> */}
                 
                    <div className="placeholder">
                      <img
                        src="/assets/profileImage.png"
                        alt="Placeholder"
                        className="placeholderIcon"
                      />
                    </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePicChange}
                    className="hiddenFileInput"
                  />
                </div>
                <div>
                  <p className="uploadText"><img src='/assets/upload.png' alt="Upload" /> Upload Image</p>
                  <p className="fileHint">JPG, PNG, or GIF, Max 2MB</p>
                </div>
              </div>

              {/* Full Name Input */}
              <label htmlFor="fullName" className="label">
                Full Name:
              </label>
              <input
                type="text"
                placeholder="Change Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="profileInput"
              />

              {/* Email Input */}
              <label htmlFor="email" className="label">
                Email:
              </label>
              <input
                type="email"
                placeholder="Change Email"
                value={email}
                disabled
                className="profileInput"
              />

              {/* Action Buttons */}
              <div className="buttonContainer">
                <button
                  onClick={handleDeleteAccount}
                  className="button dangerButton"
                >
                  Delete Account <img src='/assets/trash.png' alt='trash' width={20} height={20} />
                </button>
                <button
                  onClick={handleSaveChanges}
                  className="button primaryButton"
                >
                  Save Profile <img src='/assets/save.png' alt='save' width={20} height={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="subscriptionDetails">
          <div className="subscriptionHeader">
            <h2>Subscription Details</h2>
            <button className="manageBillingBtn">Manage Billing Info</button>
          </div>
          <div className="subscriptionContent">
            <div className="detailItem">
              <span>Current Plan:</span>
              <span className="tag professional">Enterpise</span>
            </div>
            <div className="detailItem">
              <span>Subscription Status:</span>
              <span className="tag active" style={{
                backgroundColor: isActive ? "#b8f7c0" : "#dc3545",
                color: isActive ? "black" : "white",
              }}>
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        <div className="infoContainer">
          <div className="infoBox">
            <h2><img src="/assets/circle-alert.png" alt='info' width={24} height={24} /> How to Change Your Connected Ad Account</h2>
            <div className="infoContent">
              <p>
                Currently, the only way to change the ad account linked to your
                subscription is by contacting our support team. Follow these simple
                steps:
              </p>
              <ol>
                <li>
                  <p className="listHeading">Contact Support</p>
                  <p>
                    Email us at support@quickcampaigns.io with
                    the subject line: <br />
                    <em>“Request To Change Connected Ad Account.”</em>
                  </p>
                </li>
                <li>
                  <p className="listHeading">Provide Necessary Information</p>
                  <ul className="innerList">
                    <li>Your Full Name And Email Address Associated With Your Subscription.</li>
                    <li>The Name Or ID Of The Currently Connected Ad Account.</li>
                    <li>A Request To Disconnect The Current Account And Connect A New One.</li>
                  </ul>
                </li>
                <li>
                  <p className="listHeading">Wait For Confirmation</p>
                  <p>
                    Our support team will verify your request and disconnect your current ad
                    account. You will receive an email notification once this process is
                    complete.
                  </p>
                </li>
                <li>
                  <p className="listHeading">Connect A New Ad Account</p>
                  <p>
                    Once confirmed, log in to your QuickCampaigns Dashboard and follow the
                    standard authorization process to connect your new ad account.
                  </p>
                </li>
              </ol>
              <div className="noteBox">
                <p>Note:</p>
                <ul>
                  <li>Please allow up to 24–48 hours for our support team to process your request.</li>
                  <li>
                    For security reasons, we can only process account change requests from the
                    subscription owner.
                  </li>
                </ul>
              </div>
              <p>
                If you have any questions or need further assistance, feel free to reach out
                to us at support@quickcampaigns.io
              </p>
            </div>
          </div>
        </div>
      </div>

      <div id="pricing-section" className="pricingSection">
        <p className="priceHeading">
          Plans That Scale With Business
        </p>
        <div className="priceCardContainer">
          {/* card 1 */}
          <div className="priceCard popularPlan">
            <div className="priceCardDescriptionContainer">
              <p className="priceCardPrice">$129.5/month</p>
              <p className="priceCardAccounts">1 Ad Account</p>
              <p className="priceCardPlan">Professional Plan</p>
              <p className="priceCardPlanDesc">
                Perfect for Individual Advertisers and Small Teams
              </p>
            </div>
            <div className="priceCardFeatureContainer">
              <div className="priceCardFeature">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="24" height="24" rx="12" fill="#378CE7" fillOpacity="0.7" />
                  <path fillRule="evenodd" clipRule="evenodd" d="M17.0964 7.39016L9.93638 14.3002L8.03638 12.2702C7.68638 11.9402 7.13638 11.9202 6.73638 12.2002C6.34638 12.4902 6.23638 13.0002 6.47638 13.4102L8.72638 17.0702C8.94638 17.4102 9.32638 17.6202 9.75638 17.6202C10.1664 17.6202 10.5564 17.4102 10.7764 17.0702C11.1364 16.6002 18.0064 8.41016 18.0064 8.41016C18.9064 7.49016 17.8164 6.68016 17.0964 7.38016V7.39016Z" fill="#EEEEEE" />
                </svg>
                Upload unlimited ads to 1 ad account.
              </div>
              <div className="priceCardFeature">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="24" height="24" rx="12" fill="#378CE7" fillOpacity="0.7" />
                  <path fillRule="evenodd" clipRule="evenodd" d="M17.0964 7.39016L9.93638 14.3002L8.03638 12.2702C7.68638 11.9402 7.13638 11.9202 6.73638 12.2002C6.34638 12.4902 6.23638 13.0002 6.47638 13.4102L8.72638 17.0702C8.94638 17.4102 9.32638 17.6202 9.75638 17.6202C10.1664 17.6202 10.5564 17.4102 10.7764 17.0702C11.1364 16.6002 18.0064 8.41016 18.0064 8.41016C18.9064 7.49016 17.8164 6.68016 17.0964 7.38016V7.39016Z" fill="#EEEEEE" />
                </svg>
                Access up to 5000 active ad creatives.
              </div>
              <div className="priceCardFeature">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="24" height="24" rx="12" fill="#378CE7" fillOpacity="0.7" />
                  <path fillRule="evenodd" clipRule="evenodd" d="M17.0964 7.39016L9.93638 14.3002L8.03638 12.2702C7.68638 11.9402 7.13638 11.9202 6.73638 12.2002C6.34638 12.4902 6.23638 13.0002 6.47638 13.4102L8.72638 17.0702C8.94638 17.4102 9.32638 17.6202 9.75638 17.6202C10.1664 17.6202 10.5564 17.4102 10.7764 17.0702C11.1364 16.6002 18.0064 8.41016 18.0064 8.41016C18.9064 7.49016 17.8164 6.68016 17.0964 7.38016V7.39016Z" fill="#EEEEEE" />
                </svg>
                Analytics Dashboard & Reporting Tools
              </div>
            </div>
            <div className="priceCardFooter">
              <button className="ctaBtn">Upgrade to Plan</button>
            </div>
          </div>

          {/* Card 2 */}
          <div className="priceCard">
            <div className="priceCardDescriptionContainer">
              <p className="priceCardPrice">$179.5/month</p>
              <p className="priceCardAccounts">Up to 3 Ad Accounts</p>
              <p className="priceCardPlan">Advanced Plan</p>
              <p className="priceCardPlanDesc">For growing businesses and teams</p>
            </div>
            <div className="priceCardFeatureContainer">
              <div className="priceCardFeature">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="24" height="24" rx="12" fill="#378CE7" fillOpacity="0.7" />
                  <path fillRule="evenodd" clipRule="evenodd" d="M17.0964 7.39016L9.93638 14.3002L8.03638 12.2702C7.68638 11.9402 7.13638 11.9202 6.73638 12.2002C6.34638 12.4902 6.23638 13.0002 6.47638 13.4102L8.72638 17.0702C8.94638 17.4102 9.32638 17.6202 9.75638 17.6202C10.1664 17.6202 10.5564 17.4102 10.7764 17.0702C11.1364 16.6002 18.0064 8.41016 18.0064 8.41016C18.9064 7.49016 17.8164 6.68016 17.0964 7.38016V7.39016Z" fill="#EEEEEE" />
                </svg>
                Upload unlimited ads to 3 ad accounts.
              </div>
              <div className="priceCardFeature">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="24" height="24" rx="12" fill="#378CE7" fillOpacity="0.7" />
                  <path fillRule="evenodd" clipRule="evenodd" d="M17.0964 7.39016L9.93638 14.3002L8.03638 12.2702C7.68638 11.9402 7.13638 11.9202 6.73638 12.2002C6.34638 12.4902 6.23638 13.0002 6.47638 13.4102L8.72638 17.0702C8.94638 17.4102 9.32638 17.6202 9.75638 17.6202C10.1664 17.6202 10.5564 17.4102 10.7764 17.0702C11.1364 16.6002 18.0064 8.41016 18.0064 8.41016C18.9064 7.49016 17.8164 6.68016 17.0964 7.38016V7.39016Z" fill="#EEEEEE" />
                </svg>
                Access up to 15000 active ad creatives.
              </div>
              <div className="priceCardFeature">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="24" height="24" rx="12" fill="#378CE7" fillOpacity="0.7" />
                  <path fillRule="evenodd" clipRule="evenodd" d="M17.0964 7.39016L9.93638 14.3002L8.03638 12.2702C7.68638 11.9402 7.13638 11.9202 6.73638 12.2002C6.34638 12.4902 6.23638 13.0002 6.47638 13.4102L8.72638 17.0702C8.94638 17.4102 9.32638 17.6202 9.75638 17.6202C10.1664 17.6202 10.5564 17.4102 10.7764 17.0702C11.1364 16.6002 18.0064 8.41016 18.0064 8.41016C18.9064 7.49016 17.8164 6.68016 17.0964 7.38016V7.39016Z" fill="#EEEEEE" />
                </svg>
                Analytics Dashboard & Reporting Tools
              </div>
            </div>
            <div className="priceCardFooter priceStartBtn">
              <button className="ctaBtn">Upgrade to Plan</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default ProfileManagement;
