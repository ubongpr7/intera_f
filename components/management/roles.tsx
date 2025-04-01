'use client'
import { RoleData } from "../interfaces/management";
import CustomCreateCard from "../common/createCard";
import { PageHeader } from "../inventory/PageHeader";
import { useState } from "react";
import { useGetRolesQuery,useCreateRoleMutation } from "../../redux/features/management/groups";
import { useGetRolePermissionQuery,useUpdateRolePermissionMutation, } from "../../redux/features/permission/permit";
import { Column, DataTable } from "../common/DataTable/DataTable";
import { useRouter } from 'nextjs-toploader/app';
import VerticalTabs from '../common/verticalTabs'
import RolePermissionForm from '../permissions/customPermission';
import ActivityLogs from './activityLogs';
import { Permission } from "components/interfaces/common";




const inventoryColumns: Column<RoleData>[] = [
  {
    header: 'Name',
    accessor: 'name',
    render: (value) => value || 'N/A',
    className: 'font-medium',
  },
  {
    header: 'Permission',
    accessor: 'permission_num',
    render: (value) => value || 'N/A',
    info: 'Number of Permissions',
  },
  {
    header: 'Users',
    accessor: 'users_num',
    render: (value) => value || 'N/A',
    info: 'Number of Users',
  },
  {
    header: 'Email',
    accessor: 'description',
    render: (value) => value || 'N/A',
    info: '',
  },
  
  
];


const StaffRole =()=>{
  const [isCreateOpen, setIsCreateOpen] = useState(false); 
  const [openTabs, setOpenTabs] = useState(false); 
  const [roleId, setRoleId] = useState('0'); 
  const [refetchData, setRefetchData] = useState(false); 
  const { data, isLoading, refetch, error } = useGetRolesQuery();
  const router = useRouter();
  const [createGroup, { isLoading: staffCreateLoading }] = useCreateRoleMutation();

  
  const { data: permissionsData,
     isLoading:permissionDataLoading,
     refetch :refetchPermissions} = useGetRolePermissionQuery(roleId, {
      skip: !roleId || roleId === "0",
    });
  const [updatePermission, { isLoading: permissionLoading }] = useUpdateRolePermissionMutation();

  const handleUpdatePermissionSubmit = async (createdData: { permissions: string[] }) => {
    await updatePermission({id:roleId,data: createdData}).unwrap();
    await refetch();
    await refetchPermissions()
  };

  const handleRowClick =  (row: RoleData) => {
    setRefetchData(true)
    setRoleId(`${row.id}`)
    if (permissionsData) {
      refetchPermissions();
    };
    setOpenTabs(true)
    refetch()

  };

  const handleCreate = async (createdData: Partial<RoleData>) => {
    await createGroup(createdData).unwrap();
    setIsCreateOpen(false); 
    await refetch();
  };
 
    return (
        <div>
        
            <PageHeader
            title="Roles"
            onClose={() => setIsCreateOpen(true)}
            />
            <DataTable<RoleData>
            columns={inventoryColumns}
            data={data || []}
            isLoading={isLoading}
            onRowClick={handleRowClick}
            />

            <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 ${isCreateOpen ? 'block' : 'hidden'}`}>
                <CustomCreateCard
                    defaultValues={{}}
                    onClose={() => setIsCreateOpen(false)}
                    onSubmit={handleCreate}
                    isLoading={staffCreateLoading}
                    selectOptions={{}}
                    keyInfo={{}}
                    notEditableFields={[]}
                    interfaceKeys={['name', 'description' ]}
                    optionalFields={[]}
                />
                </div>

            <div className={`fixed  inset-0 bg-black/50 flex items-center justify-center p-4 z-50 ${openTabs ? 'block' : 'hidden'}`}>
                <VerticalTabs
                        items={[
                        
                          {
                            id: 'permission',
                            label: 'Staff Role Permissions',
                            content:<RolePermissionForm 
                            permissionsData={permissionsData}
                            permissionLoading={permissionLoading}
                            isLoading= {permissionDataLoading}
                            onSubmit={handleUpdatePermissionSubmit}

                            />
                          },
                          
                         
                        
                        ]}
                        onClose={()=>setOpenTabs(false)}
                        className="border rounded-lg p-4"
                      />

                </div>
        </div>
    )
}
export default StaffRole;