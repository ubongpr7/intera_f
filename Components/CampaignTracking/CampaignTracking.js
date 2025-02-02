"use client";
import React, { useState } from "react";
import styles from "./CampaignForm.module.css";
import Select from "react-select";

const CampaignTracking = () => {
  const [expandedSections, setExpandedSections] = useState({
    budgetSchedule: true,
    assets: true,
    placements: true,
    targetingDelivery: true,
    campaignTracking: true,
  });

  const [config, setConfig] = useState({
    app_events: new Date().toISOString().slice(0, 16),
    ad_creative_primary_text: "",
    ad_creative_headline: "",
    ad_creative_description: "",
    call_to_action: "SHOP_NOW",
    destination_url: "",
    url_parameters: "",
    campaign_budget_optimization: "DAILY_BUDGET",
    ad_set_budget_optimization: "DAILY_BUDGET",
    ad_set_budget_value: "50.00",
    ad_set_bid_strategy: "LOWEST_COST_WITHOUT_CAP",
    campaign_budget_value: "50.00",
    campaign_bid_strategy: "LOWEST_COST_WITHOUT_CAP",
    bid_amount: "",
    ad_format: "Single image or video",
    placement_type: "advantage_plus",
    platforms: { facebook: true, instagram: true, audience_network: true },
    buying_type: "AUCTION",
    targeting_type: "Advantage",
    location: [],
    age_range: [18, 65],
    gender: "All",
    event_type: "PURCHASE",
    pixel_id: "",
    facebook_page_id: "",
    instagram_account: "",
    custom_audiences: [],
    interests: [],
    attribution_setting: "7d_click",
  });

  const [isNewCampaign, setIsNewCampaign] = useState(false);
  const [campaignName, setCampaignName] = useState("");

  const toggleSection = (section) => {
    setExpandedSections((prevState) => ({
      ...prevState,
      [section]: !prevState[section],
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig((prevConfig) => ({
      ...prevConfig,
      [name]: value,
    }));
  };

  return (
    <div className={styles.formContainer}>
    
      {/* Campaign & Tracking Section */}
      <div className={styles.sectionBox}>
        <div
          className={styles.sectionHeader}
          onClick={() => toggleSection("campaignTracking")}
        >
          <h3>Campaign & Tracking</h3>
          <img
            src="/assets/Vectorw.svg"
            alt="Toggle Section"
            className={`${styles.toggleIcon} ${
              expandedSections["campaignTracking"] ? styles.expanded : ""
            }`}
          />
        </div>
        {expandedSections["campaignTracking"] && (
          <div className={styles.sectionContent}>
            <div className={styles.column}>
              <label className={styles.labelText} htmlFor="ad_format">
                Ad Format:
              </label>
              <select
                id="ad_format"
                name="ad_format"
                value={config.ad_format}
                onChange={handleChange}
                className={styles.selectField}
              >
                <option value="Single image or video">
                  Single image or video
                </option>
                <option value="Carousel">Carousel</option>
              </select>
            </div>

            <div className={styles.column}>
              <label className={styles.labelText} htmlFor="ad_creative_primary_text">
                Primary Text:
              </label>
              <textarea
                id="ad_creative_primary_text"
                name="ad_creative_primary_text"
                value={config.ad_creative_primary_text}
                onChange={handleChange}
                rows="4"
                className={styles.textareaField}
              />
            </div>

            <div className={styles.column}>
              <label className={styles.labelText} htmlFor="ad_creative_headline">
                Headline:
              </label>
              <textarea
                id="ad_creative_headline"
                name="ad_creative_headline"
                value={config.ad_creative_headline}
                onChange={handleChange}
                rows="4"
                className={styles.textareaField}
              />
            </div>

            <div className={styles.column}>
              <label className={styles.labelText} htmlFor="ad_creative_description">
                Description:
              </label>
              <textarea
                id="ad_creative_description"
                name="ad_creative_description"
                value={config.ad_creative_description}
                onChange={handleChange}
                rows="4"
                className={styles.textareaField}
              />
            </div>

            <div className={styles.column}>
              <label className={styles.labelText} htmlFor="call_to_action">
                Call to Action:
              </label>
              <select
                id="call_to_action"
                name="call_to_action"
                value={config.call_to_action}
                onChange={handleChange}
                className={styles.selectField}
              >
                <option value="SHOP_NOW">Shop Now</option>
                <option value="LEARN_MORE">Learn More</option>
                <option value="SIGN_UP">Sign Up</option>
                <option value="SUBSCRIBE">Subscribe</option>
                <option value="CONTACT_US">Contact Us</option>
                <option value="GET_OFFER">Get Offer</option>
                <option value="GET_QUOTE">Get Quote</option>
                <option value="DOWNLOAD">Download</option>
                <option value="ORDER_NOW">Order Now</option>
                <option value="BOOK_NOW">Book Now</option>
              </select>
            </div>

            <div className={styles.column}>
              <label className={styles.labelText} htmlFor="destination_url">
                Destination URL:
              </label>
              <input
                type="text"
                id="destination_url"
                name="destination_url"
                value={config.destination_url}
                onChange={handleChange}
                className={styles.inputField}
                required
              />
            </div>

            <div className={styles.column}>
              <label className={styles.labelText} htmlFor="url_parameters">
                UTM Parameters:
              </label>
              <input
                type="text"
                id="url_parameters"
                name="url_parameters"
                value={config.url_parameters}
                onChange={handleChange}
                className={styles.inputField}
              />
            </div>

            {isNewCampaign && (
              <div className={styles.column}>
                <label className={styles.labelText} htmlFor="campaignName">
                  Campaign Name:
                </label>
                <input
                  type="text"
                  id="campaignName"
                  name="campaignName"
                  placeholder="Enter Name"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  required
                  className={styles.inputField}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignTracking;
