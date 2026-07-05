import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useGetRolesQuery } from '../../redux/features/management/groups';
import { RoleAssignment, RoleData } from "@/redux/features/management/managementTypes";
import CustomCreateForm from "../common/createForm";
import { formatDateTime } from '../common/utils';
import {
  useCreateStaffRoleAssignmentMutation,
  useGetStaffRoleAssignmentsQuery,
  useUpdateStaffRoleAssignmentMutation,
} from '@/redux/features/management/companyProfileApiSlice';
interface RoleManagerProps {
  userId: string;
  roles: RoleAssignment[];
  refetch: () => Promise<void>;
  closeTab: () => void;
}

const RoleManager = ({ userId, roles, refetch,closeTab }: RoleManagerProps) => {
  const [optimisticallyHiddenRoleIds, setOptimisticallyHiddenRoleIds] = useState<Set<number>>(() => new Set());
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignRole, { isLoading: assignRoleLoading }] = useCreateStaffRoleAssignmentMutation();
  const [updateAssignment, { isLoading: isUpdatingAssignment }] = useUpdateStaffRoleAssignmentMutation();
  const {
    data: assignmentData = [],
    isLoading: isLoadingAssignments,
    refetch: refetchAssignments,
  } = useGetStaffRoleAssignmentsQuery();
  
  const { data: userRoleData } = useGetRolesQuery();
  const fetchedUserRoles = useMemo<RoleAssignment[]>(() => {
    return assignmentData
      .filter((assignment) => `${assignment.user}` === `${userId}` && assignment.is_active)
      .map((assignment) => ({
        id: Number(assignment.id),
        user: `${assignment.user}`,
        role_name: assignment.role_name || "Assigned role",
        role: `${assignment.role}`,
        start_date: assignment.start_date,
        end_date: assignment.end_date || "",
        is_active: assignment.is_active,
        assigned_by: Number(assignment.assigned_by || 0),
        assigned_at: assignment.assigned_at || assignment.start_date,
        profile: assignment.profile ? `${assignment.profile}` : "",
      }));
  }, [assignmentData, userId]);

  const visibleRoles = useMemo(
    () => (fetchedUserRoles.length > 0 ? fetchedUserRoles : roles).filter((role) => !optimisticallyHiddenRoleIds.has(role.id)),
    [fetchedUserRoles, optimisticallyHiddenRoleIds, roles],
  );

  const assignedRoleIds = useMemo(
    () => new Set(visibleRoles.filter((role) => role.is_active).map((role) => `${role.role}`)),
    [visibleRoles],
  );

  const roleOptions = useMemo(
    () =>
      (userRoleData || [])
        .filter((role: RoleData) => !assignedRoleIds.has(role.id.toString()))
        .map((role: RoleData) => ({
          value: role.id.toString(),
          text: role.name,
        })),
    [assignedRoleIds, userRoleData],
  );

  const handleDeactivate = async (roleId: number) => {
    try {
      setOptimisticallyHiddenRoleIds((current) => new Set(current).add(roleId));
      await updateAssignment({ id: `${roleId}`, data: { is_active: false } }).unwrap();
      toast.success('Role assignment deactivated successfully');
      await refetchAssignments();
      await refetch()
    } catch (error) {
      toast.error('Failed to deactivate role assignment');
      setOptimisticallyHiddenRoleIds((current) => {
        const next = new Set(current);
        next.delete(roleId);
        return next;
      });
    }
  };

  const handleAssignRole = async (createdData: Partial<RoleAssignment>) => {
    try {
      await assignRole({
        user: Number(userId),
        role: `${createdData.role || ""}`,
        start_date: createdData.start_date,
        end_date: createdData.end_date || undefined,
        is_active: true,
      }).unwrap();
      await refetchAssignments();
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
          {roleOptions.length === 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Every active role is already assigned to this user. Deactivate an existing assignment before adding it again.
            </div>
          ) : (
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
          )}
        </div>
      )}

      <div className="space-y-3">
        {isLoadingAssignments ? (
          <div className="text-center py-4 text-gray-500">
            Loading active role assignments...
          </div>
        ) : visibleRoles.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No active roles assigned
          </div>
        ) : (
          visibleRoles.map((role) => (
            <div
              key={role.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center space-x-3 flex-1">
                <input
                  type="checkbox"
                  checked={role.is_active}
                  onChange={() => handleDeactivate(role.id)}
                  disabled={isUpdatingAssignment}
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
