import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useDeactivateRoleMutation, useGetRolesQuery } from '../../redux/features/management/groups';
import { RoleAssignment, RoleData } from '../interfaces/management';
import CustomCreateForm from "../common/createForm";
import { useAssignUserRoleMutation } from '../../redux/features/permission/permit';
import { formatDateTime } from '../common/utils';
interface RoleManagerProps {
  userId: string;
  roles: RoleAssignment[];
  refetch: () => Promise<void>;
  closeTab: () => void;
}

const RoleManager = ({ userId, roles, refetch,closeTab }: RoleManagerProps) => {
  const [localRoles, setLocalRoles] = useState(roles);
  const [deactivateRole, { isLoading }] = useDeactivateRoleMutation();
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignRole, { isLoading: assignRoleLoading }] = useAssignUserRoleMutation();
  
  const { data: userRoleData } = useGetRolesQuery();
  const roleOptions = userRoleData?.map((role: RoleData) => ({
    value: role.id.toString(),
    text: role.name,
  }));

  useEffect(() => {
    setLocalRoles(roles);
  }, [roles]);

  const handleDeactivate = async (roleId: number) => {
    try {
      setLocalRoles(prev => prev.filter(role => role.id !== roleId));
      await deactivateRole({id:roleId}).unwrap();
      toast.success('Role deactivated successfully');
      await refetch()
    } catch (error) {
      toast.error('Failed to deactivate role');
      setLocalRoles(roles); // Revert on error
    }
  };

  const handleAssignRole = async (createdData: Partial<RoleAssignment>) => {
    try {
      await assignRole(createdData).unwrap();
      await refetch();
      closeTab();
      setShowAssignForm(false);
      toast.success('Role assigned successfully');
    } catch (error) {
      toast.error('Failed to assign role, Make sure the role is not already assigned');
    }
  };


  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Active Roles</h3>
        <button
          onClick={() => setShowAssignForm(!showAssignForm)}
          className={`px-4 py-2 rounded-md ${
            showAssignForm 
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {showAssignForm ? 'Cancel' : 'Add New Role'}
        </button>
      </div>

      {showAssignForm && (
        <div className="mb-6">
          <CustomCreateForm<RoleAssignment>
            isLoading={assignRoleLoading}
            onSubmit={handleAssignRole}
            selectOptions={{ role: roleOptions }}
            interfaceKeys={['role', 'start_date', 'end_date']}
            datetimeFields={['start_date', 'end_date']}
            optionalFields={['end_date']}
            notEditableFields={[]}
            hiddenFields={{ user: userId }}
            defaultValues={{}}
          />
        </div>
      )}

      <div className="space-y-3">
        {localRoles.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No active roles assigned
          </div>
        ) : (
          localRoles.map((role) => (
            <div
              key={role.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center space-x-3 flex-1">
                <input
                  type="checkbox"
                  checked={role.is_active}
                  onChange={() => handleDeactivate(role.id)}
                  disabled={isLoading}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="flex-1">
                  <span className="font-medium text-gray-700 block">
                    {role.role_name}
                  </span>
                  <div className="text-sm text-gray-500 mt-1">
                    From {formatDateTime(role.start_date)}  To  {formatDateTime(role.end_date)}
                  </div>
                </div>
              </div>
              
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RoleManager;