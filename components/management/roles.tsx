'use client'
import { RoleData } from "@/redux/features/management/managementTypes";
import CustomCreateCard from "../common/createCard";

import { useDeferredValue, useEffect, useState } from "react";
import { usePathname, useRouter as useNavigationRouter, useSearchParams } from "next/navigation";
import { useCreateRoleMutation,useGetRolesPageQuery, useUpdateRoleMutation } from "../../redux/features/management/groups";
import { Column, DataTable, type DataTableQueryState } from "../common/DataTable/DataTable";
import { useRouter } from 'nextjs-toploader/app';
import VerticalTabs from '../common/verticalTabs'
import RolePermissionForm from '../permissions/customPermission';
import { useUpdateRolePermissionMutation,useGetRolePermissionQuery } from "../../redux/features/permission/permit";
import { Permission } from "@/redux/features/common/commonTypes";
import CustomUpdateForm from "../common/updateForm";
import { Pagination } from "@/components/ui/pagination";




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
    header: 'Description',
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
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const navigationRouter = useNavigationRouter();
  const tableStateKey = "table_roles";
  const [queryState, setQueryState] = useState<DataTableQueryState | null>(null);
  const search = queryState?.searchTerm ?? searchParams.get(`${tableStateKey}_search`) ?? "";
  const sortField = queryState?.sortConfig?.key ?? searchParams.get(`${tableStateKey}_sort`);
  const direction = queryState?.sortConfig?.direction ?? searchParams.get(`${tableStateKey}_direction`);
  const ordering = sortField === "name" ? `${direction === "descending" ? "-" : ""}name` : undefined;
  const page = Number(searchParams.get(`${tableStateKey}_page`)) || 1;
  const { data: rolePage, isLoading, refetch, error } = useGetRolesPageQuery({
    page,
    page_size: 20,
    search: useDeferredValue(search.trim()) || undefined,
    ordering,
  });
  const data = rolePage?.results ?? [];
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
      refetch();
      setRefetchData(false);
    }
    },[refetch, refetchData, setRefetchData])
 
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
            <DataTable<RoleData>
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
            urlStateKey="roles"
            onQueryStateChange={setQueryState}
            title="Roles"
            onClose={() => setIsCreateOpen(true)}
            />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
              <span>{rolePage?.count ?? 0} role{rolePage?.count === 1 ? "" : "s"}</span>
              <Pagination
                currentPage={rolePage?.page ?? page}
                totalPages={rolePage?.total_pages ?? 0}
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
                            label: 'Staff Role Permissions',
                            content:<RolePermissionForm 
                            permissionsData={permissionsData}
                            permissionLoading={permissionLoading}
                            isLoading= {permissionDataLoading}
                            onSubmit={handleUpdatePermissionSubmit}
                            readOnly={Boolean(roleDetail?.is_system)}

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
                                readOnly={Boolean(roleDetail?.is_system)}
                              />
                            }] : []),
                         
                        
                        ]}
                        onClose={()=>setOpenTabs(false)}
                        className="border rounded-lg p-4"
                      />
            ) : null}
        </div>
    )
}
export default StaffRole;
