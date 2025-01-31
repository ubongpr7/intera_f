"use client";
import React, { useState, useEffect } from "react";
import "/public/Styles/side-menu.css";
import "/public/Styles/style.css";
import "/public/Styles/home.css";
// import "/public/Styles/font.css";

import Header from "@/Components/Header/Header";
import Sidebar from "@/Components/Sidebar/Sidebar";

const Page = () => {
  const [selectedObjective, setSelectedObjective] = useState("Website Conversions");
  const [selectedCampaign, setSelectedCampaign] = useState("new");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownOption, setDropdownOption] = useState("Select Options");

  const campaignOptions = [
    "findproccesserror",
    "LIVE APP",
    "instagram screencast",
    "14 jan test 2",
    "cozybondz____",
    "Test(Newton)",
    "14 january - test with newton",
  ];

  const handleObjectiveClick = (objective) => {
    setSelectedObjective(objective);
  };

  const handleCampaignClick = (campaign) => {
    setSelectedCampaign(campaign);
    setDropdownVisible(campaign === "existing"); // Only show dropdown for "existing"
  };

  const handleOptionSelect = (option) => {
    setDropdownOption(option); // Set selected option
    setDropdownVisible(false); // Hide dropdown after selection
  };

  // Toggle dropdown visibility
  const toggleDropdown = (e) => {
    e.stopPropagation(); // Prevents click-outside from closing it
    setDropdownVisible((prev) => !prev); // Toggle visibility state
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!document.querySelector(".dropdownContainer")?.contains(e.target)) {
        setDropdownVisible(false); // Close dropdown if clicked outside
      }
    };

    if (dropdownVisible) {
      document.addEventListener("click", handleClickOutside);
    } else {
      document.removeEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [dropdownVisible]);

  return (
    <div className="forclr">
        <Sidebar />
          <Header />
      <div className="main-container">
        <div className="main-content" id="content">
          <main>
            <div className="content">
              <div className="form-container">
                <h2 className="form-heading">Choose Campaign Objective</h2>
                <div className="objectiveContainer">
                  {[
                    {
                      title: "Website Conversions",
                      description:
                        "Send people to your website and track conversions using the FB Pixel.",
                      imgSrc: "/assets/Website-Ad--Streamline-Atlas.png",
                    },
                    {
                      title: "Lead Form Campaign",
                      description:
                        "Capture leads using instant forms from your ad account.",
                      imgSrc: "/assets/Device-Tablet-Search--Streamline-Tabler.png",
                    },
                    {
                      title: "Traffic Campaign",
                      description:
                        "Drive more visitors to your website through targeted traffic campaigns.",
                      imgSrc: "/assets/Click--Streamline-Tabler.png",
                    },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className={`objective ${
                        selectedObjective === item.title ? "objective-select" : ""
                      }`}
                      onClick={() => handleObjectiveClick(item.title)}
                    >
                      <div className="objective-icon">
                        <img src={item.imgSrc} alt={item.title} />
                      </div>
                      <div className="content">
                        <h3>{item.title}</h3>
                        <p>{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <h2 className="heading">Configure Your Campaign</h2>
                <div className="campaignTypeContainer">
                  <button
                    className={`campaignTypeButton ${
                      selectedCampaign === "new" ? "campaignSelect" : ""
                    }`}
                    onClick={() => handleCampaignClick("new")}
                  >
                    <img src="/assets/Component 2.png" alt="New Campaign" />
                    New Campaign
                  </button>
                  <button
                    className={`campaignTypeButton ${
                      selectedCampaign === "existing" ? "campaignSelect" : ""
                    }`}
                    onClick={() => handleCampaignClick("existing")}
                  >
                    <img src="/assets/Component 2 (1).png" alt="Existing Campaign" />
                    Existing Campaign
                  </button>
                </div>

                {/* Dropdown for Existing Campaign */}
                {selectedCampaign === "existing" && (
                  <div className="dropdownContainer">
                    <div className="dropdownHeader" onClick={toggleDropdown}>
                      {dropdownOption} {/* Displays the currently selected option */}
                    </div>
                    {dropdownVisible && (
                      <div className="dropdownList">
                        {campaignOptions.map((option, index) => (
                          <div
                            key={index}
                            className="dropdownItem"
                            onClick={() => handleOptionSelect(option)}
                          >
                            {option}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <button
                  className="nextButton"
                  onClick={() => (window.location.href = "CampaignForm.html")}
                >
                  Next
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Page;
