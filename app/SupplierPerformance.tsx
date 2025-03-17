// components/dashboard/SupplierPerformance.tsx
import { Truck, Clock, Star } from 'lucide-react';

export default function SupplierPerformance() {
  const suppliers = [
    { name: 'TechParts Inc.', rating: 4.8, leadTime: '2 days', status: 'Excellent' },
    { name: 'Global Electronics', rating: 3.9, leadTime: '5 days', status: 'Good' },
    { name: 'Prime Suppliers', rating: 2.4, leadTime: '14 days', status: 'Poor' },
  ];

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Supplier Performance</h2>
        <Truck className="w-6 h-6 text-indigo-600" />
      </div>

      <div className="space-y-4">
        {suppliers.map((supplier) => (
          <div key={supplier.name} className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{supplier.name}</span>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-200" />
                <span>{supplier.rating}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>{supplier.leadTime}</span>
              </div>
              <span className={`px-2 py-1 rounded-full text-sm ${
                supplier.status === 'Excellent' ? 'bg-green-100 text-green-800' :
                supplier.status === 'Good' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'
              }`}>
                {supplier.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}