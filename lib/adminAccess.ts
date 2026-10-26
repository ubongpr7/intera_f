import { getDecodedToken } from "./utils"

type AdminClaims = { is_superuser?: boolean | string | number | null }

export const truthyAdminClaim = (value: unknown) => {
  if (value === true || value === 1) return true
  return typeof value === "string" && ["true", "1", "yes"].includes(value.trim().toLowerCase())
}

export const isSuperuserFromToken = () => {
  const claims = getDecodedToken() as AdminClaims | null
  return truthyAdminClaim(claims?.is_superuser)
}
