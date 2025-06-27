import React, { useEffect, useState } from 'react';
import { useGetUserGroupsQuery, useUpdateUserGroupMutation } from '../../redux/features/permission/permit';
import { toast } from 'react-toastify';
import LoadingAnimation from '../common/LoadingAnimation';

interface UserGroup {
  id: string;
  name: string;
  belongs_to: boolean;
}

interface UserGroupManagerProps {
  userId: string;
  setRefetchData:()=>void;
}

const UserGroupManager: React.FC<UserGroupManagerProps> = ({ userId,setRefetchData }) => {
  const { 
    data: response, 
    isLoading: userGroupsLoading, 
    isError,
    isSuccess,
    refetch: refetchUserGroups 
  } = useGetUserGroupsQuery(userId, {
    skip: !userId || userId === "0",
  });

  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);
  const userGroups: UserGroup[] = response?.groups || [];

  const [updateUserGroup, { isLoading: updateGroupLoading }] = useUpdateUserGroupMutation();

  // Initialize selected groups
  useEffect(() => {
    if (userGroups.length > 0) {
      const initialSelected = new Set(
        userGroups.filter(g => g.belongs_to).map(g => g.id)
      );
      setSelectedGroupIds(initialSelected);
    }
  }, [userGroups]);

  const handleCheckboxChange = (groupId: string, isChecked: boolean) => {
    setSelectedGroupIds(prev => {
      const newSet = new Set(prev);
      isChecked ? newSet.add(groupId) : newSet.delete(groupId);
      return newSet;
    });
    setHasChanges(true);
  };

  const handleUpdate = async () => {
    try {
      await updateUserGroup({ 
        id:userId, 
        data:{groups: Array.from(selectedGroupIds) }
      }).unwrap();
      
      toast.success('User groups updated successfully!');
      refetchUserGroups();
      setHasChanges(false);
      setRefetchData()
    } catch (error) {
      toast.error('Failed to update user groups.');
    }
  };

  // Disable button if no changes or during loading
  const isUpdateDisabled = !hasChanges || updateGroupLoading;

  if (userGroupsLoading) {
    return (
      <div className="p-4">
        <LoadingAnimation text="Loading user groups..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-red-600">
        Error loading user groups. Please try again later.
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4">User Group Management</h2>
      
      <div className="space-y-2 mb-4">
        {isSuccess && userGroups.length === 0 ? (
          <div className="text-gray-500 text-sm">
            No groups available for this user
            <div className="mt-2 text-xs">
              (User ID: {userId}, Total Groups: {userGroups.length})
            </div>
          </div>
        ) : (
          userGroups.map((group) => (
            <div key={group.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`group-${group.id}`}
                checked={selectedGroupIds.has(group.id)}
                onChange={(e) => handleCheckboxChange(group.id, e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={updateGroupLoading}
              />
              <label 
                htmlFor={`group-${group.id}`}
                className="text-sm text-gray-700"
              >
                {group.name} 
              </label>
            </div>
          ))
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={handleUpdate}
          disabled={isUpdateDisabled}
          className={`px-4 py-2 rounded-md text-white ${
            isUpdateDisabled 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {updateGroupLoading ? (
            <LoadingAnimation text="Updating..." />
          ) : (
            'Update Groups'
          )}
        </button>
      </div>
    </div>
  );
};

export default UserGroupManager;