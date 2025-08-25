'use client'
import { formatDateTime } from '../common/utils';
import { useGetUserActivitiesQuery } from '../../redux/features/users/activityLogs';
import LoadingAnimation from '../common/LoadingAnimation';
import { DataTable,Column } from '../common/DataTable/DataTable';
import { ActivityLogInterface } from '../interfaces/User';
import { useEffect } from 'react';

export function capitalizeSentence(sentence:string) {
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}
const renderDetails = (details: ActivityLogInterface['details']) => {
  const SKIP_FIELDS = ['updated_at', 'created_at'];
  
  // Format field names for display
  const formatFieldName = (field: string) => {
    return field
      .replace(/^re_/i, 'RE ') // Handle re_ prefix specially
      .replace(/_/g, ' ')      // Replace all underscores with spaces
      .replace(/\b\w/g, char => char.toUpperCase()); // Capitalize words
  };

  // Filter and process changes
  const filteredChanges = Object.entries(details?.changes || {})
    .filter(([field]) => !SKIP_FIELDS.includes(field))
    .map(([field, change]) => ({
      field: formatFieldName(field),
      old: change.old,
      new: change.new
    }));

  return (
    <div className="space-y-2 max-w-[300px]">
      {/* Changes Section */}
      {filteredChanges.length > 0 ? (
        <div className="border-b pb-2">
          <h4 className="text-sm font-semibold mb-1">Changes:</h4>
          <dl className="space-y-1">
            {filteredChanges.map(({ field, old, new: newValue }) => (
              <div key={field} className="flex gap-2">
                <dt className="font-medium text-gray-600 flex-shrink-0">
                  {field}:
                </dt>
                <dd className="text-gray-700">
                  {old !== undefined && (
                    <span className="line-through text-red-500 mr-2">
                      {String(old)}
                    </span>
                  )}
                  <span className="text-green-600">
                    {old !== undefined && '→ '}
                    {String(newValue)}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : (
        <div className="text-gray-400 text-sm">
          No significant changes recorded
        </div>
      )}

      {/* Metadata Section */}
      <div className="space-y-1 text-sm">
        {details?.ip_address && (
          <div className="flex gap-2">
            <span className="font-medium text-gray-600">IP:</span>
            <span className="text-gray-700">{details.ip_address}</span>
          </div>
        )}
        
      </div>
    </div>
  );
};
const logsColumns:Column<ActivityLogInterface>[]=[
  
  {
    header: 'Details',
    accessor: 'details',
    render: (value) => value ? renderDetails(value) : <span className="text-gray-400">N/A</span>,
    className: 'font-medium',
  },  
  {
    header: 'Action',
    accessor: 'action',
    className: 'font-medium capitalize',
  },
  {
    header: 'Model',
    accessor: 'model_name',
    render: (value) => value || 'N/A',
    className: 'font-medium capitalize',
  },
  {
    header: 'Identifier',
    accessor: 'model_identifier',
    render: (value) => value || 'N/A',
    className: 'font-medium capitalize',
  },
  
  {
    header: 'Time',
    accessor: 'timestamp',
    render: (value) => formatDateTime(value) || 'N/A',
    className: 'font-medium',
  },
  

]
interface ActivityLogsProps {
  userId: string;
  refetchData: boolean;
  onRefetchComplete: () => void;
}

const ActivityLogs = ({ userId,
  refetchData,
  onRefetchComplete
 }: ActivityLogsProps) => {
  const { data, isLoading, error,refetch } = useGetUserActivitiesQuery(userId,
    {
      skip: !userId || userId === "0",
    }
   );
useEffect(() => {
    if (refetchData && data) {
      refetch().finally(() => {
        onRefetchComplete();
      });
    }
  }, [refetchData, refetch, onRefetchComplete]);

  if (isLoading) return <LoadingAnimation  />;
  if (error) return <div className="text-red-500 p-4">Error loading activity logs</div>;
const handleRowClick = (row: ActivityLogInterface) => {
  };
  return (
          <DataTable<ActivityLogInterface>
            columns={logsColumns}
            data={data || []}
            isLoading={isLoading}
            onRowClick={handleRowClick}
            searchableFields={['action', 'model_name', 'model_identifier']}
            filterableFields={['action']}
            sortableFields={['action', 'model_name', 'model_identifier']}
          />
    
  )
};

export default ActivityLogs;