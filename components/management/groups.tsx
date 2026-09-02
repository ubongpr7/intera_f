'use client'
import { GroupData } from "@/redux/features/management/managementTypes";
import CustomCreateCard from "../common/createCard";

import { useDeferredValue, useEffect, useState } from "react";
import { usePathname, useRouter as useNavigationRouter, useSearchParams } from "next/navigation";
import { useGetGroupsPageQuery,useCreateGroupMutation,useUpdateGroupMutation} from "../../redux/features/management/groups";
import { Column, DataTable, type DataTableQueryState } from "../common/DataTable/DataTable";
import { useRouter } from 'nextjs-toploader/app';
import VerticalTabs from '../common/verticalTabs'
import GroupPermissionForm from '../permissions/customPermission';
import { useUpdateGroupPermissionMutation,useGetGroupPermissionQuery } from "../../redux/features/permission/permit";
import { Permission } from "@/redux/features/common/commonTypes";
import CustomUpdateForm from "../common/updateForm";
import { StaffManagementRefetchProp } from "./roles";
import { Pagination } from "@/components/ui/pagination";




const inventoryColumns: Column<GroupData>[] = [
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
    header: 'Users',
    accessor: 'users_count',
    render: (value) => value || 'N/A',
    info: 'Number of Users',
  },
  {
    header: 'Description',
    accessor: 'description',
    render: (value) => value || 'N/A',
    info: '',
  },
  
  
];


const StaffGroup =({refetchData, setRefetchData}:StaffManagementRefetchProp)=>{
  const [isCreateOpen, setIsCreateOpen] = useState(false); 
  const [openTabs, setOpenTabs] = useState(false); 
  const [groupId, setGroupId] = useState('0'); 
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const navigationRouter = useNavigationRouter();
  const tableStateKey = "table_groups";
  const [queryState, setQueryState] = useState<DataTableQueryState | null>(null);
  const search = queryState?.searchTerm ?? searchParams.get(`${tableStateKey}_search`) ?? "";
  const sortField = queryState?.sortConfig?.key ?? searchParams.get(`${tableStateKey}_sort`);
  const direction = queryState?.sortConfig?.direction ?? searchParams.get(`${tableStateKey}_direction`);
  const ordering = sortField === "name" ? `${direction === "descending" ? "-" : ""}name` : undefined;
  const page = Number(searchParams.get(`${tableStateKey}_page`)) || 1;
  const { data: groupPage, isLoading, refetch, error } = useGetGroupsPageQuery({
    page,
    page_size: 20,
    search: useDeferredValue(search.trim()) || undefined,
    ordering,
  });
  const data = groupPage?.results ?? [];
  const [createGroup, { isLoading: staffCreateLoading }] = useCreateGroupMutation();
  const { data: permissionsData,
     isLoading:permissionDataLoading,
     refetch :refetchPermissions} = useGetGroupPermissionQuery(groupId, {
      skip: !groupId || groupId === "0",
    });
  const [groupDetail,setGroupDetail] = useState<GroupData>();
  const [updatePermission, { isLoading: permissionLoading }] = useUpdateGroupPermissionMutation();
  const [updateGroup, { isLoading: groupUpdateLoading }] = useUpdateGroupMutation();

 useEffect(()=>{
   if (refetchData){
     refetch();
     setRefetchData(false);
   }
   },[refetch, refetchData, setRefetchData])
  
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
    setRefetchData(true)  

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
            <DataTable<GroupData>
            columns={inventoryColumns}
            data={data}
            isLoading={isLoading}
            error={error}
            onRetry={refetch}
            onRowClick={handleRowClick}
            searchableFields={['name', 'description']}
            filterableFields={[]}
            sortableFields={['name']}
            serverSide
            urlStateKey="groups"
            onQueryStateChange={setQueryState}
            title="Groups"
            onClose={() => setIsCreateOpen(true)}
            
            />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
              <span>{groupPage?.count ?? 0} group{groupPage?.count === 1 ? "" : "s"}</span>
              <Pagination
                currentPage={groupPage?.page ?? page}
                totalPages={groupPage?.total_pages ?? 0}
                onPageChange={(nextPage) => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set(`${tableStateKey}_page`, String(nextPage));
                  navigationRouter.push(`${pathname}?${params.toString()}`, { scroll: false });
                }}
              />
            </div>

            {isCreateOpen ? (
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
            ) : null}

                
            {openTabs ? (
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
                          readOnly={Boolean(groupDetail?.is_system)}
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
                          readOnly={Boolean(groupDetail?.is_system)}
                        />
                      }] : []),
                    ]}
                    onClose={() => setOpenTabs(false)}
                    className="border rounded-lg p-4"
                  />
            ) : null}
        </div>
    )
}
export default StaffGroup;
