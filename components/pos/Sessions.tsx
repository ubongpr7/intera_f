
"use client"
import React from 'react';
import { DataTable, Column } from '@/components/common/DataTable/DataTable';
import { useGetSessionsQuery } from '@/redux/features/pos/posAPISlice';

interface POSSession {
  id: string;
  start_time: string;
  end_time: string;
  opening_balance: string;
  closing_balance: string;
  user: string;
}

const Sessions = () => {
  const { data: sessions, isLoading } = useGetSessionsQuery("");

  const columns: Column<POSSession>[] = [
    { header: 'User', accessor: 'user' },
    { header: 'Start Time', accessor: 'start_time' },
    { header: 'End Time', accessor: 'end_time' },
    { header: 'Opening Balance', accessor: 'opening_balance' },
    { header: 'Closing Balance', accessor: 'closing_balance' },
  ];

  return (
    <div>
      <DataTable
        columns={columns}
        data={sessions || []}
        isLoading={isLoading}
      />
    </div>
  );
};

export default Sessions;
