'use client'
import { useDeferredValue, useState } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { usePathname, useRouter as useNavigationRouter, useSearchParams } from "next/navigation";
import { Column, DataTable } from "../common/DataTable/DataTable";
import { CompanyDataInterface } from "@/redux/features/company/companyTypes";
import { useListCompanyPageQuery, useCreateCompanyMutation } from '../../redux/features/company/companyAPISlice';
import CustomCreateCard from '../common/createCard';
import { CompanyInterfaceKeys,defaultValues } from './selectOptions';
import { CompanyKeyInfo } from './selectOptions';
import { getCurrencySymbol } from '@/lib/currency-utils';
import { CURRENCY_CODES } from '@/lib/currencyCode';
import { extractErrorMessage } from '@/lib/utils';
import { Pagination } from '@/components/ui/pagination';
import type { DataTableQueryState } from "../common/DataTable/DataTable";

const inventoryColumns: Column<CompanyDataInterface>[] = [
  {
    header: 'Name',
    accessor: 'name',
    className: 'font-medium',
  },
  {
    header: 'Affiliation',
    accessor: 'company_type',
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
  {
    header: 'Address',
    accessor: 'short_address',
    render: (value) => value || 'N/A',
    info: 'Category to which the inventory belong',
  },
  {
    header: 'Currency',
    accessor: 'currency',
    render: (value) => {
      const currencyCode = typeof value === 'string' ? value.trim().toUpperCase() : ''
      return currencyCode && currencyCode !== 'NULL'
        ? `${getCurrencySymbol(currencyCode)} ${currencyCode}`
        : 'N/A'
    },
    info: 'Category to which the inventory belong',
  },
  
];

function CompanyView() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const navigationRouter = useNavigationRouter();
  const tableStateKey = "table_companies";
  const [tableQueryState, setTableQueryState] = useState<DataTableQueryState | null>(null);
  const search = tableQueryState?.searchTerm ?? searchParams.get(`${tableStateKey}_search`) ?? "";
  const isSupplier = tableQueryState?.filters.is_supplier ?? searchParams.get(`${tableStateKey}_filter_is_supplier`) ?? undefined;
  const isCustomer = tableQueryState?.filters.is_customer ?? searchParams.get(`${tableStateKey}_filter_is_customer`) ?? undefined;
  const isManufacturer = tableQueryState?.filters.is_manufacturer ?? searchParams.get(`${tableStateKey}_filter_is_manufacturer`) ?? undefined;
  const currency = tableQueryState?.filters.currency ?? searchParams.get(`${tableStateKey}_filter_currency`) ?? undefined;
  const sortField = tableQueryState?.sortConfig?.key ?? searchParams.get(`${tableStateKey}_sort`);
  const sortDirection = tableQueryState?.sortConfig?.direction ?? searchParams.get(`${tableStateKey}_direction`);
  const orderingFields: Record<string, string> = { name: "name", email: "email", phone: "phone", currency: "currency" };
  const ordering = sortField && orderingFields[sortField]
    ? `${sortDirection === "descending" ? "-" : ""}${orderingFields[sortField]}`
    : undefined;
  const page = Number(searchParams.get(`${tableStateKey}_page`)) || 1;
  const deferredSearch = useDeferredValue(search.trim());
  const { data: companyPage, isLoading, refetch, error } = useListCompanyPageQuery({
    page,
    page_size: 20,
    search: deferredSearch || undefined,
    // Empty DataTable filter values mean "all", not false.
    is_supplier: isSupplier ? isSupplier === "true" : undefined,
    is_customer: isCustomer ? isCustomer === "true" : undefined,
    is_manufacturer: isManufacturer ? isManufacturer === "true" : undefined,
    currency,
    ordering,
  });
  const data = companyPage?.results ?? [];
  const [createInventory, { isLoading: companyCreateLoading }] = useCreateCompanyMutation();
  const [isCreateOpen, setIsCreateOpen] = useState(false); 
  const router = useRouter();
  

  const currencyOptions = CURRENCY_CODES.map(currency => ({
  value: currency,
  text: `${getCurrencySymbol(currency)} ${currency} `
}));
  const  selectOptions = {
          
    currency:currencyOptions,
  }
  
  const handleCreate = async (createdData: Partial<CompanyDataInterface>) => {
    await createInventory(createdData).unwrap();
    setIsCreateOpen(false); 
    await refetch(); 
  };


  const handleRefresh = async () => {
    await refetch();
  };

  const handleRowClick = (row: CompanyDataInterface) => {
    router.push(`/companies/${row.id}`);
  };

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Unable to load company records: {extractErrorMessage(error, ["detail", "error"])}
      </div>
    );
  }
   const notEditableCompanyFields: (keyof CompanyDataInterface)[] = [
    'id',
    'created_by',
    'attachments',
    'currency_name',  // If you have a resolved currency display name
    'created_at',     // If available in API
    'updated_at',     // If available in API
    'company_type',     // If available in API
  ];

  

  return (
    <div>
      
      <DataTable<CompanyDataInterface>
        columns={inventoryColumns}
        data={data || []}
        isLoading={isLoading}
        error={error}
        errorMessage="Unable to load company records."
        onRetry={refetch}
        onRowClick={handleRowClick}
        searchableFields={['name', 'email', 'phone', 'short_address']}
        filterableFields={['is_supplier', 'is_customer', 'is_manufacturer', 'currency']}
        filterOptions={{
          is_supplier: [{ value: "true", label: "Supplier" }, { value: "false", label: "Not a supplier" }],
          is_customer: [{ value: "true", label: "Customer" }, { value: "false", label: "Not a customer" }],
          is_manufacturer: [{ value: "true", label: "Manufacturer" }, { value: "false", label: "Not a manufacturer" }],
          currency: currencyOptions.map(({ value, text }) => ({ value, label: text })),
        }}
        sortableFields={['name', 'email', 'phone', 'currency']}
        serverSide
        urlStateKey="companies"
        onQueryStateChange={(nextState) => {
          setTableQueryState(nextState);
          if (page > 1) {
            const params = new URLSearchParams(searchParams.toString());
            params.delete(`${tableStateKey}_page`);
            const query = params.toString();
            navigationRouter.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
          }
        }}
        title="Company"
        onClose={() => setIsCreateOpen(true)}
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
        <span>{companyPage ? `${companyPage.count} ${companyPage.count === 1 ? "company" : "companies"}` : ""}</span>
        <Pagination
          currentPage={companyPage?.page ?? page}
          totalPages={companyPage?.total_pages ?? 0}
          onPageChange={(nextPage) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set(`${tableStateKey}_page`, String(nextPage));
            navigationRouter.push(`${pathname}?${params.toString()}`, { scroll: false });
          }}
        />
      </div>

      {isCreateOpen ? (
        <CustomCreateCard
          defaultValues={defaultValues}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreate}
          isLoading={companyCreateLoading}
          selectOptions={selectOptions}
          keyInfo={CompanyKeyInfo}
          notEditableFields={notEditableCompanyFields}
          interfaceKeys={CompanyInterfaceKeys}
          itemTitle='Create Company'

          optionalFields={[
            'website',
            'phone',
            'email',
            'link',
            'is_supplier',
            'is_customer',
            'is_manufacturer',
            'description',
            'short_address',
            'company_type',
          ]}
        />
      ) : null}
    </div>
  );
}

export default CompanyView;
