// components/dashboard/SupplierCard.tsx
'use client';
import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { Truck, Clock, Star, X } from 'lucide-react';

const SupplierDetailsModal = ({ supplier, onClose }) => (
  <Dialog open={true} onClose={onClose} className="fixed inset-0 z-10 overflow-y-auto">
    <div className="flex items-center justify-center min-h-screen">
      <Dialog.Overlay className="fixed inset-0 bg-black/30" />
      
      <div className="relative bg-white rounded-xl p-8 max-w-2xl mx-4 shadow-xl">
        <div className="flex justify-between items-start mb-6">
          <Dialog.Title className="text-2xl font-semibold">{supplier.name}</Dialog.Title>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="font-medium">Lead Time</span>
            </div>
            <p className="text-3xl font-bold">{supplier.avgLeadTime} days</p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Star className="w-5 h-5 text-green-600" />
              <span className="font-medium">Rating</span>
            </div>
            <p className="text-3xl font-bold">{supplier.rating}/5</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <h3 className="font-medium text-lg">Performance Metrics</h3>
          <div className="flex justify-between items-center">
            <span>On-Time Delivery</span>
            <span className="font-medium">94%</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Order Accuracy</span>
            <span className="font-medium">98%</span>
          </div>
        </div>
      </div>
    </div>
  </Dialog>
);

export default function SupplierCard() {
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const suppliers = [
    { name: "TechParts Co", avgLeadTime: 2, rating: 4.8 },
    { name: "Global Supply", avgLeadTime: 5, rating: 3.9 },
  ];

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Top Suppliers</h2>
        <Truck className="w-6 h-6 text-amber-600" />
      </div>

      <div className="space-y-4">
        {suppliers.map((supplier) => (
          <div
            key={supplier.name}
            onClick={() => setSelectedSupplier(supplier)}
            className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{supplier.name}</span>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="font-medium">{supplier.avgLeadTime} days</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedSupplier && (
        <SupplierDetailsModal
          supplier={selectedSupplier}
          onClose={() => setSelectedSupplier(null)}
        />
      )}
    </div>
  );
}