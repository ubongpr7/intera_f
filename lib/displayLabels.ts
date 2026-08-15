export const formatMachineLabel = (value: unknown, fallback = "Not set") => {
  const normalized = String(value ?? "").trim()
  if (!normalized) return fallback

  return normalized
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ")
}
