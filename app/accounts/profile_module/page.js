"use client";
import React, { useState } from "react";
import "/public/Styles/ProfileModule.css";
import "/public/Styles/side-menu.css";
import "/public/Styles/style.css";
import Sidebar from "@/Components/Sidebar/Sidebar";
import Header from "@/Components/Header/Header";
import Link from "next/link";

const Page = () => {
    // States for handling profile data and image
    const [fullName, setFullName] = useState("test account");
    const [email] = useState("alihusnain@test.com");
    const [profilePic, setProfilePic] = useState("/assets/profileImage.png");
    const [isConfirmDelete, setIsConfirmDelete] = useState(false);

    // Function to handle profile picture upload
    const handleProfilePicChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePic(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Function to handle delete account confirmation
    const handleDeleteAccount = () => {
        if (isConfirmDelete) {
            // Here you'd normally make an API request to delete the account
            console.log("Account Deleted!");
            // Redirect to home or login page after deletion
            // Example: window.location.href = "/home";
        } else {
            setIsConfirmDelete(true);
        }
    };

    // Function to handle profile save
    const handleSaveProfile = () => {
        console.log("Profile Saved:", { fullName, email, profilePic });
        // Make API request to save the profile data
    };

    return (
        <div className="forclr">
            <Sidebar />
            <Header />
            <div className="main-container">
                <div className="main-content" id="content">
                    <main>
                        <div className="content">
                            <div className="p-container">
                                <div className="header">
                                    {/* <img
                                        src="/assets/arrow-left.png"
                                        alt="Go Back"
                                        className="goBackIcon"
                                        onClick={() => window.history.back()}
                                    /> */}
                                    <Link href="/main"><img src="/assets/arrow-left.png" alt="Go Back" className="goBackIcon"/></Link>
                                    <h2>Profile Management</h2>
                                </div>
                                <div className="profileContent">
                                    <div className="section">
                                        <h3>Profile Information</h3>
                                        <div className="formSection">
                                            <div className="profilePicSection">
                                                <div className="profilePicWrapper">
                                                    <div className="placeholder">
                                                        <img
                                                            src={profilePic}
                                                            alt="Profile"
                                                            className="placeholderIcon"
                                                        />
                                                    </div>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hiddenFileInput"
                                                        onChange={handleProfilePicChange}
                                                    />
                                                </div>
                                                <div>
                                                    <p className="uploadText">
                                                        <img src="/assets/upload.png" alt="Upload" /> Upload Image
                                                    </p>
                                                    <p className="fileHint">JPG, PNG, or GIF, Max 2MB</p>
                                                </div>
                                            </div>

                                            <label htmlFor="fullName" className="label">Full Name:</label>
                                            <input
                                                type="text"
                                                placeholder="Change Name"
                                                className="profileInput"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                            />
                                            <label htmlFor="email" className="label">Email:</label>
                                            <input
                                                type="email"
                                                placeholder="Change Email"
                                                disabled
                                                className="profileInput"
                                                value={email}
                                            />

                                            <div className="buttonContainer">
                                                {/* Delete Account Button */}
                                                <button
                                                    className="button dangerButton"
                                                    onClick={handleDeleteAccount}
                                                >
                                                    {isConfirmDelete ? (
                                                        "Are you sure? Click again to delete."
                                                    ) : (
                                                        <>
                                                            Delete Account{" "}
                                                            <img src="/assets/trash.png" alt="trash" width="20" height="20" />
                                                        </>
                                                    )}
                                                </button>

                                                {/* Save Profile Button */}
                                                <button className="button primaryButton" onClick={handleSaveProfile}>
                                                    Save Profile{" "}
                                                    <img src="/assets/save.png" alt="save" width="20" height="20" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Subscription Details */}
                                    <div className="subscriptionDetails">
                                        <div className="subscriptionHeader">
                                            <h2>Subscription Details</h2>
                                            <button className="manageBillingBtn">Manage Billing Info</button>
                                        </div>
                                        <div className="subscriptionContent">
                                            <div className="detailItem">
                                                <span>Current Plan:</span>
                                                <span className="tag professional">Enterprise</span>
                                            </div>
                                            <div className="detailItem">
                                                <span>Subscription Status:</span>
                                                <span
                                                    className="tag active"
                                                    style={{
                                                        backgroundColor: "rgb(184, 247, 192)",
                                                        color: "black",
                                                    }}
                                                >
                                                    Active
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional Info */}
                                    <div className="infoContainer">
                                        <div className="infoBox">
                                            <h2>
                                                <img
                                                    src="/assets/circle-alert.png"
                                                    alt="info"
                                                    width="24"
                                                    height="24"
                                                />{" "}
                                                How to Change Your Connected Ad Account
                                            </h2>
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
                                                            Email us at support@quickcampaigns.io with the subject line:
                                                            <br />
                                                            <em>“Request To Change Connected Ad Account.”</em>
                                                        </p>
                                                    </li>
                                                    <li>
                                                        <p className="listHeading">Provide Necessary Information</p>
                                                        <ul className="innerList">
                                                            <li>Your Full Name and Email Address Associated With Your Subscription.</li>
                                                            <li>The Name Or ID Of The Currently Connected Ad Account.</li>
                                                            <li>A Request To Disconnect The Current Account And Connect A New One.</li>
                                                        </ul>
                                                    </li>
                                                    <li>
                                                        <p className="listHeading">Wait For Confirmation</p>
                                                        <p>
                                                            Our support team will verify your request and disconnect your current ad account within 1-2 business days. You'll receive an email confirmation when this is complete, and the new account will be linked to your profile.
                                                        </p>
                                                    </li>
                                                </ol>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Pricing Section */}
                                <div id="pricing-section" className="undefined">
                                    <p className="priceHeading">Plans That Scale With Business</p>
                                    <div className="priceCardContainer">
                                        <div className="priceCard popularPlan">
                                            <div>
                                                <p className="priceCardPrice">$129.5/month</p>
                                                <p className="priceCardAccounts">1 Ad Account</p>
                                                <p className="priceCardPlan">Professional Plan</p>
                                                <p className="priceCardPlanDesc">
                                                    Perfect for Individual Advertisers and Small Teams
                                                </p>
                                            </div>
                                            <div className="priceCardFeatureContainer">
                                                <div className="priceCardFeature">
                                                    <svg
                                                        width="24"
                                                        height="24"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                    >
                                                        <rect width="24" height="24" rx="12" fill="#378CE7" fillOpacity="0.7"></rect>
                                                        <path
                                                            fillRule="evenodd"
                                                            clipRule="evenodd"
                                                            d="M17.0964 7.39016L9.93638 14.3002L8.03638 12.2702C7.68638 11.9402 7.13638 11.9202 6.73638 12.2002C6.34638 12.4902 6.23638 13.0002 6.47638 13.4102L8.72638 17.0702C8.94638 17.4102 9.32638 17.6202 9.75638 17.6202C10.1664 17.6202 10.5564 17.4102 10.7764 17.0702C11.1364 16.6002 18.0064 8.41016 18.0064 8.41016C18.9064 7.49016 17.8164 6.68016 17.0964 7.38016V7.39016Z"
                                                            fill="#EEEEEE"
                                                        ></path>
                                                    </svg>
                                                    Upload unlimited ads to 1 ad account.
                                                </div>
                                                <div className="priceCardFeature">
                                                    <svg
                                                        width="24"
                                                        height="24"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                    >
                                                        <rect width="24" height="24" rx="12" fill="#378CE7" fillOpacity="0.7"></rect>
                                                        <path
                                                            fillRule="evenodd"
                                                            clipRule="evenodd"
                                                            d="M17.0964 7.39016L9.93638 14.3002L8.03638 12.2702C7.68638 11.9402 7.13638 11.9202 6.73638 12.2002C6.34638 12.4902 6.23638 13.0002 6.47638 13.4102L8.72638 17.0702C8.94638 17.4102 9.32638 17.6202 9.75638 17.6202C10.1664 17.6202 10.5564 17.4102 10.7764 17.0702C11.1364 16.6002 18.0064 8.41016 18.0064 8.41016C18.9064 7.49016 17.8164 6.68016 17.0964 7.38016V7.39016Z"
                                                            fill="#EEEEEE"
                                                        ></path>
                                                    </svg>
                                                    Perfect for solo marketers and small teams.
                                                </div>
                                                <div className="priceCardFeature">
                                                    <svg
                                                        width="24"
                                                        height="24"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                    >
                                                        <rect width="24" height="24" rx="12" fill="#378CE7" fillOpacity="0.7"></rect>
                                                        <path
                                                            fillRule="evenodd"
                                                            clipRule="evenodd"
                                                            d="M17.0964 7.39016L9.93638 14.3002L8.03638 12.2702C7.68638 11.9402 7.13638 11.9202 6.73638 12.2002C6.34638 12.4902 6.23638 13.0002 6.47638 13.4102L8.72638 17.0702C8.94638 17.4102 9.32638 17.6202 9.75638 17.6202C10.1664 17.6202 10.5564 17.4102 10.7764 17.0702C11.1364 16.6002 18.0064 8.41016 18.0064 8.41016C18.9064 7.49016 17.8164 6.68016 17.0964 7.38016V7.39016Z"
                                                            fill="#EEEEEE"
                                                        ></path>
                                                    </svg>
                                                    Access all features and customization tools.
                                                </div>
                                                <div className="priceCardFeature">
                                                    <svg
                                                        width="24"
                                                        height="24"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                    >
                                                        <rect width="24" height="24" rx="12" fill="#378CE7" fillOpacity="0.7"></rect>
                                                        <path
                                                            fillRule="evenodd"
                                                            clipRule="evenodd"
                                                            d="M17.0964 7.39016L9.93638 14.3002L8.03638 12.2702C7.68638 11.9402 7.13638 11.9202 6.73638 12.2002C6.34638 12.4902 6.23638 13.0002 6.47638 13.4102L8.72638 17.0702C8.94638 17.4102 9.32638 17.6202 9.75638 17.6202C10.1664 17.6202 10.5564 17.4102 10.7764 17.0702C11.1364 16.6002 18.0064 8.41016 18.0064 8.41016C18.9064 7.49016 17.8164 6.68016 17.0964 7.38016V7.39016Z"
                                                            fill="#EEEEEE"
                                                        ></path>
                                                    </svg>
                                                    Receive dedicated support for ad management.
                                                </div>
                                            </div>
                                            <button
                                                className="priceStartBtn"
                                                style={{ backgroundColor: 'rgb(83, 86, 255)', color: 'rgb(255, 255, 255)', border: 'none' }}
                                            >
                                                Downgrade
                                            </button>
                                        </div>
                                        <div className="priceCard popularPlan">
                                            <div>
                                                <p className="priceCardPrice">$99.5/month</p>
                                                <p className="priceCardAccounts"> For up to 2 Ad Accounts, with pricing per account.</p>
                                                <p className="priceCardPlan">Enterprise plan</p>
                                                <p className="priceCardPlanDesc">Ideal for Agencies and Businesses</p>
                                            </div>
                                            <div className="priceCardFeatureContainer">
                                                <div className="priceCardFeature firstFeature">
                                                    <svg
                                                        width="24"
                                                        height="24"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                    >
                                                        <rect width="24" height="24" rx="12" fill="#378CE7" fillOpacity="0.7"></rect>
                                                        <path
                                                            fillRule="evenodd"
                                                            clipRule="evenodd"
                                                            d="M17.0964 7.39016L9.93638 14.3002L8.03638 12.2702C7.68638 11.9402 7.13638 11.9202 6.73638 12.2002C6.34638 12.4902 6.23638 13.0002 6.47638 13.4102L8.72638 17.0702C8.94638 17.4102 9.32638 17.6202 9.75638 17.6202C10.1664 17.6202 10.5564 17.4102 10.7764 17.0702C11.1364 16.6002 18.0064 8.41016 18.0064 8.41016C18.9064 7.49016 17.8164 6.68016 17.0964 7.38016V7.39016Z"
                                                            fill="#EEEEEE"
                                                        ></path>
                                                    </svg>
                                                    Upload unlimited ads to multiple ad accounts.
                                                </div>
                                                <div className="priceCardFeature">
                                                    <svg
                                                        width="24"
                                                        height="24"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                    >
                                                        <rect width="24" height="24" rx="12" fill="#378CE7" fillOpacity="0.7"></rect>
                                                        <path
                                                            fillRule="evenodd"
                                                            clipRule="evenodd"
                                                            d="M17.0964 7.39016L9.93638 14.3002L8.03638 12.2702C7.68638 11.9402 7.13638 11.9202 6.73638 12.2002C6.34638 12.4902 6.23638 13.0002 6.47638 13.4102L8.72638 17.0702C8.94638 17.4102 9.32638 17.6202 9.75638 17.6202C10.1664 17.6202 10.5564 17.4102 10.7764 17.0702C11.1364 16.6002 18.0064 8.41016 18.0064 8.41016C18.9064 7.49016 17.8164 6.68016 17.0964 7.38016V7.39016Z"
                                                            fill="#EEEEEE"
                                                        ></path>
                                                    </svg>
                                                    Perfect for agencies and businesses.
                                                </div>
                                                <div className="priceCardFeature">
                                                    <svg
                                                        width="24"
                                                        height="24"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                    >
                                                        <rect width="24" height="24" rx="12" fill="#378CE7" fillOpacity="0.7"></rect>
                                                        <path
                                                            fillRule="evenodd"
                                                            clipRule="evenodd"
                                                            d="M17.0964 7.39016L9.93638 14.3002L8.03638 12.2702C7.68638 11.9402 7.13638 11.9202 6.73638 12.2002C6.34638 12.4902 6.23638 13.0002 6.47638 13.4102L8.72638 17.0702C8.94638 17.4102 9.32638 17.6202 9.75638 17.6202C10.1664 17.6202 10.5564 17.4102 10.7764 17.0702C11.1364 16.6002 18.0064 8.41016 18.0064 8.41016C18.9064 7.49016 17.8164 6.68016 17.0964 7.38016V7.39016Z"
                                                            fill="#EEEEEE"
                                                        ></path>
                                                    </svg>
                                                    Access all features and customization tools.
                                                </div>
                                                <div className="priceCardFeature">
                                                    <svg
                                                        width="24"
                                                        height="24"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                    >
                                                        <rect width="24" height="24" rx="12" fill="#378CE7" fillOpacity="0.7"></rect>
                                                        <path
                                                            fillRule="evenodd"
                                                            clipRule="evenodd"
                                                            d="M17.0964 7.39016L9.93638 14.3002L8.03638 12.2702C7.68638 11.9402 7.13638 11.9202 6.73638 12.2002C6.34638 12.4902 6.23638 13.0002 6.47638 13.4102L8.72638 17.0702C8.94638 17.4102 9.32638 17.6202 9.75638 17.6202C10.1664 17.6202 10.5564 17.4102 10.7764 17.0702C11.1364 16.6002 18.0064 8.41016 18.0064 8.41016C18.9064 7.49016 17.8164 6.68016 17.0964 7.38016V7.39016Z"
                                                            fill="#EEEEEE"
                                                        ></path>
                                                    </svg>
                                                    Receive dedicated support for ad management.
                                                </div>
                                            </div>
                                            <button
                                                className="priceStartBtn"
                                                style={{ backgroundColor: 'white', color: 'rgb(83, 86, 255)', border: '1px solid rgb(83, 86, 255)' }}
                                            >
                                                Current Plan
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Page;
