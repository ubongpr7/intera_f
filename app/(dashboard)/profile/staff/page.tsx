'use client'
import StaffRole from '@/components/management/roles';
import Tabs from '@/components/common/Tabs';
import StaffCreateCard from '@/components/management/Staff';
import StaffGroup from '@/components/management/groups';
import { WorkspaceSetupShell } from '@/components/onboarding/WorkspaceSetupShell';
import { readCookieValue } from '@/lib/authCookies';
import { hasPermission } from '@/lib/permissionsGuard';
import { usePopulateCompanyProfileDefaultAccessMutation } from '@/redux/features/management/companyProfileApiSlice';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCookie } from 'cookies-next';
import { BadgePlus, BriefcaseBusiness, RefreshCcw, ShieldCheck, Users, UsersRound } from 'lucide-react';
import {useState} from 'react'
import { toast } from 'react-toastify';
const StaffPage = () => {
  const [refetchData,setRefetchData] = useState(false)
  const activeProfileId = readCookieValue("profileId", getCookie) ?? readCookieValue("profile", getCookie)
  const canManageStaffAccess = hasPermission("manage_company_settings")
  const [populateDefaults, { isLoading: populatingDefaults }] = usePopulateCompanyProfileDefaultAccessMutation()

  const handlePopulateDefaults = async () => {
    if (!activeProfileId) {
      toast.error("Switch to a workspace before populating default roles and groups.")
      return
    }
    if (!canManageStaffAccess) {
      toast.error("You do not have permission to manage workspace staff access.")
      return
    }

    try {
      const result = await populateDefaults(String(activeProfileId)).unwrap()
      toast.success(
        `Default access synced: ${result.roles.created_count} roles created, ${result.groups.created_count} groups created.`,
      )
      setRefetchData(true)
    } catch (error) {
      const message = error && typeof error === "object" && "data" in error
        ? String((error as { data?: { detail?: string } }).data?.detail || "")
        : ""
      toast.error(message || "Unable to populate default roles and groups for this workspace.")
    }
  }

  const tabs = [
    {
      id: 'all',
      label: 'All Staff',
      icon: Users,
      content: <StaffCreateCard refetchData={refetchData} setRefetchData={setRefetchData} />,
    },
    {
      id: 'group',
      label: 'Staff Group',
      icon: UsersRound,
      content: <StaffGroup refetchData={refetchData} setRefetchData={setRefetchData}  />,
    },
    
    {
      id: 'role',
      label: 'Staff Role',
      icon: ShieldCheck,
      content: <StaffRole refetchData={refetchData} setRefetchData={setRefetchData}  />,
    },
    
  ];

  return (
    <WorkspaceSetupShell
      activeStage="team"
      title="Staff access management"
      description="Add members, manage groups and roles, and keep permissions aligned with the active company workspace."
    >
      <div className="staff-management-page space-y-6">
        <div className="staff-management-intro grid gap-4 md:grid-cols-3">
          <Card className="staff-management-feature border-gray-200 shadow-sm">
            <CardContent className="p-5">
              <div className="mb-3 inline-flex rounded-xl bg-blue-100 p-2 text-blue-700">
                <Users className="h-4 w-4" />
              </div>
              <h2 className="text-base font-semibold text-gray-900">Invite and assign</h2>
              <p className="mt-1 text-sm text-gray-600">Add staff into the active company context before assigning operational ownership.</p>
            </CardContent>
          </Card>
          <Card className="staff-management-feature border-gray-200 shadow-sm">
            <CardContent className="p-5">
              <div className="mb-3 inline-flex rounded-xl bg-blue-100 p-2 text-blue-700">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h2 className="text-base font-semibold text-gray-900">Separate role from group</h2>
              <p className="mt-1 text-sm text-gray-600">Roles describe responsibility. Groups make recurring permission sets reusable across teams.</p>
            </CardContent>
          </Card>
          <Card className="staff-management-feature border-gray-200 shadow-sm">
            <CardContent className="p-5">
              <div className="mb-3 inline-flex rounded-xl bg-blue-100 p-2 text-blue-700">
                <BadgePlus className="h-4 w-4" />
              </div>
              <h2 className="text-base font-semibold text-gray-900">Use the shared forms</h2>
              <p className="mt-1 text-sm text-gray-600">The staff management panels below still use the existing reusable creation and update patterns while we modernize the flow around them.</p>
            </CardContent>
          </Card>
        </div>

        <Card className="staff-management-presets border-gray-200 shadow-sm">
          <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex rounded-xl bg-emerald-100 p-2 text-emerald-700">
                <BriefcaseBusiness className="h-4 w-4" />
              </div>
              <h2 className="text-base font-semibold text-gray-900">Workspace default access presets</h2>
              <p className="mt-1 text-sm text-gray-600">
                Each workspace keeps its own default staff groups and roles. This includes Cashier, POS Manager,
                BO Manager, Inventory Manager, Purchase Manager, Warehouse Staff, Viewer, and Administrator. Use the
                sync action below to populate any missing defaults for the active workspace, then customize permissions locally.
              </p>
              {!canManageStaffAccess ? (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  You do not have access to populate workspace defaults. Required permission:{" "}
                  <span className="font-mono font-semibold text-red-900">manage_company_settings</span>
                </div>
              ) : null}
            </div>
            <Button className="staff-management-sync" onClick={() => void handlePopulateDefaults()} disabled={!canManageStaffAccess || populatingDefaults || !activeProfileId}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              {populatingDefaults ? "Syncing defaults..." : "Populate default roles & groups"}
            </Button>
          </CardContent>
        </Card>

        {canManageStaffAccess ? (
          <div className="staff-management-tabs rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <Tabs 
              items={tabs} 
              className="rounded-lg"
            />
          </div>
        ) : (
          <Card className="border-red-200 bg-red-50 shadow-sm">
            <CardContent className="p-5">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-red-600">Permission required</div>
              <div className="mt-3 font-mono text-sm font-semibold text-red-900">manage_company_settings</div>
              <p className="mt-3 text-sm text-red-800">
                You do not have access to view or manage workspace staff, roles, and groups for this organization.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </WorkspaceSetupShell>
  );
};

export default StaffPage;
