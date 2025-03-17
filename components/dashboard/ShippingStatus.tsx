// components/dashboard/ShippingStatus.tsx
import { Package, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function ShippingStatus() {
  const shipments = [
    { id: 'SH-1234', type: 'Incoming', status: 'In Transit', progress: 60 },
    { id: 'SH-1235', type: 'Outgoing', status: 'Delayed', progress: 30 },
    { id: 'SH-1236', type: 'Incoming', status: 'Delivered', progress: 100 },
  ];

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Shipping Status</h2>
        <Package className="w-6 h-6 text-violet-600" />
      </div>

      <div className="space-y-4">
        {shipments.map((shipment) => (
          <div key={shipment.id} className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                {shipment.status === 'Delivered' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : shipment.status === 'Delayed' ? (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                ) : (
                  <Clock className="w-5 h-5 text-blue-600" />
                )}
                <span className="font-medium">{shipment.id}</span>
                <span className="text-sm text-gray-500">({shipment.type})</span>
              </div>
              <span className={`text-sm ${
                shipment.status === 'Delivered' ? 'text-green-600' :
                shipment.status === 'Delayed' ? 'text-red-600' :
                'text-blue-600'
              }`}>
                {shipment.status}
              </span>
            </div>
            
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-500" 
                style={{ width: `${shipment.progress}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}