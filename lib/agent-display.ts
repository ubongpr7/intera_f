const humanizeToken = (value: string) =>
  value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())

export const humanizeAgentDisplayName = (value: string | null | undefined): string => {
  const raw = String(value || "").trim()
  if (!raw) {
    return ""
  }

  const withoutRuntimePrefix = raw.replace(/^wa-p\d+-/i, "")
  const withoutRuntimeSuffix = withoutRuntimePrefix.replace(/-[0-9a-f]{8,}$/i, "")

  return humanizeToken(withoutRuntimeSuffix || raw)
}
