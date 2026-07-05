import { ShieldCheck, UserCheck, Users2 } from "lucide-react";
import { useMemo } from "react";

import LoadingAnimation from "../common/LoadingAnimation";
import { useGetStaffRoleAssignmentsQuery } from "@/redux/features/management/companyProfileApiSlice";
import { useGetUserGroupsQuery } from "@/redux/features/permission/permit";
import type { UserPermissionsResponse } from "@/redux/features/permission/permissionTypes";
import type { UserData } from "@/redux/features/users/userTypes";

type StaffAccessSummaryProps = {
  userId: string;
  user?: UserData;
  permissionsData?: UserPermissionsResponse;
  permissionLoading: boolean;
};

const normalizeLabel = (value?: string | null) =>
  value
    ? value
        .replace(/[_-]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    : "General";

const StaffAccessSummary = ({
  userId,
  user,
  permissionsData,
  permissionLoading,
}: StaffAccessSummaryProps) => {
  const {
    data: groupResponse,
    isLoading: groupsLoading,
  } = useGetUserGroupsQuery(userId, {
    skip: !userId || userId === "0",
  });

  const {
    data: assignmentData = [],
    isLoading: rolesLoading,
  } = useGetStaffRoleAssignmentsQuery();

  const activeGroups = useMemo(
    () => (groupResponse?.groups || []).filter((group) => group.belongs_to),
    [groupResponse?.groups],
  );

  const activeRoles = useMemo(
    () => assignmentData.filter((assignment) => `${assignment.user}` === `${userId}` && assignment.is_active),
    [assignmentData, userId],
  );

  const grantedPermissions = useMemo(
    () => (permissionsData?.permissions || []).filter((permission) => permission.has_permission),
    [permissionsData?.permissions],
  );

  const permissionCategories = useMemo(() => {
    const categoryCounts = new Map<string, number>();
    grantedPermissions.forEach((permission) => {
      const category = normalizeLabel(permission.category);
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    });

    return Array.from(categoryCounts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((left, right) => right.count - left.count || left.category.localeCompare(right.category));
  }, [grantedPermissions]);

  const isLoading = permissionLoading || groupsLoading || rolesLoading;
  const displayName = user?.first_name || user?.email || "Selected staff";

  if (!userId || userId === "0") {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
        Select a staff member to review their access.
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
              Effective access
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-50">{displayName}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Consolidated view of this staff member&apos;s active roles, group memberships, and granted permissions.
            </p>
          </div>
          <div className="rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-200">
            {isLoading ? "Syncing access" : "Live from access endpoints"}
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-300" />
              Active roles
            </div>
            <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-slate-50">{activeRoles.length}</p>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <Users2 className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
              Staff groups
            </div>
            <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-slate-50">{activeGroups.length}</p>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-300" />
              Permissions
            </div>
            <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-slate-50">{grantedPermissions.length}</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <LoadingAnimation text="Loading staff access..." />
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Role assignments</h4>
              <div className="mt-4 flex flex-wrap gap-2">
                {activeRoles.length ? (
                  activeRoles.map((role) => (
                    <span
                      key={role.id}
                      className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-200"
                    >
                      {role.role_name || `Role ${role.role}`}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No active roles assigned.</p>
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Group memberships</h4>
              <div className="mt-4 flex flex-wrap gap-2">
                {activeGroups.length ? (
                  activeGroups.map((group) => (
                    <span
                      key={group.id}
                      className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200"
                    >
                      {group.name}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No active group memberships.</p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Granted permissions</h4>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Effective permissions grouped by feature area.
                </p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                {permissionCategories.length} categories
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {permissionCategories.length ? (
                permissionCategories.map((item) => (
                  <div
                    key={item.category}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60"
                  >
                    <span className="text-sm font-medium capitalize text-slate-800 dark:text-slate-100">
                      {item.category}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm dark:bg-slate-950 dark:text-slate-300">
                      {item.count}
                    </span>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center dark:border-slate-800 dark:bg-slate-900/50">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No granted permissions found.</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Add permissions directly or through roles/groups.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default StaffAccessSummary;
