const backendHost = (process.env.NEXT_PUBLIC_BACKEND_HOST_URL ?? "").replace(/\/+$/, "")

export const DEFAULT_BRAND_AVATAR_SRC = "/assets/intera-logo.png"

export const resolveBrandAssetUrl = (value?: string | null, fallback = DEFAULT_BRAND_AVATAR_SRC) => {
  if (!value) {
    return fallback
  }

  if (/^(https?:)?\/\//i.test(value) || value.startsWith("data:") || value.startsWith("blob:")) {
    return value
  }

  if (value.startsWith("/")) {
    return value
  }

  return backendHost ? `${backendHost}/${value}` : `/${value}`
}
