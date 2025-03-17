// components/dashboard/ABCAnalysis.tsx
import { BarChart, Star } from 'lucide-react';

export default function ABCAnalysis() {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">ABC Analysis</h2>
        <BarChart className="w-6 h-6 text-emerald-600" />
      </div>

      <div className="flex items-end gap-4 mb-8">
        <div className="flex-1">
          <div className="h-24 bg-blue-50 rounded-t-lg flex items-center justify-center">
            <Star className="w-6 h-6 text-blue-600" />
          </div>
          <div className="bg-blue-100 p-3 rounded-b-lg text-center">
            <p className="text-sm font-medium">Class A</p>
            <p className="text-lg font-bold">15% SKUs</p>
            <p className="text-sm text-gray-500">70% Value</p>
          </div>
        </div>

        <div className="flex-1">
          <div className="h-16 bg-green-50 rounded-t-lg flex items-center justify-center">
            <Star className="w-6 h-6 text-green-600" />
          </div>
          <div className="bg-green-100 p-3 rounded-b-lg text-center">
            <p className="text-sm font-medium">Class B</p>
            <p className="text-lg font-bold">30% SKUs</p>
            <p className="text-sm text-gray-500">25% Value</p>
          </div>
        </div>

        <div className="flex-1">
          <div className="h-8 bg-purple-50 rounded-t-lg flex items-center justify-center">
            <Star className="w-6 h-6 text-purple-600" />
          </div>
          <div className="bg-purple-100 p-3 rounded-b-lg text-center">
            <p className="text-sm font-medium">Class C</p>
            <p className="text-lg font-bold">55% SKUs</p>
            <p className="text-sm text-gray-500">5% Value</p>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-500 text-center">
        Based on Pareto principle - 80/20 rule analysis
      </p>
    </div>
  );
}