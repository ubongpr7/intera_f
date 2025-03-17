// components/landing/DashboardPreview.tsx
import Image from 'next/image';

export default function DashboardPreview() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12 text-50">Powerful Inventory Analytics</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="aspect-video bg-gray-100  rounded-lg mb-4 flex items-center justify-center">
              <p className="text-gray-500 ">Stock Movement Visualization</p>
            </div>
            <h3 className="text-xl font-semibold mb-2 ">Live Inventory Dashboard</h3>
            <p className="text-gray-600 ">
              Track stock levels, transfers, and expiry dates in real-time across all locations
            </p>
          </div>

          <div className="bg-white  p-6 rounded-xl shadow-lg">
            <div className="aspect-video bg-gray-100  rounded-lg mb-4 flex items-center justify-center">
              <p className="text-gray-500 ">Sales Performance Chart</p>
            </div>
            <h3 className="text-xl font-semibold mb-2 ">Sales & Profit Reports</h3>
            <p className="text-gray-600 ">
              Daily, weekly, and monthly reports with export capabilities
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}