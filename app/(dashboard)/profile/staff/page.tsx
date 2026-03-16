'use client'
import StaffRole from '@/components/management/roles';
import Tabs from '@/components/common/Tabs';
import StaffCreateCard from '@/components/management/Staff';
import StaffGroup from '@/components/management/groups';
import { WorkspaceSetupShell } from '@/components/onboarding/WorkspaceSetupShell';
import { Card, CardContent } from '@/components/ui/card';
import { BadgePlus, ShieldCheck, Users } from 'lucide-react';
import {useState} from 'react'
const StaffPage = () => {
  const [refetchData,setRefetchData] = useState(false)
  const tabs = [
    {
      id: 'all',
      label: 'All Staff',
      content: <StaffCreateCard refetchData={refetchData} setRefetchData={setRefetchData} />,
    },
    {
      id: 'group',
      label: 'Staff Group',
      content: <StaffGroup refetchData={refetchData} setRefetchData={setRefetchData}  />,
    },
    
    {
      id: 'role',
      label: 'Staff Role',
      content: <StaffRole refetchData={refetchData} setRefetchData={setRefetchData}  />,
    },
    
  ];

  return (
    <WorkspaceSetupShell
      activeStage="team"
      title="Invite staff and define access"
      description="This page is the team phase of onboarding. Add members, then refine groups and roles using the existing reusable management forms so permissions stay aligned with the active company workspace."
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-5">
              <div className="mb-3 inline-flex rounded-xl bg-blue-100 p-2 text-blue-700">
                <Users className="h-4 w-4" />
              </div>
              <h2 className="text-base font-semibold text-gray-900">Invite and assign</h2>
              <p className="mt-1 text-sm text-gray-600">Add staff into the active company context before assigning operational ownership.</p>
            </CardContent>
          </Card>
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-5">
              <div className="mb-3 inline-flex rounded-xl bg-blue-100 p-2 text-blue-700">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h2 className="text-base font-semibold text-gray-900">Separate role from group</h2>
              <p className="mt-1 text-sm text-gray-600">Roles describe responsibility. Groups make recurring permission sets reusable across teams.</p>
            </CardContent>
          </Card>
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-5">
              <div className="mb-3 inline-flex rounded-xl bg-blue-100 p-2 text-blue-700">
                <BadgePlus className="h-4 w-4" />
              </div>
              <h2 className="text-base font-semibold text-gray-900">Use the shared forms</h2>
              <p className="mt-1 text-sm text-gray-600">The staff management panels below still use the existing reusable creation and update patterns while we modernize the flow around them.</p>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <Tabs 
            items={tabs} 
            className="rounded-lg"
          />
        </div>
      </div>
    </WorkspaceSetupShell>
  );
};

export default StaffPage;
