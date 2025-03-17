// components/dashboard/StockAlerts.tsx
import { AlertTriangle, Package } from 'lucide-react';

export default function StockAlerts() {
  const alerts = [
    { sku: 'SKU-123', product: 'Wireless Headphones', stock: 4 },
    { sku: 'SKU-456', product: 'Smart Watch', stock: 2 },
    { sku: 'SKU-789', product: 'Bluetooth Speaker', stock: 5 },
  ];

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Stock Alerts</h2>
        <AlertTriangle className="w-6 h-6 text-red-600" />
      </div>

      <div className="space-y-4">
        {alerts.map((alert) => (
          <div key={alert.sku} className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <p className="font-medium mb-1">{alert.product}</p>
              <p className="text-sm text-gray-500">{alert.sku}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-red-600" />
              <span className="text-red-600 font-bold">{alert.stock}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}