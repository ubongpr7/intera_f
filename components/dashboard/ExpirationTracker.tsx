// components/dashboard/ExpirationTracker.tsx
import { Hourglass, AlertTriangle } from 'lucide-react';

export default function ExpirationTracker() {
  const expiringItems = [
    { product: 'Vitamin C Serum', batch: 'VC-2304', daysLeft: 12 },
    { product: 'Protein Powder', batch: 'PP-2305', daysLeft: 23 },
    { product: 'Disinfectant Wipes', batch: 'DW-2306', daysLeft: 45 },
  ];

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Expiration Tracker</h2>
        <Hourglass className="w-6 h-6 text-rose-600" />
      </div>

      <div className="space-y-4">
        {expiringItems.map((item) => (
          <div key={item.batch} className="p-4 bg-rose-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{item.product}</span>
              <div className="flex items-center space-x-1">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span className="text-rose-600 font-medium">{item.daysLeft} days</span>
              </div>
            </div>
            <p className="text-sm text-gray-500">{item.batch}</p>
          </div>
        ))}
      </div>
    </div>
  );
}