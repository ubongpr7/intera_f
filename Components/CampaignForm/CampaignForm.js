"use client"
import React, { useState } from "react";
import Image from "next/image";

const CampaignForm = () => {
    const [selectedObjective, setSelectedObjective] = useState(null);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [dropdownVisible, setDropdownVisible] = useState(false);

    const handleObjectiveClick = (objective) => {
        setSelectedObjective(objective);
    };

    const handleCampaignClick = (campaignType) => {
        setSelectedCampaign(campaignType);
        setDropdownVisible(campaignType === "existingCampaign");
    };

    const handleDropdownToggle = () => {
        setDropdownVisible(!dropdownVisible);
    };

    return (
        <main>
            <div className="content">
                <div className="form-container">
                    <h2 className="form-heading">Choose Campaign Objective</h2>
                    <div className="objectiveContainer">
                        {["Website Conversions", "Lead Form Campaign", "Traffic Campaign"].map((objective, index) => (
                            <div
                                key={index}
                                className={`objective ${selectedObjective === objective ? "objective-select" : ""}`}
                                onClick={() => handleObjectiveClick(objective)}
                            >
                                <div className="objective-icon">
                                    <Image src={`/assets/Website-Ad--Streamline-Atlas.png`} alt={objective} width={40} height={40} />
                                </div>
                                <div className="content">
                                    <h3>{objective}</h3>
                                    <p>{`${objective} description goes here`}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <h2 className="heading">Configure Your Campaign</h2>
                    <div className="campaignTypeContainer">
                        <button className={`campaignTypeButton ${selectedCampaign === "newCampaign" ? "campaignSelect" : ""}`}
                                onClick={() => handleCampaignClick("newCampaign")}>
                            <Image src="/assets/Component 2.png" alt="New Campaign" width={40} height={40} />
                            New Campaign
                        </button>
                        <button className={`campaignTypeButton ${selectedCampaign === "existingCampaign" ? "campaignSelect" : ""}`}
                                onClick={() => handleCampaignClick("existingCampaign")}>
                            <Image src="/assets/Component 2 (1).png" alt="Existing Campaign" width={40} height={40} />
                            Existing Campaign
                        </button>
                    </div>
                    {dropdownVisible && (
                        <div className="dropdownContainer">
                            <div className="dropdownHeader" onClick={handleDropdownToggle}>Select Options</div>
                            <div className="dropdownList">
                                {["findproccesserror", "LIVE APP", "instagram screencast"].map((option, index) => (
                                    <div key={index} className="dropdownItem" onClick={() => console.log(option)}>
                                        <span>{option}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <button className="nextButton" onClick={() => window.location.href = 'CampaignForm.html'}>Next</button>
                </div>
            </div>
        </main>
    );
};

export default CampaignForm;
