// components/DataTable.tsx
import React from 'react';
import { FieldInfo } from '../fileFieldInfor';
import LoadingAnimation from '../LoadingAnimation';
import CustomCreateCard from '../createCard';
export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
  headerClassName?: string;
  render?: (value: any, row: T) => React.ReactNode;
  info?:string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  onRowClick?: (row: T) => void;

}

export function DataTable<T>({ 
  columns, 
  data, 
  isLoading,
  onRowClick ,
  
}: DataTableProps<T>) {
  return (
    <div className="rounded-lg border border-gray-200  overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 ">
          <thead className="bg-gray-50  sticky top-0">
            <tr>
              {columns.map((column, idx) => (
                <th
                  key={idx}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500  uppercase tracking-wider ${
                    column.headerClassName || ''
                  }`}
                >
                  {column.header} 
                  {column.info && (
                    <FieldInfo info={column.info} displayBelow={true} />
                  )}
            
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody className="bg-white  divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick?.(row)}
                className={`${
                  onRowClick ? 'cursor-pointer hover:bg-gray-50 ' : ''
                } transition-colors`}
              >
                {columns.map((column, colIndex) => {
                  const value = typeof column.accessor === 'function'
                    ? column.accessor(row)
                    : row[column.accessor as keyof T];

                  return (
                    <td
                      key={colIndex}
                      className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900  ${
                        column.className || ''
                      }`}
                    >
                      {column.render ? column.render(value, row) : (value as React.ReactNode)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        
        {!isLoading && data.length === 0 && (
          <div className="text-center py-8 text-gray-500 ">
            No records found
          </div>
        )}
        {isLoading && data.length === 0 && (
          <div className="text-center flex items-center justify-center py-8 text-gray-500 ">
          <LoadingAnimation text="Loading..." ringColor="#3b82f6" />
          </div>
        )}
      </div>
      
    </div>
  );
}