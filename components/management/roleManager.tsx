import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useGetRolesQuery } from '../../redux/features/management/groups';
import { RoleAssignment, RoleData } from "@/redux/features/management/managementTypes";
import { formatDateTime } from '../common/utils';
import { ReactSelectField, type SelectOption } from "@/components/ui/react-select-field";
import { Button } from "@/components/ui/button";
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
  const [selectedRole, setSelectedRole] = useState<SelectOption | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isTemporary, setIsTemporary] = useState(false);
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

  const handleAssignRole = async () => {
    if (!selectedRole) {
      toast.error("Select a role to assign.");
      return;
    }
    if (isTemporary && !endDate) {
      toast.error("Set an end date for a temporary role.");
      return;
    }
    try {
      await assignRole({
        user: Number(userId),
        role: `${selectedRole.value}`,
        ...(startDate ? { start_date: new Date(startDate).toISOString() } : {}),
        ...(isTemporary && endDate ? { end_date: new Date(endDate).toISOString() } : {}),
        is_active: true,
      }).unwrap();
      await refetchAssignments();
      await refetch();
      closeTab();
      setShowAssignForm(false);
      setSelectedRole(null);
      setStartDate("");
      setEndDate("");
      setIsTemporary(false);
      toast.success('Role assigned successfully');
    } catch (error) {
      toast.error('Failed to assign role, Make sure the role is not already assigned');
    }
  };


  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Active Roles</h3>
        <Button
          type="button"
          variant={showAssignForm ? "outline" : "default"}
          onClick={() => setShowAssignForm(!showAssignForm)}
          className="rounded-full px-4 py-2"
        >
          {showAssignForm ? 'Cancel' : 'Add New Role'}
        </Button>
      </div>

      {showAssignForm && (
        <div className="mb-6">
          {roleOptions.length === 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Every active role is already assigned to this user. Deactivate an existing assignment before adding it again.
            </div>
          ) : (
            <div className="space-y-5 rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-200">Role</label>
                <ReactSelectField
                  inputId="staff-role"
                  options={roleOptions.map((role) => ({ value: role.value, label: role.text }))}
                  value={selectedRole}
                  onChange={(option) => setSelectedRole((option as SelectOption | null) ?? null)}
                  placeholder="Select a role"
                  isClearable
                  isDisabled={assignRoleLoading}
                  menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                />
              </div>

              <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100">Permanent role</p>
                  <p className="mt-1 text-xs text-slate-400">Turn off for a temporary assignment with an end date.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={!isTemporary}
                  onClick={() => setIsTemporary((current) => !current)}
                  className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${!isTemporary ? "bg-[#98fcc2]" : "bg-slate-700"}`}
                >
                  <span className={`absolute top-1 h-5 w-5 rounded-full bg-slate-950 transition-transform ${!isTemporary ? "left-6" : "left-1"}`} />
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-semibold text-slate-200">
                  Start date <span className="font-normal text-slate-500">(optional)</span>
                  <input type="datetime-local" value={startDate} onChange={(event) => setStartDate(event.target.value)} disabled={assignRoleLoading} className="block w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 font-normal text-slate-100 outline-none focus:border-[#98fcc2]" />
                </label>
                <label className="space-y-2 text-sm font-semibold text-slate-200">
                  End date {isTemporary ? <span className="text-rose-300">(required)</span> : <span className="font-normal text-slate-500">(not used)</span>}
                  <input type="datetime-local" value={endDate} onChange={(event) => setEndDate(event.target.value)} disabled={!isTemporary || assignRoleLoading} required={isTemporary} className="block w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-3 font-normal text-slate-100 outline-none focus:border-[#98fcc2] disabled:cursor-not-allowed disabled:opacity-45" />
                </label>
              </div>
              <Button type="button" variant="default" onClick={() => void handleAssignRole()} disabled={assignRoleLoading || !selectedRole} className="w-full rounded-full">
                {assignRoleLoading ? "Assigning role..." : "Assign role"}
              </Button>
            </div>
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
                    From {formatDateTime(role.start_date)}  To  {role.end_date ? formatDateTime(role.end_date) : "Present"}
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
