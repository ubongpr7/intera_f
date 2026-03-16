export type QueryParams = Record<string, unknown>;

export const normalizeQueryParams = <T extends object>(params?: T | void): QueryParams | undefined => {
  if (!params) {
    return undefined;
  }

  const entries = Object.entries(params).filter(([, value]) => {
    if (value === undefined || value === null || value === "") {
      return false;
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return true;
  });

  return entries.length ? Object.fromEntries(entries) : undefined;
};

export const buildQuery = <T extends object>(path: string, params?: T | void) => {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(normalizeQueryParams(params) ?? {})) {
    if (Array.isArray(value)) {
      value.forEach((item) => search.append(key, String(item)));
      continue;
    }

    search.set(key, String(value));
  }

  const query = search.toString();
  return query ? `${path}?${query}` : path;
};
