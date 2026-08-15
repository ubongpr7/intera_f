import { getDecodedToken } from "./utils";

type DecodedToken = {
  permissions?: string[];
  owner_id?: string | number | null;
  id?: string | number | null;
  sub?: string | number | null;
  user_id?: string | number | null;
};

export const getTokenPermissions = (): Set<string> => {
  const token = getDecodedToken() as DecodedToken | null;
  const permissions = token?.permissions;
  if (!Array.isArray(permissions)) {
    return new Set();
  }
  return new Set(permissions);
};

const normalizeId = (value: string | number | null | undefined): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = `${value}`.trim();
  return normalized.length ? normalized : null;
};

export const isWorkspaceOwner = (): boolean => {
  const token = getDecodedToken() as DecodedToken | null;
  if (!token) {
    return false;
  }

  const ownerId = normalizeId(token.owner_id);
  const currentUserId =
    normalizeId(token.id) ??
    normalizeId(token.user_id) ??
    normalizeId(token.sub);

  return ownerId !== null && currentUserId !== null && ownerId === currentUserId;
};

export const hasTokenPermission = (permission: string): boolean => {
  if (isWorkspaceOwner()) {
    return true;
  }
  return getTokenPermissions().has(permission);
};

export const hasAnyTokenPermission = (permissions: string[]): boolean => {
  if (isWorkspaceOwner()) {
    return true;
  }
  const userPermissions = getTokenPermissions();
  return permissions.some((permission) => userPermissions.has(permission));
};
