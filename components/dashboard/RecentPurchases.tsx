// components/dashboard/RecentPurchases.tsx
import { ClipboardList, Clock, Check, AlertCircle } from 'lucide-react';

export default function RecentPurchases() {
  const purchases = [
    { po: 'PO-1001', supplier: 'Tech Corp', status: 'Pending', amount: '$4,500' },
    { po: 'PO-1002', supplier: 'Raw Materials Ltd', status: 'Received', amount: '$8,200' },
    { po: 'PO-1003', supplier: 'Packaging Inc', status: 'Delayed', amount: '$1,200' },
  ];

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Recent Purchases</h2>
        <ClipboardList className="w-6 h-6 text-amber-600" />
      </div>

      <div className="space-y-4">
        {purchases.map((purchase) => (
          <div key={purchase.po} className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{purchase.po}</span>
              <div className="flex items-center space-x-2">
                {purchase.status === 'Pending' && <Clock className="w-4 h-4 text-amber-600" />}
                {purchase.status === 'Received' && <Check className="w-4 h-4 text-green-600" />}
                {purchase.status === 'Delayed' && <AlertCircle className="w-4 h-4 text-red-600" />}
                <span className={`text-sm ${
                  purchase.status === 'Pending' ? 'text-amber-600' :
                  purchase.status === 'Received' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {purchase.status}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{purchase.supplier}</span>
              <span className="font-medium">{purchase.amount}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}