import { getDecodedAuthorizationContext, getDecodedToken } from "./utils";

type DecodedToken = {
  permissions?: string[];
  owner_id?: string | number | null;
  id?: string | number | null;
  sub?: string | number | null;
  user_id?: string | number | null;
};

export const getTokenPermissions = (): Set<string> => {
  const token = getDecodedToken() as DecodedToken | null;
  const context = getDecodedAuthorizationContext() as (DecodedToken & {
    wildcards?: string[];
    wildcard_permissions?: Record<string, string[]>;
  }) | null;
  const wildcardPermissions = context?.wildcard_permissions ?? {};
  const permissions = [
    ...(Array.isArray(token?.permissions) ? token.permissions : []),
    ...(Array.isArray(context?.permissions) ? context.permissions : []),
    ...(context?.wildcards ?? []).flatMap((wildcard) => wildcardPermissions[wildcard] ?? []),
  ];
  return new Set(permissions.filter((permission): permission is string => typeof permission === "string"));
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
