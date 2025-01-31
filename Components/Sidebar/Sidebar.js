"use client"
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
const Sidebar = () => {
    const [activeAccount, setActiveAccount] = useState(1);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleAccountClick = (accountNumber) => {
        setActiveAccount(accountNumber);
    };

    return (
        <div id="menu" className="sidebarContainer">
            <div>
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
                    <div className="sectionHeader" onClick={toggleDropdown}>
                        <div className="sectionTitle inputtext">Facebook Setting</div>
                        <Image
                            src="/assets/chevron-down.png"
                            alt="Dropdown Icon"
                            width={20}
                            height={20}
                            className={`dropdownIcon ${isDropdownOpen ? 'rotated' : ''}`}
                        />
                    </div>
                    {isDropdownOpen && (
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
            </div>
            <div>
                {/* Correct usage of Link */}
                <Link href="/pricing" className="linktag upgradeButton">
                    Upgrade Plan
                </Link>
                <div className="footer">10 Ad accounts on enterprise plan</div>
            </div>
        </div>
    );
};

export default Sidebar;
