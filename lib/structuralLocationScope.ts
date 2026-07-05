export type StructuralLocationScopeParams = {
  structural_location_id?: string
  structural_location_ids?: string[]
  scope?: "all" | "all_locations"
}

export const normalizeStructuralLocationIds = (value?: readonly string[] | string[] | null): string[] => {
  if (!value?.length) {
    return []
  }

  const seen = new Set<string>()
  const normalized: string[] = []

  for (const entry of value) {
    const trimmed = String(entry || "").trim()
    if (!trimmed || seen.has(trimmed)) {
      continue
    }
    seen.add(trimmed)
    normalized.push(trimmed)
  }

  return normalized
}

export const isAllStructuralLocationScope = (value?: readonly string[] | string[] | null) =>
  normalizeStructuralLocationIds(value).length === 0

export const buildStructuralLocationScopeParams = (
  value?: readonly string[] | string[] | null,
): StructuralLocationScopeParams => {
  const normalized = normalizeStructuralLocationIds(value)
  if (!normalized.length) {
    return { scope: "all_locations" }
  }
  if (normalized.length === 1) {
    return { structural_location_id: normalized[0] }
  }
  return { structural_location_ids: normalized }
}

export const getSingleStructuralLocationId = (value?: readonly string[] | string[] | null) => {
  const normalized = normalizeStructuralLocationIds(value)
  return normalized.length === 1 ? normalized[0] : undefined
}

export const matchesStructuralLocationScope = (
  structuralLocationId: string | null | undefined,
  selectedStructuralLocationIds?: readonly string[] | string[] | null,
) => {
  const normalized = normalizeStructuralLocationIds(selectedStructuralLocationIds)
  if (!normalized.length) {
    return true
  }
  return normalized.includes(String(structuralLocationId || "").trim())
}
