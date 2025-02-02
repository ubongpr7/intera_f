"use client"
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import "/public/Styles/side-menu.css";

const SidebarWithHeader = () => {
    const [activeAccount, setActiveAccount] = useState(1);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [facebookDropdownOpen, setFacebookDropdownOpen] = useState(false);

    const sidebarRef = useRef(null);
    const menuBtnRef = useRef(null);
    
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const toggleProfileDropdown = () => {
        // Close the Facebook settings dropdown when the profile dropdown is opened
        setFacebookDropdownOpen(false);
        setProfileDropdownOpen(!profileDropdownOpen);
    };

    const toggleFacebookDropdown = () => {
        // Close the profile dropdown when the Facebook settings dropdown is opened
        setProfileDropdownOpen(false);
        setFacebookDropdownOpen(!facebookDropdownOpen);
    };

    const handleAccountClick = (accountNumber) => {
        setActiveAccount(accountNumber);
    };

    const closeSidebarOnClickOutside = (e) => {
        if (sidebarRef.current && !sidebarRef.current.contains(e.target) && !menuBtnRef.current.contains(e.target)) {
            setIsSidebarOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener("click", closeSidebarOnClickOutside);
        return () => {
            document.removeEventListener("click", closeSidebarOnClickOutside);
        };
    }, []);

    return (
        <div>
            {/* Header with Menu Button */}
            <header className="header">
                <nav className="nav">
                    <div className="menu" id="menuBtn" ref={menuBtnRef} onClick={toggleSidebar}>
                        <Image src="/assets/Vector2.png" alt="menu" width={20} height={20} />
                    </div>
                    <div className="profile" onClick={toggleProfileDropdown}>
                        <Image src="/assets/no-profile-picture-15257.svg" alt="Profile" width={40} height={40} id="profile" />
                        <div className={`dropdown-menu ${profileDropdownOpen ? 'open' : ''}`}>
                            <div className="dropdown-item1">Active Ad Accounts: 10</div>
                            <Link href="/profile_module" className="linktag">
                                <div className="dropdown-item">Manage Subscription</div>
                            </Link>
                            <Link href="/" className="linktag">
                                <div className="dropdown-item">Log Out</div>
                            </Link>
                        </div>
                    </div>
                </nav>
            </header>

            {/* Sidebar */}
            <div id="menu" className={`sidebarContainer ${isSidebarOpen ? 'open' : ''}`} ref={sidebarRef}>
                <div>
                    <Link href="/main">
                        <img src="/assets/logo-footer.png" alt="Logo" className="logoImage" />
                    </Link>
                </div>
                <hr className="horizontalRule" />
                <div className="accountsContainer">
                    {[...Array(10)].map((_, index) => (
                        <button
                            key={index}
                            className={`accountButton ${activeAccount === index + 1 ? 'accountActive' : ''}`}
                            onClick={() => handleAccountClick(index + 1)}
                            aria-label={`Switch to Ad Account ${index + 1}`}
                        >
                            <Image src="/assets/user-round.png" alt="User Icon" width={20} height={20} className="icon" />
                            {`Ad Account ${index + 1}`}
                        </button>
                    ))}
                </div>
                <hr className="horizontalRule" />
                <button className="accountButton2" aria-label="Create New Ad Account">
                    Add New Ad Account
                </button>
                <div className="dropdownSection">
                    <div className="sectionHeader" onClick={toggleFacebookDropdown}>
                        <div className="sectionTitle inputtext">Facebook Setting</div>
                        <Image
                            src="/assets/chevron-down.png"
                            alt="Dropdown Icon"
                            width={20}
                            height={20}
                            className={`dropdownIcon ${facebookDropdownOpen ? 'rotated' : ''}`}
                        />
                    </div>
                    {facebookDropdownOpen && (
                        <div className="dropdownContent">
                            <div>
                                <div className="inlineContainer">
                                    <span className="input input1 lab">Ad Account - </span>
                                    <input className="input input1" placeholder="Ad Account ID" readOnly value="QuickCampaigns.io" />
                                </div>
                                <hr className="horizontalRule1" />
                            </div>
                        </div>
                    )}
                </div>
                <div className="formargin">
                    <Link href="/pricing" className="linktag upgradeButton">
                        Upgrade Plan
                    </Link>
                    <div className="footer">10 Ad accounts on enterprise plan</div>
                </div>
            </div>
        </div>
    );
};

export default SidebarWithHeader;
