import React, { useDeferredValue, useMemo, useState } from 'react';
import { AlertTriangle, Search, Users2 } from 'lucide-react';
import { useGetUserGroupsQuery, useUpdateUserGroupMutation } from '../../redux/features/permission/permit';
import { toast } from 'react-toastify';

import LoadingAnimation from '../common/LoadingAnimation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface UserGroup {
  id: string;
  name: string;
  belongs_to: boolean;
}

interface UserGroupManagerProps {
  userId: string;
  setRefetchData: () => void;
}

type UserGroupSelectionWorkspaceProps = {
  userGroups: UserGroup[];
  updateGroupLoading: boolean;
  onSave: (groupIds: string[]) => Promise<void>;
};

const normalizeSearch = (value: string) => value.toLowerCase().trim();

const UserGroupSelectionWorkspace = ({
  userGroups,
  updateGroupLoading,
  onSave,
}: UserGroupSelectionWorkspaceProps) => {
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(
    () => new Set(userGroups.filter((group) => group.belongs_to).map((group) => group.id)),
  );
  const [searchTerm, setSearchTerm] = useState('');

  const deferredSearchTerm = useDeferredValue(searchTerm);
  const normalizedSearchTerm = useMemo(() => normalizeSearch(deferredSearchTerm), [deferredSearchTerm]);
  const initialSelectedIds = useMemo(
    () => new Set(userGroups.filter((group) => group.belongs_to).map((group) => group.id)),
    [userGroups],
  );

  const filteredGroups = useMemo(() => {
    if (!normalizedSearchTerm) {
      return userGroups;
    }

    return userGroups.filter((group) => normalizeSearch(group.name).includes(normalizedSearchTerm));
  }, [normalizedSearchTerm, userGroups]);

  const hasChanges = useMemo(() => {
    if (selectedGroupIds.size !== initialSelectedIds.size) {
      return true;
    }

    for (const groupId of selectedGroupIds) {
      if (!initialSelectedIds.has(groupId)) {
        return true;
      }
    }

    return false;
  }, [initialSelectedIds, selectedGroupIds]);

  const selectedCount = selectedGroupIds.size;
  const clearSearch = () => setSearchTerm('');

  const handleCheckboxChange = (groupId: string, isChecked: boolean) => {
    setSelectedGroupIds((previous) => {
      const next = new Set(previous);
      if (isChecked) {
        next.add(groupId);
      } else {
        next.delete(groupId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    await onSave(Array.from(selectedGroupIds));
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-slate-800 bg-slate-950/80 p-4 shadow-[0_20px_55px_rgba(2,6,23,0.35)]">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="space-y-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Search groups</p>
              <p className="mt-1 text-sm text-slate-300">
                Find reusable permission groups quickly, then tick the ones this user should belong to.
              </p>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search groups"
                className="rounded-full border-slate-700 bg-slate-900 pl-11 text-slate-100 shadow-none dark:bg-slate-900"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-300">
              {selectedCount} selected
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-300">
              {filteredGroups.length} visible
            </span>
            {searchTerm ? (
              <Button type="button" variant="ghost" size="sm" className="rounded-full px-3 text-slate-200" onClick={clearSearch}>
                Clear filter
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="max-h-[56vh] space-y-3 overflow-y-auto pr-1">
        {filteredGroups.length ? (
          filteredGroups.map((group) => {
            const checked = selectedGroupIds.has(group.id);
            return (
              <label
                key={group.id}
                className="flex cursor-pointer items-start gap-3 rounded-[24px] border border-slate-800 bg-slate-950/72 px-4 py-4 transition hover:border-slate-700 hover:bg-slate-950"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => handleCheckboxChange(group.id, event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-blue-500"
                  disabled={updateGroupLoading}
                />
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                    <Users2 className="h-4 w-4 text-slate-400" />
                    {group.name}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-slate-400">
                    {checked ? 'This user currently belongs to this group.' : 'Tick to add this user to the group.'}
                  </span>
                </span>
              </label>
            );
          })
        ) : (
          <div className="rounded-[28px] border border-dashed border-slate-700 bg-slate-950/60 px-4 py-8 text-center">
            <p className="text-base font-semibold text-slate-100">No groups matched this search.</p>
            <p className="mt-2 text-sm text-slate-400">Try a different group name or clear the filter.</p>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 flex items-center justify-between gap-3 rounded-[28px] border border-slate-800 bg-slate-950/95 p-3 backdrop-blur">
        <p className="text-sm text-slate-300">
          {selectedCount} group{selectedCount === 1 ? '' : 's'} will be assigned to this user.
        </p>
        <Button
          type="button"
          variant="default"
          onClick={handleSave}
          disabled={!hasChanges || updateGroupLoading}
          className="rounded-full px-5"
        >
          {updateGroupLoading ? <LoadingAnimation text="Updating..." ringColor="#0f172a" /> : 'Save Group Access'}
        </Button>
      </div>
    </div>
  );
};

const UserGroupManager: React.FC<UserGroupManagerProps> = ({ userId, setRefetchData }) => {
  const {
    data: response,
    isLoading: userGroupsLoading,
    isError,
    refetch: refetchUserGroups,
  } = useGetUserGroupsQuery(userId, {
    skip: !userId || userId === '0',
  });

  const userGroups: UserGroup[] = response?.groups || [];
  const [updateUserGroup, { isLoading: updateGroupLoading }] = useUpdateUserGroupMutation();

  const handleUpdate = async (groupIds: string[]) => {
    try {
      await updateUserGroup({
        id: userId,
        data: { groups: groupIds },
      }).unwrap();

      toast.success('User groups updated successfully!');
      refetchUserGroups();
      setRefetchData();
    } catch (error) {
      toast.error('Failed to update user groups.');
    }
  };

  if (userGroupsLoading) {
    return (
      <div className="p-4">
        <LoadingAnimation text="Loading user groups..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-500/30 dark:bg-rose-950/20">
        <AlertTriangle className="mx-auto h-8 w-8 text-rose-500" />
        <p className="mt-3 text-base font-semibold text-rose-900 dark:text-rose-100">Unable to load user groups</p>
        <p className="mt-2 text-sm text-rose-700 dark:text-rose-200">
          Refresh this panel or try again after confirming the staff member is still available.
        </p>
        <Button type="button" variant="outline" className="mt-4" onClick={() => refetchUserGroups()}>
          Retry
        </Button>
      </div>
    );
  }

  if (userGroups.length === 0) {
    return (
      <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-800 dark:bg-slate-950/50">
        <p className="text-base font-semibold text-slate-900 dark:text-slate-100">No groups available for this user.</p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Create staff groups first, then return here to assign them.
        </p>
      </div>
    );
  }

  const groupSyncKey = userGroups
    .map((group) => `${group.id}:${group.belongs_to ? 1 : 0}`)
    .join('|');

  return (
    <UserGroupSelectionWorkspace
      key={groupSyncKey}
      userGroups={userGroups}
      updateGroupLoading={updateGroupLoading}
      onSave={handleUpdate}
    />
  );
};

export default UserGroupManager;
