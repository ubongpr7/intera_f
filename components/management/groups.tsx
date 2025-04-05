'use client'
import { GroupData } from "../interfaces/management";
import CustomCreateCard from "../common/createCard";
import { PageHeader } from "../inventory/PageHeader";
import { useState } from "react";
import { useGetGroupsQuery,useCreateGroupMutation,useUpdateGroupMutation ,useGetGroupQuery} from "../../redux/features/management/groups";
import { Column, DataTable } from "../common/DataTable/DataTable";
import { useRouter } from 'nextjs-toploader/app';
import VerticalTabs from '../common/verticalTabs'
import GroupPermissionForm from '../permissions/customPermission';
import { useUpdateGroupPermissionMutation,useGetGroupPermissionQuery } from "../../redux/features/permission/permit";
import { Permission } from "components/interfaces/common";
import CustomUpdateForm from "../common/updateForm";




const inventoryColumns: Column<GroupData>[] = [
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


const StaffGroup =()=>{
  const [isCreateOpen, setIsCreateOpen] = useState(false); 
  const [openTabs, setOpenTabs] = useState(false); 
  const [groupId, setGroupId] = useState('0'); 
  const [refetchData, setRefetchData] = useState(false); 
  const { data, isLoading, refetch, error } = useGetGroupsQuery();
  const [createGroup, { isLoading: staffCreateLoading }] = useCreateGroupMutation();
  const { data: permissionsData,
     isLoading:permissionDataLoading,
     refetch :refetchPermissions} = useGetGroupPermissionQuery(groupId, {
      skip: !groupId || groupId === "0",
    });
  const [groupDetail,setGroupDetail] = useState<GroupData>();
  const [updatePermission, { isLoading: permissionLoading }] = useUpdateGroupPermissionMutation();
  const [updateGroup, { isLoading: groupUpdateLoading }] = useUpdateGroupMutation();

  
  const handleUpdatePermissionSubmit = async (createdData: { permissions: string[] }) => {
    await updatePermission({id:groupId,data: createdData}).unwrap();
    await refetch();
    await refetchPermissions()
  };
  
  const handleUpdate = async (createdData: Partial<GroupData>) => {
    const updateData=await updateGroup({id:groupId,data: createdData}).unwrap();
    setGroupDetail(updateData)
    await refetch();
  };

  const handleCreate = async (createdData: Partial<GroupData>) => {
    await createGroup(createdData).unwrap();
    setIsCreateOpen(false); 
    await refetch();
  };
  const handleRowClick =  (row: GroupData) => {
    setRefetchData(true)  
    setGroupId(`${row.id}`)
    setGroupDetail(row)
    if (permissionsData) {
      refetchPermissions();
    };
    setOpenTabs(true)
    refetch()


  };
    return (
        <div>
        
            <PageHeader
            title="Groups"
            onClose={() => setIsCreateOpen(true)}
            />
            <DataTable<GroupData>
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
                        label: 'Staff Group Permissions',
                        content: <GroupPermissionForm 
                          permissionsData={permissionsData}
                          permissionLoading={permissionLoading}
                          isLoading={permissionDataLoading}
                          onSubmit={handleUpdatePermissionSubmit}
                        />
                      },
                          ...(groupId !== '0' ? [{
                        id: 'details',
                        label: 'Group Details',
                        content: <CustomUpdateForm 
                          data={groupDetail || {} as GroupData}
                          isLoading={groupUpdateLoading}
                          onSubmit={handleUpdate}
                          selectOptions={{}}
                          editableFields={['name', 'description']}
                          keyInfo={{}}
                          notEditableFields={[]}
                          displayKeys={['name', 'description']}
                        />
                      }] : []),
                    ]}
                    onClose={() => setOpenTabs(false)}
                    className="border rounded-lg p-4"
                  />

                </div>
        </div>
    )
}
export default StaffGroup;


