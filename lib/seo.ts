export const productionSiteUrl = "https://www.interaims.com";

const configuredSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL || productionSiteUrl).replace(/\/$/, "");
const configuredBranch = process.env.AWS_BRANCH?.trim().toLowerCase();

// Amplify exposes AWS_BRANCH during builds. The explicit URL fallback also keeps local builds predictable.
export const isProductionSite = configuredBranch
  ? configuredBranch === "main"
  : new URL(configuredSiteUrl).hostname === "www.interaims.com";

export const publicSiteUrl = isProductionSite ? productionSiteUrl : configuredSiteUrl;
