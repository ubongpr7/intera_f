"use client"
import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import ConfigForm from "./ConfigForm";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "../Forms/CampaignForm.module.css";

const CampaignForm = ({
  formId,
  onSubmit,
  initialConfig = {},
  isNewCampaign,
  onGoBack,
  activeAccount,
  campaignId: initialCampaignId,
  objective,
}) => {
  const [campaignName, setCampaignName] = useState("");
  const [campaignId, setCampaignId] = useState(initialCampaignId || "");
  const [savedConfig, setSavedConfig] = useState(initialConfig);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Ref for file input
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isNewCampaign && initialCampaignId) {
      setCampaignId(initialCampaignId);
    }
  }, [initialCampaignId, isNewCampaign]);

  const handleSaveConfig = async () => {
    try {
      // Placeholder logic for saving configuration
      toast.success("Configuration saved successfully!");
    } catch (error) {
      toast.error("Failed to save configuration.");
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    // Ensure file input exists before scrolling into view
    if (uploadedFiles.length === 0) {
      toast.error("Please Upload Your Creatives.");

      // Scroll to the file input if no file is uploaded
      if (fileInputRef.current) {
        window.scrollBy({ top: -2900, left: 0, behavior: 'smooth' });
      }
      return;
    }

    const formData = new FormData(event.target);

    if (isNewCampaign) {
      formData.append("campaign_name", campaignName);
    } else {
      formData.append("campaign_id", campaignId); // No need for user input, it's set from Main
    }

    formData.append("objective", objective); // Append the objective

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

  return (
    <div className={styles.formContainer}>
      <div className={styles.header}>
        <img
          src="/assets/Vector4.png"
          alt="Go Back"
          className={styles.goBackIcon}
          onClick={onGoBack}
        />
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
            >
              <h3>
                Creative Uploading{" "}
                {uploadedFiles.length > 0 &&
                  `(${uploadedFiles.length} files uploaded)`}
              </h3>
            </div>
            <div className={styles.sectionContent}>
              <div
                className={styles.uploadBox}
                onClick={handleFileUploadClick}
              >
                <img
                  src="/assets/Vector6.png"
                  alt="Upload Icon"
                  className={styles.uploadIcon}
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
                ref={fileInputRef} // Attach ref here
                onChange={handleFileChange} // Handle file changes
              />
            </div>
          </div>
          <hr className={styles.sectionDivider} />

          <ConfigForm
            initialConfig={initialConfig}
            isNewCampaign={isNewCampaign}
            onSaveConfig={setSavedConfig}
            activeAccount={activeAccount}
            campaignName={campaignName} // Pass campaignName down
            setCampaignName={setCampaignName} // Pass setCampaignName down
            objective={objective}  // Pass the objective here
            campaignId={campaignId}
          />
        </div>

        {/* Button container outside the formSectionsContainer */}
        <div className={styles.buttonContainer}>
          <button type="submit" className={styles.createAdButton}>
            {isNewCampaign ? "Create Campaign" : "Create Ad Set"}
          </button>
          <button
            type="button"
            className={styles.goBackButton}
            onClick={onGoBack}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveConfig}
            className={styles.createAdButton}
          >
            Save Current Settings
          </button>
        </div>
      </form>
    </div>
  );
};

CampaignForm.propTypes = {
  formId: PropTypes.string.isRequired,
  onSubmit: PropTypes.func.isRequired,
  initialConfig: PropTypes.object,
  isNewCampaign: PropTypes.bool.isRequired,
  onGoBack: PropTypes.func.isRequired,
  activeAccount: PropTypes.object.isRequired,
  campaignId: PropTypes.string,
  objective: PropTypes.string.isRequired, // Include objective as a required prop
};

export default CampaignForm;
