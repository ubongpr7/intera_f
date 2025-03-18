// components/dashboard/InventoryMovementChart.tsx
'use client';
import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '../buttons/button';
import { ArrowUp, ArrowDown, Activity } from 'lucide-react';

const data = [
  { date: 'Mon', incoming: 45, outgoing: 32 },
  { date: 'Tue', incoming: 68, outgoing: 45 },
  { date: 'Wed', incoming: 32, outgoing: 68 },
  { date: 'Thu', incoming: 54, outgoing: 38 },
  { date: 'Fri', incoming: 72, outgoing: 52 },
  { date: 'Sat', incoming: 45, outgoing: 65 },
  { date: 'Sun', incoming: 38, outgoing: 48 },
];

export default function InventoryMovementChart() {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold">Inventory Movement</h2>
          <div className="flex space-x-2">
            <Button
              variant={viewMode === 'daily' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('daily')}
            >
              Daily
            </Button>
            <Button
              variant={viewMode === 'weekly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('weekly')}
            >
              Weekly
            </Button>
          </div>
        </div>
        <Activity className="w-6 h-6 text-sky-600" />
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorIncoming" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorOutgoing" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              contentStyle={{ 
                border: 'none', 
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
              }}
            />
            <Area
              type="monotone"
              dataKey="incoming"
              stroke="#3B82F6"
              fillOpacity={1}
              fill="url(#colorIncoming)"
            />
            <Area
              type="monotone"
              dataKey="outgoing"
              stroke="#EF4444"
              fillOpacity={1}
              fill="url(#colorOutgoing)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="p-4 bg-blue-50 rounded-lg flex items-center space-x-3">
          <ArrowUp className="w-6 h-6 text-blue-600" />
          <div>
            <p className="text-sm text-gray-500">Avg. Daily Incoming</p>
            <p className="text-xl font-bold">54 units</p>
          </div>
        </div>
        <div className="p-4 bg-red-50 rounded-lg flex items-center space-x-3">
          <ArrowDown className="w-6 h-6 text-red-600" />
          <div>
            <p className="text-sm text-gray-500">Avg. Daily Outgoing</p>
            <p className="text-xl font-bold">48 units</p>
          </div>
        </div>
      </div>
    </div>
  );
}