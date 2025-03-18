// components/dashboard/RealTimeUpdates.tsx
'use client';
import { useEffect, useState } from 'react';
import { RefreshCw, Package, CheckCircle, AlertTriangle } from 'lucide-react';

interface Event {
  type: 'restock' | 'lowstock' | 'order';
  product: string;
  quantity: number;
}

type Callback = (event: Event) => void;

const simulateWebSocket = (callback: Callback): (() => void) => {
  const events: Event[] = [
    { type: 'restock', product: 'Wireless Headphones', quantity: 50 },
    { type: 'lowstock', product: 'Smart Watches', quantity: 8 },
    { type: 'order', product: 'Bluetooth Speaker', quantity: 12 },
  ];

  let index = 0;
  const interval = setInterval(() => {
    callback(events[index]);
    index = (index + 1) % events.length;
  }, 5000);

  return () => clearInterval(interval);
};


export default function RealTimeUpdates() {
  const [updates, setUpdates] = useState<{ id: number; type: 'restock' | 'lowstock' | 'order'; product: string; quantity: number; timestamp: string; }[]>([]);

  useEffect(() => {
    return simulateWebSocket((event) => {
      setUpdates(prev => [
        {
          id: Date.now(),
          type: event.type,
          product: event.product,
          quantity: event.quantity,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 4),
      ]);
    });
  }, []);

  interface EventDetails {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    text: string;
  }

  const getEventDetails = (type: 'restock' | 'lowstock' | 'order'): EventDetails => {
    switch (type) {
      case 'restock':
        return { icon: CheckCircle, color: 'bg-green-100', text: 'text-green-800' };
      case 'lowstock':
        return { icon: AlertTriangle, color: 'bg-red-100', text: 'text-red-800' };
      default:
        return { icon: Package, color: 'bg-blue-100', text: 'text-blue-800' };
    }
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Real-Time Updates</h2>
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 text-purple-600 animate-spin" />
          <span className="text-sm text-gray-500">Live</span>
        </div>
      </div>

      <div className="space-y-4">
        {updates.map((update) => {
          const { icon: Icon, color, text } = getEventDetails(update.type);
          return (
            <div
              key={update.id}
              className="p-4 rounded-lg flex items-center space-x-4 animate-fade-in"
            >
              <div className={`p-2 rounded-lg ${color}`}>
                <Icon className={`w-5 h-5 ${text}`} />
              </div>
              <div className="flex-1">
                <p className="font-medium">{update.product}</p>
                <p className="text-sm text-gray-500">
                  {update.type === 'restock' && `Restocked ${update.quantity} units`}
                  {update.type === 'lowstock' && `Low stock alert (${update.quantity} units)`}
                  {update.type === 'order' && `${update.quantity} units ordered`}
                </p>
              </div>
              <span className="text-sm text-gray-500">{update.timestamp}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}