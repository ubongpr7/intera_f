// components/dashboard/CycleCountStatus.tsx
import { ClipboardCheck, AlertCircle, TrendingUp } from 'lucide-react';

export default function CycleCountStatus() {
  const counts = [
    { location: "Warehouse A", progress: 85, variance: 0.2 },
    { location: "Retail Store B", progress: 45, variance: 1.8 },
    { location: "Storage Room C", progress: 92, variance: 0.1 },
  ];

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Cycle Count Status</h2>
        <ClipboardCheck className="w-6 h-6 text-lime-600" />
      </div>

      <div className="space-y-4">
        {counts.map((count) => (
          <div key={count.location} className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">{count.location}</span>
              <div className="flex items-center space-x-2">
                {count.variance > 1 ? (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                )}
                <span className={`text-sm ${
                  count.variance > 1 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {count.variance}% variance
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-lime-500 transition-all duration-500" 
                  style={{ width: `${count.progress}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-500">{count.progress}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}