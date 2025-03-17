// components/dashboard/StockAging.tsx
import { Calendar, Clock, AlertTriangle } from 'lucide-react';

export default function StockAging() {
  const agingData = [
    { range: '0-30 Days', items: 234, color: 'bg-green-500' },
    { range: '31-60 Days', items: 89, color: 'bg-amber-500' },
    { range: '61-90 Days', items: 34, color: 'bg-orange-500' },
    { range: '90+ Days', items: 12, color: 'bg-red-500' },
  ];

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Stock Aging</h2>
        <Calendar className="w-6 h-6 text-sky-600" />
      </div>

      <div className="space-y-6">
        {agingData.map((item) => (
          <div key={item.range} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
              <span className="text-sm">{item.range}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">{item.items}</span>
              <span className="text-gray-500 text-sm">items</span>
            </div>
          </div>
        ))}

        <div className="p-4 bg-red-50 rounded-lg flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <p className="text-sm">
            <span className="font-medium">12 items</span> exceeded 90 days in stock
          </p>
        </div>
      </div>
    </div>
  );
}