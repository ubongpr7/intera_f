// components/dashboard/CategoryStock.tsx
import { PieChart } from 'lucide-react';

export default function CategoryStock() {
  const categories = [
    { name: 'Electronics', value: 45, color: 'bg-blue-500' },
    { name: 'Apparel', value: 25, color: 'bg-green-500' },
    { name: 'Home Goods', value: 15, color: 'bg-purple-500' },
    { name: 'Accessories', value: 15, color: 'bg-orange-500' },
  ];

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Stock by Category</h2>
        <PieChart className="w-6 h-6 text-rose-600" />
      </div>

      <div className="flex items-center gap-8">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
          <span className="text-2xl font-bold">100%</span>
        </div>

        <div className="flex-1 space-y-4">
          {categories.map((category) => (
            <div key={category.name} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                <span className="text-sm">{category.name}</span>
              </div>
              <span className="font-medium">{category.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}