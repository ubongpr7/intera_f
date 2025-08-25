'use client'
import { RoleData } from "../interfaces/management";
import CustomCreateCard from "../common/createCard";
import { PageHeader } from "../inventory/PageHeader";
import { useState,useEffect } from "react";
import { useCreateRoleMutation,useGetRolesQuery, useUpdateRoleMutation } from "../../redux/features/management/groups";
import { Column, DataTable } from "../common/DataTable/DataTable";
import { useRouter } from 'nextjs-toploader/app';
import VerticalTabs from '../common/verticalTabs'
import RolePermissionForm from '../permissions/customPermission';
import { useUpdateRolePermissionMutation,useGetRolePermissionQuery } from "../../redux/features/permission/permit";
import { Permission } from "../interfaces/common";
import CustomUpdateForm from "../common/updateForm";




const inventoryColumns: Column<RoleData>[] = [
  {
    header: 'Name',
    accessor: 'name',
    render: (value) => value || 'N/A',
    className: 'font-medium',
  },
  {
    header: 'Permission',
    accessor: 'permission_count',
    render: (value) => value || 'N/A',
    info: 'Number of Permissions',
  },
  {
    header: 'Active Assignments',
    accessor: 'assignments_count',
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
export interface StaffManagementRefetchProp{
  setRefetchData:(refetchData:boolean)=>void;
  refetchData:boolean
}
const StaffRole =({refetchData, setRefetchData}:StaffManagementRefetchProp)=>{
  const [isCreateOpen, setIsCreateOpen] = useState(false); 
  const [openTabs, setOpenTabs] = useState(false); 
  const [roleID, setRoleID] = useState('0'); 
  const { data, isLoading, refetch, error } = useGetRolesQuery();
  const [createGroup, { isLoading: staffCreateLoading }] = useCreateRoleMutation();
  const { data: permissionsData,
     isLoading:permissionDataLoading,
     refetch :refetchPermissions} = useGetRolePermissionQuery(roleID, {
      skip: !roleID || roleID === "0",
    });
  const [updatePermission, { isLoading: permissionLoading }] = useUpdateRolePermissionMutation();
  

  const handleUpdatePermissionSubmit = async (createdData: { permissions: string[] }) => {
    await updatePermission({id:roleID,data: createdData}).unwrap();
    await refetch();
    await refetchPermissions()
      setRefetchData(true);

  };
  useEffect(()=>{
    if (refetchData){
      console.log('before: ',refetchData)
      refetch();
      setRefetchData(false);
      console.log('after',refetchData)
    }
    },[refetchData])
 
  const handleCreate = async (createdData: Partial<RoleData>) => {
    await createGroup(createdData).unwrap();
    setIsCreateOpen(false); 
    await refetch();
  };

  const handleRowClick =  (row: RoleData) => {
    setRoleID(`${row.id}`)
    setRoleDetail(row)

    if (permissionsData) {
      refetchPermissions();
    };
    setOpenTabs(true)
    refetch()
  
  };
  const [updateRole, { isLoading: roleUpdateLoading }] = useUpdateRoleMutation();
  const [roleDetail,setRoleDetail] = useState<RoleData>();

  
  const handleUpdate = async (createdData: Partial<RoleData>) => {
    const updateData=await updateRole({id:roleID,data: createdData}).unwrap();
    setRoleDetail(updateData)
    setRefetchData(true)  

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
            searchableFields={['name', 'description']}
            filterableFields={[]}
            sortableFields={['name', 'description']}
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
                          ...(roleID !== '0' ? [{
                              id: 'details',
                              label: 'Role Details',
                              content: <CustomUpdateForm 
                                data={roleDetail || {} as RoleData}
                                isLoading={roleUpdateLoading}
                                onSubmit={handleUpdate}
                                selectOptions={{}}
                                editableFields={['name', 'description']}
                                keyInfo={{}}
                                notEditableFields={[]}
                                displayKeys={['name', 'description']}
                              />
                            }] : []),
                         
                        
                        ]}
                        onClose={()=>setOpenTabs(false)}
                        className="border rounded-lg p-4"
                      />

                </div>
        </div>
    )
}
export default StaffRole;


