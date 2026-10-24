export type WorkspaceBranding = {
  logo?: string | null
  logo_light?: string | null
  logo_dark?: string | null
}

/** Choose the best available workspace logo without requiring both variants. */
export const selectWorkspaceLogo = (branding: WorkspaceBranding | null | undefined, isDarkMode: boolean) =>
  isDarkMode
    ? branding?.logo_dark || branding?.logo_light || branding?.logo || null
    : branding?.logo_light || branding?.logo_dark || branding?.logo || null
