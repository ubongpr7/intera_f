'use client'
import { UserData } from "../interfaces/User";
import CustomCreateCard from "../common/createCard";
import { PageHeader } from "../inventory/PageHeader";
import { useState } from "react";
import { useGetCompanyUsersQuery,useCreateStaffUserMutation } from "../../redux/features/users/userApiSlice";
import { Column, DataTable } from "../common/DataTable/DataTable";
import { useRouter } from 'nextjs-toploader/app';
import VerticalTabs from '../common/verticalTabs'
import ActivityLogs from './activityLogs'
import { useUpdateUserPermissionMutation,useGetUserPermissionQuery,useGetUserGroupsQuery, useUpdateUserGroupMutation, useAssignUserRoleMutation } from "../../redux/features/permission/permit";
import UserPermissionForm from '../permissions/customPermission';
import UserGroupManager from '../permissions/manytomany';
import CustomUpdateForm from "../common/updateForm";
import { useUpdateUserMutation } from "../../redux/features/users/userApiSlice";
import { RoleAssignment, RoleData } from "components/interfaces/management";
import { useGetRolesQuery } from "../../redux/features/management/groups";
import RoleManager from "./roleManager";


const inventoryColumns: Column<UserData>[] = [
  {
    header: 'Name',
    accessor: 'first_name',
    render: (value) => value || 'N/A',
    className: 'font-medium',
  },
  {
    header: 'Email',
    accessor: 'email',
    render: (value) => value || 'N/A',
    info: 'Category to which the inventory belong',
  },
  
  {
    header: 'Phone',
    accessor: 'phone',
    render: (value) => value || 'N/A',
    info: 'Category to which the inventory belong',
  },
  
];

interface ItemType {
  id: string;
  name: string;
  belongs_to: boolean;
}

const StaffCreateCard =()=>{
  const [isCreateOpen, setIsCreateOpen] = useState(false); 
  const [openTabs, setOpenTabs] = useState(false); 
  const [userId, setUserId] = useState('0'); 
  const [refetchData, setRefetchData] = useState(false); 
  const { data, isLoading, refetch, error } = useGetCompanyUsersQuery();
  const router = useRouter();
  const [createStaff, { isLoading: staffCreateLoading }] = useCreateStaffUserMutation();
  const [userRoles, setUserRoles] = useState<RoleAssignment[]>([]);

  const { data: permissionsData,
     isLoading:permissionDataLoading,
     refetch :refetchPermissions} = useGetUserPermissionQuery(userId, {
      skip: !userId || userId === "0",
    });
  const [updatePermission, { isLoading: permissionLoading }] = useUpdateUserPermissionMutation();

  const handleUpdatePermissionSubmit = async (createdData: { permissions: string[] }) => {
    await updatePermission({id:userId,data: createdData}).unwrap();
    await refetch();
    await refetchPermissions()
  };




  const handleRowClick =  (row: UserData) => {
    setRefetchData(true)
    setUserId(`${row.id}`)
    setUserDetail(row)
    setUserRoles(row?.roles || []);
    
    if (permissionsData) {
      refetchPermissions();
    };
    setOpenTabs(true)
    refetch()

  };



 
  const handleCreate = async (createdData: Partial<UserData>) => {
    await createStaff(createdData).unwrap();
    setIsCreateOpen(false); 
    await refetch();
  };
  const [updateUser, { isLoading: userUpdateLoading }] = useUpdateUserMutation();
  const [userDetail,setUserDetail] = useState<UserData>();
  
    const handleUpdate = async (createdData: Partial<UserData>) => {
      const updateData=await updateUser({id:userId,data: createdData}).unwrap();
      setUserDetail(updateData)
      await refetch();
    };
    
    
    return (
        <div>
        
            <PageHeader
            title="Staff"
            onClose={() => setIsCreateOpen(true)}
            />
            <DataTable<UserData>
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
                    interfaceKeys={['first_name','email', 'password','phone']}
                    optionalFields={[]}
                />
                </div>

            <div className={`fixed  inset-0 bg-black/50 flex items-center justify-center p-4 z-50 ${openTabs ? 'block' : 'hidden'}`}>
                <VerticalTabs
                    items={[
                      {
                        id: 'activities',
                        label: 'Staff Activities',
                        content: <ActivityLogs 
                          userId={userId}
                          refetchData={refetchData}
                          onRefetchComplete={() => setRefetchData(false)}
                        />,
                      },
                      {
                        id: 'permission',
                        label: 'Staff Permissions',
                        content: <UserPermissionForm 
                          permissionsData={permissionsData}
                          permissionLoading={permissionLoading}
                          isLoading={permissionDataLoading}
                          onSubmit={handleUpdatePermissionSubmit}
                        />,
                      },
                      ...(userId !== '0' ? [
                        {
                          id: 'details',
                          label: 'User Details',
                          content: <CustomUpdateForm
                            data={userDetail || {} as UserData}
                            isLoading={userUpdateLoading}
                            onSubmit={handleUpdate}
                            editableFields={['first_name', 'phone']}
                            displayKeys={['first_name', 'phone', 'email']}
                            selectOptions={{}}
                            keyInfo={{}}
                            notEditableFields={[]}
                          />,
                        },
                        {
                          id: 'group',
                          label: 'Staff Group',
                          content: <UserGroupManager userId={userId} />,
                        },
                        
                        {
                          id: 'update',
                          label: ' Staff Roles',
                          content: <RoleManager
                            userId={userId}
                            roles={userRoles || []}
                            refetch={async () => {
                              await refetch();
                            }}
                            closeTab={() => setOpenTabs(false)}
                          />,
                        },
                      ] : []),
                    ]}
                    onClose={() => setOpenTabs(false)}
                    className="border rounded-lg p-4"
                  />
                </div>
        </div>
    )
}
export default StaffCreateCard;