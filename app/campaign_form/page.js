"use client";
import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "/public/Styles/CampaignForm.module.css";
import Header from "@/Components/Header/Header";
import CampaignFormComp from "@/Components/CampaignFormComp/CampaignFormComp";
import "/public/Styles/side-menu.css";
import "/public/Styles/style.css";
import "/public/Styles/home.css";
import Placement from "@/Components/Placement/Placement";
import TargettingDelivery from "@/Components/TargettingDelivery/TargettingDelivery";
import CampaignTracking from "@/Components/CampaignTracking/CampaignTracking";
import Link from "next/link";
import Image from "next/image";

const CampaignForm = ({
    formId,
    onSubmit,
    initialConfig = {},
    isNewCampaign,
    onGoBack,
    objective,
}) => {
    const [campaignName, setCampaignName] = useState("");
    const [savedConfig, setSavedConfig] = useState(initialConfig);
    const [expandedSections, setExpandedSections] = useState({
        creativeUploading: false,
        budgetSchedule: false,
    });
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [isCBO, setIsCBO] = useState(true);
    const [config, setConfig] = useState(initialConfig);
    const [isHydrated, setIsHydrated] = useState(false); // Added for hydration check

    const fileInputRef = useRef(null);

    // This effect ensures that client-specific code only runs after hydration
    useEffect(() => {
        setIsHydrated(true);
        if (!isNewCampaign && initialConfig.campaignId) {
            setCampaignName(initialConfig.campaignName || "");
        }
    }, [initialConfig, isNewCampaign]);

    const toggleSection = (section) => {
        setExpandedSections((prevState) => ({
            ...prevState,
            [section]: !prevState[section],
        }));
    };

    const handleSaveConfig = () => {
        toast.success("Configuration saved locally!");
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        if (uploadedFiles.length === 0) {
            toast.error("Please upload your creatives.");
            if (fileInputRef.current) {
                window.scrollBy({ top: -2900, left: 0, behavior: "smooth" });
            } else {
                toggleSection("creativeUploading");
            }
            return;
        }

        const formData = new FormData(event.target);

        if (isNewCampaign) {
            formData.append("campaign_name", campaignName);
        }

        // Add savedConfig data to form submission
        for (const [key, value] of Object.entries(savedConfig)) {
            if (typeof value === "object") {
                formData.append(key, JSON.stringify(value));
            } else {
                formData.append(key, value);
            }
        }

        onSubmit(formData, isNewCampaign);
    };

    const handleFileUploadClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click(); // Trigger the file input click
        }
    };

    const handleFileChange = (event) => {
        const files = Array.from(event.target.files);
        setUploadedFiles(files);
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setConfig((prevConfig) => ({
            ...prevConfig,
            [name]: value,
        }));
    };

    // Hydration safety check: Render only after the client is hydrated
    if (!isHydrated) {
        return null; // Or a loading spinner/placeholder
    }

    return (
        <div className="forclr">
            <Header />
            <div className={styles.formContainer}>
                <div className={styles.header}>
                    <Link href="/main">
                        <Image
                            src="/assets/Vector4.png"
                            alt="Go Back"
                            className={styles.goBackIcon}
                            width={25}
                            height={33}
                            onClick={onGoBack}
                            style={{ cursor: "pointer" }}
                        />
                    </Link>
                </div>
                <h2 className={styles.title}>Choose Your Launch Setting</h2>
                <p className={styles.subtitle}>
                    Fill In The Required Fields To Generate And Launch Your Meta Ads
                </p>

                <div className={styles.tutorialVideo}>
                    <p>Tutorial video here</p>
                </div>

                <form id={formId} onSubmit={handleSubmit} encType="multipart/form-data">
                    <div className={styles.formSectionsContainer}>
                        {/* Creative Uploading Section */}
                        <div className={styles.sectionBox}>
                            <div
                                className={styles.sectionHeader}
                                onClick={() => toggleSection("creativeUploading")}
                            >
                                <h3>
                                    Creative Uploading{" "}
                                    {uploadedFiles.length > 0 &&
                                        `(${uploadedFiles.length} files uploaded)`}
                                </h3>
                                <Image
                                    src="/assets/Vectorw.svg"
                                    alt="Toggle Section"
                                    className={`${styles.toggleIcon} ${expandedSections["creativeUploading"] ? styles.expanded : ""}`}
                                    width={30}
                                    height={30}
                                />
                            </div>
                            {expandedSections["creativeUploading"] && (
                                <div className={styles.sectionContent}>
                                    <div
                                        className={styles.uploadBox}
                                        onClick={handleFileUploadClick}
                                    >
                                        <Image
                                            src="/assets/Vector6.png"
                                            alt="Upload Icon"
                                            className={styles.uploadIcon}
                                            width={40}
                                            height={40}
                                        />
                                        <p>Click to upload or drag and drop</p>
                                    </div>
                                    <input
                                        type="file"
                                        id="uploadFolders"
                                        name="uploadFolders"
                                        webkitdirectory="true"
                                        directory="true"
                                        multiple
                                        className={styles.hiddenFileInput}
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                    />
                                </div>
                            )}
                        </div>
                        <hr className={styles.sectionDivider} />

                        {/* Budget & Schedule Section */}
                        <div className={styles.sectionBox}>
                            <div
                                className={styles.sectionHeader}
                                onClick={() => toggleSection("budgetSchedule")}
                            >
                                <h3>Budget & Schedule</h3>
                                <Image
                                    src="/assets/Vectorw.svg"
                                    alt="Toggle Section"
                                    className={`${styles.toggleIcon} ${expandedSections["budgetSchedule"] ? styles.expanded : ""}`}
                                    width={30}
                                    height={30}
                                />
                            </div>
                            {expandedSections["budgetSchedule"] && (
                                <div className={styles.sectionContent}>
                                    <div className={styles.budgetOptimizationToggle}>
                                        <button
                                            type="button"
                                            className={`${styles.toggleButton} ${!isCBO ? styles.active : ""}`}
                                            onClick={() => setIsCBO(false)}
                                        >
                                            ABO
                                        </button>
                                        <button
                                            type="button"
                                            className={`${styles.toggleButton} ${isCBO ? styles.active : ""}`}
                                            onClick={() => setIsCBO(true)}
                                        >
                                            CBO
                                        </button>
                                        <span className={styles.optimizationLabel}>BUDGET OPTIMIZATION</span>
                                    </div>

                                    {isCBO ? (
                                        <>
                                            <div className={styles.column}>
                                                <label
                                                    className={styles.labelText}
                                                    htmlFor="campaign_budget_optimization"
                                                >
                                                    Campaign Budget Optimization:
                                                </label>
                                                <select
                                                    id="campaign_budget_optimization"
                                                    name="campaign_budget_optimization"
                                                    value={config.campaign_budget_optimization}
                                                    onChange={handleChange}
                                                    className={styles.selectField}
                                                >
                                                    <option value="DAILY_BUDGET">Daily Budget</option>
                                                    <option value="LIFETIME_BUDGET">Lifetime Budget</option>
                                                </select>
                                            </div>
                                            <div className={styles.column}>
                                                <label
                                                    className={styles.labelText}
                                                    htmlFor="campaign_budget_value"
                                                >
                                                    Campaign Budget Value:
                                                </label>
                                                <input
                                                    type="number"
                                                    id="campaign_budget_value"
                                                    name="campaign_budget_value"
                                                    value={config.campaign_budget_value}
                                                    onChange={handleChange}
                                                    className={styles.inputField}
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className={styles.column}>
                                                <label
                                                    className={styles.labelText}
                                                    htmlFor="ad_set_budget_optimization"
                                                >
                                                    Ad Set Budget Optimization:
                                                </label>
                                                <select
                                                    id="ad_set_budget_optimization"
                                                    name="ad_set_budget_optimization"
                                                    value={config.ad_set_budget_optimization}
                                                    onChange={handleChange}
                                                    className={styles.selectField}
                                                >
                                                    <option value="DAILY_BUDGET">Daily Budget</option>
                                                    <option value="LIFETIME_BUDGET">Lifetime Budget</option>
                                                </select>
                                            </div>
                                            <div className={styles.column}>
                                                <label
                                                    className={styles.labelText}
                                                    htmlFor="ad_set_budget_value"
                                                >
                                                    Ad Set Budget Value:
                                                </label>
                                                <input
                                                    type="number"
                                                    id="ad_set_budget_value"
                                                    name="ad_set_budget_value"
                                                    value={config.ad_set_budget_value}
                                                    onChange={handleChange}
                                                    className={styles.inputField}
                                                />
                                            </div>
                                        </>
                                    )}
                                    <div className={styles.column}>
                                        <label className={styles.labelText} htmlFor="buying_type">
                                            Buying Type:
                                        </label>
                                        <select
                                            id="buying_type"
                                            name="buying_type"
                                            value={config.buying_type}
                                            onChange={handleChange}
                                            className={styles.selectField}
                                        >
                                            <option value="AUCTION">Auction</option>
                                            <option value="FIXED_PRICE">Fixed Price</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Placement Section */}
                        <Placement />
                        {/* Targeting & Delivery Section */}
                        <TargettingDelivery />
                        {/* Campaign Tracking Section */}
                        <CampaignTracking />
                    </div>

                    <div className={styles.saveButtonContainer}>
                        <button
                            type="button"
                            className={styles.saveButton}
                            onClick={handleSaveConfig}
                        >
                            Save Campaign Configuration
                        </button>
                    </div>

                    <div className={styles.submitButtonContainer}>
                        <button type="submit" className={styles.submitButton}>
                            Submit Campaign
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Prop validation
CampaignForm.propTypes = {
    formId: PropTypes.string.isRequired,
    onSubmit: PropTypes.func.isRequired,
    initialConfig: PropTypes.object,
    isNewCampaign: PropTypes.bool.isRequired,
    onGoBack: PropTypes.func.isRequired,
    objective: PropTypes.string.isRequired,
};

export default CampaignForm;
