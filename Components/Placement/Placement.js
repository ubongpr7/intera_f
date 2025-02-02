"use client"; // Required for client-side interactivity in Next.js
import React, { useState } from "react";
import styles from "./CampaignForm.module.css"; // Import CSS module
import Select from "react-select"; // For multi-select dropdowns
import { FormControlLabel, Checkbox } from "@mui/material"; // Import MUI components

const Placement = () => {
  // State for toggling sections
  const [expandedSections, setExpandedSections] = useState({
    budgetSchedule: true,
    assets: true,
    placements: true,
    targetingDelivery: true,
    campaignTracking: true,
  });

  // State for form configuration
  const [config, setConfig] = useState({
    placement_type: "advantage_plus", // Default placement type
    platforms: {
      facebook: true,
      instagram: true,
      audience_network: true,
    },
    placements: {
      // Facebook Placements
      feeds: true,
      profile_feed: true,
      marketplace: true,
      video_feeds: true,
      right_column: true,
      stories: true,
      reels: true,
      in_stream: true,
      search: true,
      facebook_reels: true,

      // Instagram Placements
      instagram_feeds: true,
      instagram_profile_feed: true,
      explore: true,
      explore_home: true,
      instagram_stories: true,
      instagram_reels: true,
      instagram_search: true,

      // Audience Network Placements
      native_banner_interstitial: true,
      rewarded_videos: true,
    },
  });

  // Toggle section visibility
  const toggleSection = (section) => {
    setExpandedSections((prevState) => ({
      ...prevState,
      [section]: !prevState[section],
    }));
  };

  // Handle placement type change (Advantage+ or Manual)
  const handlePlacementTypeChange = (e) => {
    const { value } = e.target;
    setConfig((prevConfig) => ({
      ...prevConfig,
      placement_type: value,
    }));
  };

  // Handle platform checkbox changes
  const handlePlatformChange = (e) => {
    const { name, checked } = e.target;
    setConfig((prevConfig) => ({
      ...prevConfig,
      platforms: {
        ...prevConfig.platforms,
        [name]: checked,
      },
    }));
  };

  // Handle placement checkbox changes
  const handlePlacementChange = (e) => {
    const { name, checked } = e.target;
    setConfig((prevConfig) => ({
      ...prevConfig,
      placements: {
        ...prevConfig.placements,
        [name]: checked,
      },
    }));
  };

  return (
    <div className={styles.formContainer}>
      {/* Placements Section */}
      <div className={styles.sectionBox}>
        <div
          className={styles.sectionHeader}
          onClick={() => toggleSection("placements")}
        >
          <h3>Placements</h3>
          <img
            src="/assets/Vectorw.svg"
            alt="Toggle Section"
            className={`${styles.toggleIcon} ${
              expandedSections["placements"] ? styles.expanded : ""
            }`}
          />
        </div>
        {expandedSections["placements"] && (
          <div className={styles.sectionContent}>
            {/* Placement Type Toggle (Advantage+ or Manual) */}
            <div className={styles.placementToggle}>
              <button
                type="button"
                className={`${styles.toggleButton} ${
                  config.placement_type === "advantage_plus" ? styles.active : ""
                }`}
                onClick={() =>
                  handlePlacementTypeChange({ target: { value: "advantage_plus" } })
                }
              >
                On
              </button>
              <button
                type="button"
                className={`${styles.toggleButton} ${styles.lastButton} ${
                  config.placement_type === "Manual" ? styles.active : ""
                }`}
                onClick={() =>
                  handlePlacementTypeChange({ target: { value: "Manual" } })
                }
              >
                Off
              </button>
              <span className={styles.optimizationLabel}>
                ADVANTAGE+ PLACEMENTS
              </span>
            </div>

            {/* Platform Checkboxes */}
            <div
              className={`${styles.platformContainer} ${
                config.placement_type === "advantage_plus" ? styles.disabled : ""
              }`}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={config.platforms.facebook}
                    onChange={handlePlatformChange}
                    name="facebook"
                    sx={{
                      "&.Mui-checked": {
                        "& .MuiSvgIcon-root": {
                          color: "#5356FF",
                        },
                      },
                    }}
                  />
                }
                label="Facebook"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={config.platforms.instagram}
                    onChange={handlePlatformChange}
                    name="instagram"
                    sx={{
                      "&.Mui-checked": {
                        "& .MuiSvgIcon-root": {
                          color: "#5356FF",
                        },
                      },
                    }}
                  />
                }
                label="Instagram"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={config.platforms.audience_network}
                    onChange={handlePlatformChange}
                    name="audience_network"
                    sx={{
                      "&.Mui-checked": {
                        "& .MuiSvgIcon-root": {
                          color: "#5356FF",
                        },
                      },
                    }}
                  />
                }
                label="Audience Network"
              />
            </div>

            <hr className={styles.sectionDivider2} />

            {/* Facebook Placements */}
            <div
              className={`${styles.manualOptions} ${
                config.placement_type === "advantage_plus" ? styles.disabled : ""
              }`}
            >
              {Object.entries(config.placements)
                .filter(([key]) => key.startsWith("facebook") || key === "feeds")
                .map(([key, value]) => (
                  <FormControlLabel
                    key={key}
                    control={
                      <Checkbox
                        checked={value}
                        onChange={handlePlacementChange}
                        name={key}
                        sx={{
                          "&.Mui-checked": {
                            "& .MuiSvgIcon-root": {
                              color: "#5356FF",
                            },
                          },
                        }}
                      />
                    }
                    label={key.replace(/_/g, " ").toUpperCase()}
                  />
                ))}
            </div>

            <hr className={styles.sectionDivider2} />

            {/* Instagram Placements */}
            <div
              className={`${styles.manualOptions} ${
                config.placement_type === "advantage_plus" ? styles.disabled : ""
              }`}
            >
              {Object.entries(config.placements)
                .filter(([key]) => key.startsWith("instagram"))
                .map(([key, value]) => (
                  <FormControlLabel
                    key={key}
                    control={
                      <Checkbox
                        checked={value}
                        onChange={handlePlacementChange}
                        name={key}
                        sx={{
                          "&.Mui-checked": {
                            "& .MuiSvgIcon-root": {
                              color: "#5356FF",
                            },
                          },
                        }}
                      />
                    }
                    label={key.replace(/_/g, " ").toUpperCase()}
                  />
                ))}
            </div>

            <hr className={styles.sectionDivider2} />

            {/* Audience Network Placements */}
            <div
              className={`${styles.manualOptions} ${
                config.placement_type === "advantage_plus" ? styles.disabled : ""
              }`}
            >
              {Object.entries(config.placements)
                .filter(([key]) => key.startsWith("native") || key.startsWith("rewarded"))
                .map(([key, value]) => (
                  <FormControlLabel
                    key={key}
                    control={
                      <Checkbox
                        checked={value}
                        onChange={handlePlacementChange}
                        name={key}
                        sx={{
                          "&.Mui-checked": {
                            "& .MuiSvgIcon-root": {
                              color: "#5356FF",
                            },
                          },
                        }}
                      />
                    }
                    label={key.replace(/_/g, " ").toUpperCase()}
                  />
                ))}
            </div>
          </div>
        )}
        <hr className={styles.sectionDivider} />
      </div>
    </div>
  );
};

export default Placement;