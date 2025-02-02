"use client"; // Required for client-side interactivity in Next.js
import React, { useState } from "react";
import styles from "./CampaignForm.module.css"; // Import CSS module
import Select from "react-select"; // For multi-select dropdowns
import Slider from "@mui/material/Slider"; // Import MUI Slider
import Sidebar from "@/Components/Sidebar/Sidebar";

const TargettingDelivery = () => {
    <Sidebar/>
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
    targeting_type: "Advantage", // Default targeting type
    custom_audiences: [], // Custom audiences for targeting
    interests: [], // Targeting interests
    location: [], // Selected countries
    gender: "All", // Gender targeting
    age_range: [18, 65], // Age range
    attribution_setting: "7d_click", // Attribution setting
  });

  // State for multi-select dropdowns
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);

  // Mock data for dropdowns
  const customAudiences = [
    { id: 1, name: "Audience 1" },
    { id: 2, name: "Audience 2" },
  ];

  const interests = [
    { value: "interest1", label: "Interest 1" },
    { value: "interest2", label: "Interest 2" },
  ];

  const countries = [
    { value: "US", label: "United States" },
    { value: "UK", label: "United Kingdom" },
  ];

  const attributionSettings = [
    { value: "1d_click", label: "1-day click" },
    { value: "7d_click", label: "7-day click" },
    { value: "1d_view", label: "1-day view" },
    { value: "7d_view", label: "7-day view" },
  ];

  // Toggle section visibility
  const toggleSection = (section) => {
    setExpandedSections((prevState) => ({
      ...prevState,
      [section]: !prevState[section],
    }));
  };

  // Handle custom audience selection
  const handleCustomAudienceChange = (selectedOptions) => {
    setConfig((prevConfig) => ({
      ...prevConfig,
      custom_audiences: selectedOptions,
    }));
  };

  // Handle interest search and selection
  const handleInterestSearchChange = (inputValue) => {
    // Implement search logic here (e.g., filter interests based on inputValue)
    console.log("Search query:", inputValue);
  };

  const handleInterestChange = (selectedOptions) => {
    setSelectedInterests(selectedOptions);
    setConfig((prevConfig) => ({
      ...prevConfig,
      interests: selectedOptions,
    }));
  };

  // Handle country selection
  const handleCountryChange = (selectedOptions) => {
    setSelectedCountries(selectedOptions);
    setConfig((prevConfig) => ({
      ...prevConfig,
      location: selectedOptions,
    }));
  };

  // Handle age range slider change
  const handleSliderChange = (event, newValue) => {
    setConfig((prevConfig) => ({
      ...prevConfig,
      age_range: newValue,
    }));
  };

  // Handle attribution setting change
  const handleAttributionChange = (e) => {
    const { value } = e.target;
    setConfig((prevConfig) => ({
      ...prevConfig,
      attribution_setting: value,
    }));
  };

  return (
    <div className={styles.formContainer}>
      {/* Targeting & Delivery Section */}
      <div className={styles.sectionBox}>
        <div
          className={styles.sectionHeader}
          onClick={() => toggleSection("targetingDelivery")}
        >
          <h3>Targeting & Delivery</h3>
          <img
            src="/assets/Vectorw.svg"
            alt="Toggle Section"
            className={`${styles.toggleIcon} ${
              expandedSections["targetingDelivery"] ? styles.expanded : ""
            }`}
          />
        </div>
        {expandedSections["targetingDelivery"] && (
          <div className={styles.sectionContent}>
            {/* Targeting Type Toggle (Advantage+ or Manual) */}
            <div className={styles.budgetOptimizationToggle}>
              <button
                type="button"
                className={`${styles.toggleButton} ${
                  config.targeting_type === "Advantage" ? styles.active : ""
                }`}
                onClick={() =>
                  setConfig((prevConfig) => ({
                    ...prevConfig,
                    targeting_type: "Advantage",
                  }))
                }
              >
                On
              </button>
              <button
                type="button"
                className={`${styles.toggleButton} ${styles.lastButton} ${
                  config.targeting_type === "Manual" ? styles.active : ""
                }`}
                onClick={() =>
                  setConfig((prevConfig) => ({
                    ...prevConfig,
                    targeting_type: "Manual",
                  }))
                }
              >
                Off
              </button>
              <span className={styles.optimizationLabel}>
                ADVANTAGE+ AUDIENCE
              </span>
            </div>

            {/* Custom Audiences Dropdown */}
            <div
              className={`${styles.column} ${
                config.targeting_type === "Advantage" ? styles.blurredField : ""
              }`}
            >
              <label htmlFor="custom_audiences" className={styles.labelText}>
                Custom Audiences:
              </label>
              <Select
                id="custom_audiences"
                isMulti
                options={customAudiences.map((audience) => ({
                  label: audience.name,
                  value: audience.id,
                }))}
                value={config.custom_audiences}
                onChange={handleCustomAudienceChange}
                placeholder="Select custom audiences"
                className={styles.selectField}
                classNamePrefix="custom-select"
              />
            </div>

            {/* Targeting Interests Dropdown */}
            <div
              className={`${styles.column} ${
                config.targeting_type === "Advantage" ? styles.blurredField : ""
              }`}
            >
              <label htmlFor="targeting_interests" className={styles.labelText}>
                Targeting Interests:
              </label>
              <Select
                id="targeting_interests"
                isMulti
                options={interests}
                value={selectedInterests}
                onChange={handleInterestChange}
                onInputChange={handleInterestSearchChange}
                placeholder="Search interests..."
                className={styles.selectField}
                classNamePrefix="custom-select"
              />
            </div>

            {/* Locations Dropdown */}
            <div className={styles.column}>
              <label htmlFor="location" className={styles.labelText}>
                Locations:
              </label>
              <Select
                id="location"
                isMulti
                options={countries}
                value={selectedCountries}
                onChange={handleCountryChange}
                placeholder="Select countries"
                className={styles.selectField}
                classNamePrefix="custom-select"
              />
            </div>

            {/* Gender Dropdown */}
            <div
              className={`${styles.column} ${
                config.targeting_type === "Advantage" ? styles.blurredField : ""
              }`}
            >
              <label htmlFor="gender" className={styles.labelText}>
                Gender:
              </label>
              <select
                id="gender"
                name="gender"
                value={config.gender}
                onChange={(e) =>
                  setConfig((prevConfig) => ({
                    ...prevConfig,
                    gender: e.target.value,
                  }))
                }
                className={styles.selectField}
              >
                <option value="All">All</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            {/* Age Range Slider */}
            <div
              className={`${styles.column} ${
                config.targeting_type === "Advantage" ? styles.blurredField : ""
              }`}
            >
              <label htmlFor="age_range" className={styles.labelText}>
                Age Range ({config.age_range[0]} - {config.age_range[1]} Years)
              </label>
              <Slider
                value={config.age_range}
                onChange={handleSliderChange}
                min={18}
                max={65}
                sx={{
                  color: "#6A00FF",
                  height: 8,
                  "& .MuiSlider-thumb": {
                    height: 22,
                    width: 22,
                    "&:focus, &:hover, &.Mui-active": {
                      boxShadow: "inherit",
                    },
                  },
                  "& .MuiSlider-track": {
                    height: 8,
                    borderRadius: 4,
                  },
                  "& .MuiSlider-rail": {
                    height: 8,
                    borderRadius: 4,
                  },
                }}
              />
            </div>

            {/* Attribution Setting Dropdown */}
            <div
              className={`${styles.column} ${
                config.targeting_type === "Advantage" ? styles.blurredField : ""
              }`}
            >
              <label htmlFor="attribution_setting" className={styles.labelText}>
                Attribution Setting:
              </label>
              <select
                id="attribution_setting"
                name="attribution_setting"
                value={config.attribution_setting}
                onChange={handleAttributionChange}
                className={styles.selectField}
              >
                {attributionSettings.map((setting) => (
                  <option key={setting.value} value={setting.value}>
                    {setting.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
        <hr className={styles.sectionDivider} />
      </div>
    </div>
  );
};

export default TargettingDelivery;