'use client'
import { UserData } from "../interfaces/User";
import CustomCreateCard from "../common/createCard";
import { PageHeader } from "../inventory/PageHeader";
import { useState } from "react";
import { useGetCompanyUsersQuery,useCreateStaffUserMutation } from "../../redux/features/users/userApiSlice";
import { Column, DataTable } from "../common/DataTable/DataTable";
import { useRouter } from 'nextjs-toploader/app';

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

const staffCreateCard =()=>{
  const [isCreateOpen, setIsCreateOpen] = useState(false); 
  const { data, isLoading, refetch, error } = useGetCompanyUsersQuery();
  const router = useRouter();
  const [createStaff, { isLoading: staffCreateLoading }] = useCreateStaffUserMutation();
  

  const handleCreate = async (createdData: Partial<UserData>) => {
    await createStaff(createdData).unwrap();
    setIsCreateOpen(false); 
    await refetch();
  };

  const handleRowClick = (row: UserData) => {
    router.push(`/companies/${row.id}`);
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
                    keyInfo={[]}
                    notEditableFields={[]}
                    interfaceKeys={[,'first_name','email', 'password','phone']}
                    optionalFields={[]}
                />
                </div>
        </div>
    )
}
export default staffCreateCard;