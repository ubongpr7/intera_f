import React, { useDeferredValue, useMemo, useState } from "react";
import { ReactSelectField, type SelectOption } from "@/components/ui/react-select-field";
import LoadingAnimation from "../common/LoadingAnimation";

interface Permission {
  codename: string;
  name: string;
  description: string;
  category: string;
  has_permission: boolean;
}

interface GroupPermissionFormProps {
  isLoading: boolean;
  permissionsData: { permissions: Permission[] } | undefined;
  permissionLoading: boolean;
  onSubmit: (data: { permissions: string[] }) => Promise<void>;
}

const titleCase = (value: string) =>
  value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const normalizeForSearch = (...values: Array<string | null | undefined>) =>
  values
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const humanizePermission = (permission: Permission) => titleCase(permission.codename || permission.name || "");

const humanizeCategory = (category: string) => titleCase(category);

const buildPermissionHelperText = (permission: Permission) => {
  const description = permission.description?.trim();
  if (description && normalizeForSearch(description) !== normalizeForSearch(permission.codename)) {
    return description;
  }

  return `Permission key: ${permission.codename}`;
};

type PermissionEditorProps = {
  permissions: Permission[];
  permissionLoading: boolean;
  onSubmit: (data: { permissions: string[] }) => Promise<void>;
};

const PermissionEditor = ({ permissions, permissionLoading, onSubmit }: PermissionEditorProps) => {
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    () => new Set(permissions.filter((permission) => permission.has_permission).map((permission) => permission.codename)),
  );
  const [searchInput, setSearchInput] = useState("");
  const [selectedSearchOption, setSelectedSearchOption] = useState<SelectOption | null>(null);

  const deferredSearchInput = useDeferredValue(searchInput);

  const categories = useMemo(
    () => Array.from(new Set(permissions.map((permission) => permission.category))),
    [permissions],
  );

  const searchOptions = useMemo<SelectOption[]>(
    () => [
      ...categories.map((category) => ({
        value: `category:${category}`,
        label: humanizeCategory(category),
      })),
      ...permissions.map((permission) => ({
        value: `permission:${permission.codename}`,
        label: humanizePermission(permission),
      })),
    ],
    [categories, permissions],
  );

  const normalizedQuery = useMemo(() => normalizeForSearch(deferredSearchInput), [deferredSearchInput]);

  const filteredGroups = useMemo(() => {
    return categories
      .map((category) => {
        const categoryPermissions = permissions.filter((permission) => permission.category === category);
        const categoryMatches = !normalizedQuery || normalizeForSearch(category).includes(normalizedQuery);

        const visiblePermissions = categoryMatches
          ? categoryPermissions
          : categoryPermissions.filter((permission) =>
              normalizeForSearch(
                permission.codename,
                permission.name,
                permission.description,
                permission.category,
                humanizePermission(permission),
              ).includes(normalizedQuery),
            );

        return {
          category,
          totalCount: categoryPermissions.length,
          visiblePermissions,
        };
      })
      .filter((group) => group.visiblePermissions.length > 0);
  }, [categories, normalizedQuery, permissions]);

  const visiblePermissionCount = useMemo(
    () => filteredGroups.reduce((total, group) => total + group.visiblePermissions.length, 0),
    [filteredGroups],
  );

  const selectedVisiblePermissionCount = useMemo(
    () =>
      filteredGroups.reduce(
        (total, group) =>
          total + group.visiblePermissions.filter((permission) => selectedPermissions.has(permission.codename)).length,
        0,
      ),
    [filteredGroups, selectedPermissions],
  );

  const handleCategoryChange = (category: string, visibleCategoryPermissions: Permission[]) => {
    const scopedPermissions = visibleCategoryPermissions.length
      ? visibleCategoryPermissions
      : permissions.filter((permission) => permission.category === category);
    const nextSelectedPermissions = new Set(selectedPermissions);
    const hasEveryVisiblePermission = scopedPermissions.every((permission) =>
      nextSelectedPermissions.has(permission.codename),
    );

    scopedPermissions.forEach((permission) => {
      if (hasEveryVisiblePermission) {
        nextSelectedPermissions.delete(permission.codename);
      } else {
        nextSelectedPermissions.add(permission.codename);
      }
    });

    setSelectedPermissions(nextSelectedPermissions);
  };

  const handlePermissionChange = (codename: string) => {
    const nextSelectedPermissions = new Set(selectedPermissions);

    if (nextSelectedPermissions.has(codename)) {
      nextSelectedPermissions.delete(codename);
    } else {
      nextSelectedPermissions.add(codename);
    }

    setSelectedPermissions(nextSelectedPermissions);
  };

  const handleSubmit = async () => {
    await onSubmit({ permissions: Array.from(selectedPermissions) });
  };

  const clearSearch = () => {
    setSearchInput("");
    setSelectedSearchOption(null);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-slate-800 bg-slate-950/80 p-4 shadow-[0_20px_55px_rgba(2,6,23,0.35)]">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="space-y-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                Search permissions
              </p>
              <p className="mt-1 text-sm text-slate-300">
                Find by category, action, permission code, or description while keeping the checkbox workflow.
              </p>
            </div>
            <ReactSelectField
              value={selectedSearchOption}
              inputValue={searchInput}
              options={searchOptions}
              isClearable
              isSearchable
              placeholder="Search permissions or categories"
              onChange={(option) => {
                const nextOption = (option as SelectOption | null) ?? null;
                setSelectedSearchOption(nextOption);
                setSearchInput(nextOption?.label ?? "");
              }}
              onInputChange={(value, meta) => {
                if (meta.action === "input-change") {
                  setSearchInput(value);
                  if (selectedSearchOption && value !== selectedSearchOption.label) {
                    setSelectedSearchOption(null);
                  }
                }

                return value;
              }}
              formatOptionLabel={(option) => {
                const isCategoryOption = String(option.value).startsWith("category:");
                return (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">{option.label}</span>
                    <span className="rounded-full border border-slate-600/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {isCategoryOption ? "Category" : "Permission"}
                    </span>
                  </div>
                );
              }}
              helperText={
                searchInput
                  ? `${visiblePermissionCount} matching permission${visiblePermissionCount === 1 ? "" : "s"} shown`
                  : "Use typing or selection to narrow the list instantly."
              }
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-300">
              {selectedPermissions.size} selected
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-300">
              {visiblePermissionCount} visible
            </span>
            {searchInput ? (
              <button
                type="button"
                onClick={clearSearch}
                className="rounded-full border border-slate-700 px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
              >
                Clear filter
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
        {filteredGroups.length ? (
          filteredGroups.map((group) => {
            const isChecked = group.visiblePermissions.every((permission) =>
              selectedPermissions.has(permission.codename),
            );
            const isPartiallyChecked =
              !isChecked &&
              group.visiblePermissions.some((permission) => selectedPermissions.has(permission.codename));

            return (
              <section
                key={group.category}
                className="rounded-[30px] border border-slate-800 bg-slate-950/70 p-4 shadow-[0_16px_48px_rgba(2,6,23,0.28)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleCategoryChange(group.category, group.visiblePermissions)}
                      ref={(element) => {
                        if (element) {
                          element.indeterminate = isPartiallyChecked;
                        }
                      }}
                      className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-blue-500"
                    />
                    <span>
                      <span className="block text-base font-semibold text-slate-100">
                        {humanizeCategory(group.category)}
                      </span>
                      <span className="mt-1 block text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                        {group.visiblePermissions.length === group.totalCount
                          ? `${group.totalCount} permissions`
                          : `${group.visiblePermissions.length} shown of ${group.totalCount}`}
                      </span>
                    </span>
                  </label>
                  <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-300">
                    {group.visiblePermissions.filter((permission) => selectedPermissions.has(permission.codename)).length}/
                    {group.visiblePermissions.length} selected
                  </span>
                </div>

                <div className="mt-4 space-y-2 pl-0 md:pl-7">
                  {group.visiblePermissions.map((permission) => (
                    <label
                      key={permission.codename}
                      className="flex cursor-pointer items-start gap-3 rounded-[22px] border border-slate-800 bg-slate-900/80 px-4 py-3 transition hover:border-slate-700 hover:bg-slate-900"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.has(permission.codename)}
                        onChange={() => handlePermissionChange(permission.codename)}
                        className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-950 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-100">
                          {humanizePermission(permission)}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-slate-400">
                          {buildPermissionHelperText(permission)}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </section>
            );
          })
        ) : (
          <div className="rounded-[28px] border border-dashed border-slate-700 bg-slate-950/60 px-4 py-8 text-center">
            <p className="text-base font-semibold text-slate-100">No permissions matched this search.</p>
            <p className="mt-2 text-sm text-slate-400">
              Try another category name, action word, or clear the current filter.
            </p>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 flex items-center justify-between gap-3 rounded-[28px] border border-slate-800 bg-slate-950/95 p-3 backdrop-blur">
        <p className="text-sm text-slate-300">
          {selectedVisiblePermissionCount} of {visiblePermissionCount} visible permissions currently enabled.
        </p>
        <button
          type="button"
          onClick={handleSubmit}
          className="rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
          disabled={permissionLoading}
        >
          {permissionLoading ? <LoadingAnimation text="Updating..." ringColor="#3b82f6" /> : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

const CustumPermissionForm: React.FC<GroupPermissionFormProps> = ({
  isLoading,
  permissionsData,
  permissionLoading,
  onSubmit,
}) => {
  const permissions = useMemo(() => permissionsData?.permissions ?? [], [permissionsData]);
  const permissionSyncKey = useMemo(
    () => permissions.map((permission) => `${permission.codename}:${permission.has_permission ? 1 : 0}`).join("|"),
    [permissions],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <LoadingAnimation />
      </div>
    );
  }

  return (
    <PermissionEditor
      key={permissionSyncKey || "empty-permissions"}
      permissions={permissions}
      permissionLoading={permissionLoading}
      onSubmit={onSubmit}
    />
  );
};

export default CustumPermissionForm;
